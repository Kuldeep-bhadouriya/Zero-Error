import crypto from 'crypto'
import { z } from 'zod'

const DISCORD_OAUTH_AUTHORIZE_URL = 'https://discord.com/oauth2/authorize'
const DISCORD_OAUTH_TOKEN_URL = 'https://discord.com/api/oauth2/token'
const DISCORD_USERS_ME_URL = 'https://discord.com/api/users/@me'
const DISCORD_LINK_STATE_TTL_SECONDS = 10 * 60

const discordStatePayloadSchema = z.object({
  userId: z.string().trim().min(1, 'Missing user ID in state payload'),
  redirectTo: z
    .string()
    .trim()
    .startsWith('/', 'Redirect path must start with /')
    .max(512, 'Redirect path is too long')
    .optional(),
  exp: z.number().int().positive(),
  nonce: z.string().trim().min(1),
})

const discordProfileSchema = z.object({
  id: z.string().trim().min(1),
  username: z.string().trim().min(1),
  global_name: z.string().trim().optional().nullable(),
  avatar: z.string().trim().optional().nullable(),
})

export const discordLinkStartBodySchema = z.object({
  redirectTo: z
    .string()
    .trim()
    .startsWith('/', 'Redirect path must start with /')
    .max(512, 'Redirect path is too long')
    .optional(),
})

export const discordLinkCallbackQuerySchema = z.object({
  code: z.string().trim().min(1, 'Missing OAuth code'),
  state: z.string().trim().min(1, 'Missing OAuth state'),
  error: z.string().trim().optional(),
  error_description: z.string().trim().optional(),
})

export type DiscordOAuthProfile = {
  id: string
  username: string
  globalName?: string
  avatar?: string
  avatarUrl?: string
}

type StateInput = {
  userId: string
  redirectTo?: string
}

type VerifyStateInput = {
  state: string
  expectedUserId: string
}

function getSigningSecret() {
  const secret = process.env.NEXTAUTH_SECRET || process.env.DISCORD_CLIENT_SECRET
  if (!secret) {
    throw new Error('Missing signing secret for Discord link state')
  }

  return secret
}

function encodeBase64Url(input: string) {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function decodeBase64Url(input: string) {
  return Buffer.from(input, 'base64url').toString('utf8')
}

function signPayload(payloadPart: string) {
  return crypto
    .createHmac('sha256', getSigningSecret())
    .update(payloadPart)
    .digest('base64url')
}

export function createDiscordLinkState(input: StateInput) {
  const payload = {
    userId: input.userId,
    redirectTo: input.redirectTo,
    exp: Math.floor(Date.now() / 1000) + DISCORD_LINK_STATE_TTL_SECONDS,
    nonce: crypto.randomUUID(),
  }

  const payloadPart = encodeBase64Url(JSON.stringify(payload))
  const signaturePart = signPayload(payloadPart)

  return {
    state: `${payloadPart}.${signaturePart}`,
    expiresAt: new Date(payload.exp * 1000),
  }
}

export function verifyDiscordLinkState(input: VerifyStateInput) {
  const [payloadPart, signaturePart] = input.state.split('.')

  if (!payloadPart || !signaturePart) {
    return { valid: false as const, reason: 'Malformed OAuth state' }
  }

  const expectedSignature = signPayload(payloadPart)
  const givenSignatureBuffer = Buffer.from(signaturePart)
  const expectedSignatureBuffer = Buffer.from(expectedSignature)

  if (
    givenSignatureBuffer.length !== expectedSignatureBuffer.length ||
    !crypto.timingSafeEqual(givenSignatureBuffer, expectedSignatureBuffer)
  ) {
    return { valid: false as const, reason: 'Invalid OAuth state signature' }
  }

  let decodedPayload: unknown
  try {
    decodedPayload = JSON.parse(decodeBase64Url(payloadPart))
  } catch {
    return { valid: false as const, reason: 'Invalid OAuth state payload' }
  }

  const parsed = discordStatePayloadSchema.safeParse(decodedPayload)
  if (!parsed.success) {
    return { valid: false as const, reason: 'Invalid OAuth state data' }
  }

  const payload = parsed.data
  const nowEpoch = Math.floor(Date.now() / 1000)

  if (payload.exp < nowEpoch) {
    return { valid: false as const, reason: 'OAuth state has expired' }
  }

  if (payload.userId !== input.expectedUserId) {
    return { valid: false as const, reason: 'OAuth state user mismatch' }
  }

  return {
    valid: true as const,
    redirectTo: payload.redirectTo,
  }
}

export function buildDiscordAuthorizeUrl(params: {
  state: string
  redirectUri: string
}) {
  const clientId = process.env.DISCORD_CLIENT_ID
  if (!clientId) {
    throw new Error('DISCORD_CLIENT_ID is required for Discord link flow')
  }

  const url = new URL(DISCORD_OAUTH_AUTHORIZE_URL)
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'identify')
  url.searchParams.set('redirect_uri', params.redirectUri)
  url.searchParams.set('state', params.state)

  return url.toString()
}

export async function exchangeCodeForDiscordProfile(params: {
  code: string
  redirectUri: string
}): Promise<DiscordOAuthProfile> {
  const clientId = process.env.DISCORD_CLIENT_ID
  const clientSecret = process.env.DISCORD_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Discord OAuth credentials are not configured')
  }

  const tokenBody = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code: params.code,
    redirect_uri: params.redirectUri,
  })

  const tokenResponse = await fetch(DISCORD_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: tokenBody.toString(),
  })

  if (!tokenResponse.ok) {
    const tokenError = await tokenResponse.text()
    throw new Error(`Discord token exchange failed: ${tokenError || tokenResponse.status}`)
  }

  const tokenPayload = (await tokenResponse.json()) as { access_token?: string }
  if (!tokenPayload.access_token) {
    throw new Error('Discord token exchange succeeded without access token')
  }

  const meResponse = await fetch(DISCORD_USERS_ME_URL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`,
    },
  })

  if (!meResponse.ok) {
    const meError = await meResponse.text()
    throw new Error(`Discord profile fetch failed: ${meError || meResponse.status}`)
  }

  const rawProfile = await meResponse.json()
  const parsedProfile = discordProfileSchema.safeParse(rawProfile)

  if (!parsedProfile.success) {
    throw new Error('Discord profile payload is invalid')
  }

  const profile = parsedProfile.data

  return {
    id: profile.id,
    username: profile.username,
    globalName: profile.global_name || undefined,
    avatar: profile.avatar || undefined,
    avatarUrl: profile.avatar
      ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
      : undefined,
  }
}
