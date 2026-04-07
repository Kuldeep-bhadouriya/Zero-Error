import { auth } from '@/app/api/auth/[...nextauth]/route'
import { errorResponse } from '@/lib/api-response'
import logger from '@/lib/logger'
import crypto from 'crypto'
import type { Session } from 'next-auth'

type RouteContext = unknown

const INTERNAL_TOKEN_HEADER = 'x-internal-service-token'
const INTERNAL_SIGNATURE_HEADER = 'x-internal-signature'
const INTERNAL_TIMESTAMP_HEADER = 'x-internal-timestamp'
const INTERNAL_NONCE_HEADER = 'x-internal-nonce'
const INTERNAL_SERVICE_NAME_HEADER = 'x-internal-service-name'
const INTERNAL_CORRELATION_ID_HEADER = 'x-correlation-id'

const DEFAULT_INTERNAL_REQUEST_WINDOW_SECONDS = 5 * 60
const replayNonceStore = new Map<string, number>()

export type ApiHandler<C = RouteContext> = (req: Request, context: C) => Promise<Response> | Response

export type AuthenticatedApiHandler<C = RouteContext> = (
  req: Request,
  context: C,
  session: Session
) => Promise<Response> | Response

export type InternalServiceRequestContext = {
  serviceName: string
  correlationId: string
  timestamp: number
  nonce: string
}

export type InternalServiceApiHandler<C = RouteContext> = (
  req: Request,
  context: C,
  service: InternalServiceRequestContext
) => Promise<Response> | Response

function getInternalRequestWindowSeconds() {
  const raw = Number(process.env.INTERNAL_REQUEST_MAX_AGE_SECONDS)
  if (!Number.isFinite(raw) || raw <= 0) {
    return DEFAULT_INTERNAL_REQUEST_WINDOW_SECONDS
  }

  return Math.floor(raw)
}

function clearExpiredReplayNonces(nowMs: number) {
  for (const [key, expiresAtMs] of replayNonceStore.entries()) {
    if (expiresAtMs <= nowMs) {
      replayNonceStore.delete(key)
    }
  }
}

function markReplayNonce(nonceKey: string, windowSeconds: number) {
  const nowMs = Date.now()
  clearExpiredReplayNonces(nowMs)

  const existingExpiry = replayNonceStore.get(nonceKey)
  if (existingExpiry && existingExpiry > nowMs) {
    return false
  }

  replayNonceStore.set(nonceKey, nowMs + windowSeconds * 1000)
  return true
}

function hashBody(body: string) {
  return crypto.createHash('sha256').update(body).digest('hex')
}

