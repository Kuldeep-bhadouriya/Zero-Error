import { NextResponse } from 'next/server'
import { withAuth, withErrorHandling, withRequestLogging } from '@/lib/api/middleware'
import { badRequestFromZod } from '@/lib/validation'
import {
  buildDiscordAuthorizeUrl,
  createDiscordLinkState,
  discordLinkStartBodySchema,
} from '@/lib/discord-link'
import { buildRateLimitHeaders, checkRateLimit, getRateLimitRule } from '@/lib/rate-limit'

const ROUTE_PATH = '/api/user/discord/link/start'

export const POST = withRequestLogging(
  ROUTE_PATH,
  withErrorHandling(
    ROUTE_PATH,
    withAuth(async (req, _context, session) => {
      const rateRule = getRateLimitRule('apiDiscordLinkStart')
      const rateResult = await checkRateLimit({
        request: req,
        userId: session.user.id,
        ...rateRule,
      })

      if (!rateResult.success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429, headers: buildRateLimitHeaders(rateResult) }
        )
      }

      if (!session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      let body: unknown = {}
      try {
        body = await req.json()
      } catch {
        body = {}
      }

      const parsed = discordLinkStartBodySchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json(badRequestFromZod(parsed.error), { status: 400 })
      }

      const callbackUrl = new URL('/api/user/discord/link/callback', req.url).toString()
      const { state, expiresAt } = createDiscordLinkState({
        userId: session.user.id,
        redirectTo: parsed.data.redirectTo,
      })

      return NextResponse.json({
        authorizationUrl: buildDiscordAuthorizeUrl({ state, redirectUri: callbackUrl }),
        expiresAt: expiresAt.toISOString(),
      })
    })
  )
)