function safeCompareSignature(givenSignature: string, expectedSignature: string) {
  const givenBuffer = Buffer.from(givenSignature, 'hex')
  const expectedBuffer = Buffer.from(expectedSignature, 'hex')

  if (givenBuffer.length === 0 || givenBuffer.length !== expectedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(givenBuffer, expectedBuffer)
}

export function buildInternalServiceSignature(params: {
  timestamp: number | string
  nonce: string
  method: string
  path: string
  body: string
  signingSecret: string
}) {
  const canonical = [
    String(params.timestamp),
    params.nonce,
    params.method.toUpperCase(),
    params.path,
    hashBody(params.body),
  ].join('.')

  return crypto.createHmac('sha256', params.signingSecret).update(canonical).digest('hex')
}

async function validateInternalServiceRequest(req: Request) {
  const expectedToken = process.env.INTERNAL_SERVICE_TOKEN
  const signingSecret = process.env.INTERNAL_SIGNING_SECRET

  if (!expectedToken || !signingSecret) {
    logger.error(
      { route: new URL(req.url).pathname },
      'Internal service auth env is missing'
    )
    return {
      ok: false as const,
      response: errorResponse('Internal service auth is not configured', 500),
    }
  }

  const token = req.headers.get(INTERNAL_TOKEN_HEADER)
  const signature = req.headers.get(INTERNAL_SIGNATURE_HEADER)
  const timestampHeader = req.headers.get(INTERNAL_TIMESTAMP_HEADER)
  const nonce = req.headers.get(INTERNAL_NONCE_HEADER)
  const serviceName = req.headers.get(INTERNAL_SERVICE_NAME_HEADER) || 'discord-sync-worker'
  const correlationId = req.headers.get(INTERNAL_CORRELATION_ID_HEADER) || crypto.randomUUID()
  const route = new URL(req.url).pathname

  if (!token || !signature || !timestampHeader || !nonce) {
    logger.warn(
      {
        route,
        serviceName,
        correlationId,
        missingHeaders: {
          token: !token,
          signature: !signature,
          timestamp: !timestampHeader,
          nonce: !nonce,
        },
      },
      'Internal service auth missing required headers'
    )
    return {
      ok: false as const,
      response: errorResponse('Unauthorized', 401),
    }
  }

  if (token !== expectedToken) {
    logger.warn(
      {
        route,
        serviceName,
        correlationId,
      },
      'Internal service auth token mismatch'
    )
    return {
      ok: false as const,
      response: errorResponse('Unauthorized', 401),
    }
  }

  const timestamp = Number(timestampHeader)
  if (!Number.isInteger(timestamp)) {
    logger.warn(
      {
        route,
        serviceName,
        correlationId,
      },
      'Internal service auth timestamp is invalid'
    )
    return {
      ok: false as const,
      response: errorResponse('Unauthorized', 401),
    }
  }

  const maxAgeSeconds = getInternalRequestWindowSeconds()
  const nowSeconds = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSeconds - timestamp) > maxAgeSeconds) {
    logger.warn(
      {
        route,
        serviceName,
        correlationId,
        timestampSkewSeconds: nowSeconds - timestamp,
      },
      'Internal service auth timestamp expired'
    )
    return {
      ok: false as const,
      response: errorResponse('Request timestamp expired', 401),
    }
  }

  const path = route
  const requestBody = await req.clone().text()
  const expectedSignature = buildInternalServiceSignature({
    timestamp,
    nonce,
    method: req.method,
    path,
    body: requestBody,
    signingSecret,
  })

  if (!safeCompareSignature(signature, expectedSignature)) {
    logger.warn(
      {
        route,
        serviceName,
        correlationId,
        signatureLength: signature.length,
      },
      'Internal service auth signature validation failed'
    )
    return {
      ok: false as const,
      response: errorResponse('Unauthorized', 401),
    }
  }

  const replayKey = `${serviceName}:${timestamp}:${nonce}`
  const nonceMarked = markReplayNonce(replayKey, maxAgeSeconds)
  if (!nonceMarked) {
    logger.warn(
      {
        route,
        serviceName,
        correlationId,
      },
      'Internal service auth replay detected'
    )
    return {
      ok: false as const,
      response: errorResponse('Replay detected', 401),
    }
  }

  return {
    ok: true as const,
    service: {
      serviceName,
      correlationId,
      timestamp,
      nonce,
    },
  }
}

export function withErrorHandling<C = RouteContext>(route: string, handler: ApiHandler<C>): ApiHandler<C> {
  return async (req, context) => {
    try {
      return await handler(req, context)
    } catch (error) {
      logger.error({ route, method: req.method, err: error }, 'Unhandled API route error')
      return errorResponse('Internal server error', 500)
    }
  }
}

export function withRequestLogging<C = RouteContext>(route: string, handler: ApiHandler<C>): ApiHandler<C> {
  return async (req, context) => {
    const startedAt = Date.now()
    const response = await handler(req, context)

    logger.info(
      {
        route,
        method: req.method,
        status: response.status,
        durationMs: Date.now() - startedAt,
      },
      'API request completed'
    )

    return response
  }
}

export function withAuth<C = RouteContext>(
  handler: AuthenticatedApiHandler<C>
): ApiHandler<C> {
  return async (req, context) => {
    const session = await auth()
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }

    return handler(req, context, session)
  }
}

export function withAdmin<C = RouteContext>(
  handler: AuthenticatedApiHandler<C>
): ApiHandler<C> {
  return withAuth(async (req, context, session) => {
    if (!session.user.roles?.includes('admin')) {
      return errorResponse('Unauthorized', 401)
    }

    return handler(req, context, session)
  })
}

export function withInternalServiceAuth<C = RouteContext>(
  handler: InternalServiceApiHandler<C>
): ApiHandler<C> {
  return async (req, context) => {
    const authResult = await validateInternalServiceRequest(req)
    if (!authResult.ok) {
      return authResult.response
    }

    return handler(req, context, authResult.service)
  }
}
