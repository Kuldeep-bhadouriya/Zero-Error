import { NextResponse } from 'next/server'
import { withAuth, withErrorHandling, withRequestLogging } from '@/lib/api/middleware'
import {
  discordLinkCallbackQuerySchema,
  exchangeCodeForDiscordProfile,
  verifyDiscordLinkState,
} from '@/lib/discord-link'
import { buildRateLimitHeaders, checkRateLimit, getRateLimitRule } from '@/lib/rate-limit'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'

const ROUTE_PATH = '/api/user/discord/link/callback'

function requestPrefersHtml(req: Request) {
  const acceptHeader = req.headers.get('accept') || ''
  return acceptHeader.includes('text/html')
}

export const GET = withRequestLogging(
  ROUTE_PATH,
  withErrorHandling(
    ROUTE_PATH,
    withAuth(async (req, _context, session) => {
      const rateRule = getRateLimitRule('apiDiscordLinkCallback')
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

      const rawQuery = Object.fromEntries(new URL(req.url).searchParams.entries())
      const parsedQuery = discordLinkCallbackQuerySchema.safeParse(rawQuery)
      if (!parsedQuery.success) {
        return NextResponse.json({ error: 'Invalid callback query parameters' }, { status: 400 })
      }

      const { code, state, error, error_description } = parsedQuery.data
      if (error) {
        return NextResponse.json(
          { error: error_description || `Discord OAuth failed: ${error}` },
          { status: 400 }
        )
      }

      const stateResult = verifyDiscordLinkState({
        state,
        expectedUserId: session.user.id,
      })

      if (!stateResult.valid) {
        return NextResponse.json({ error: stateResult.reason }, { status: 400 })
      }

      const callbackUrl = new URL('/api/user/discord/link/callback', req.url).toString()
      const profile = await exchangeCodeForDiscordProfile({
        code,
        redirectUri: callbackUrl,
      })

      await dbConnect()

      const currentUser = await User.findById(session.user.id)
      if (!currentUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const linkedElsewhere = await User.exists({
        discordId: profile.id,
        _id: { $ne: currentUser._id },
      })

      if (linkedElsewhere) {
        return NextResponse.json(
          { error: 'This Discord account is already linked to another user' },
          { status: 409 }
        )
      }

      if (currentUser.discordId && currentUser.discordId !== profile.id) {
        return NextResponse.json(
          { error: 'This user already has a different linked Discord account. Unlink first.' },
          { status: 409 }
        )
      }

      const now = new Date()
      currentUser.discordId = profile.id
      currentUser.discordUsername = profile.username
      currentUser.discordGlobalName = profile.globalName
      currentUser.discordAvatar = profile.avatarUrl
      currentUser.discordSync = {
        ...currentUser.discordSync,
        linkStatus: 'linked_verified',
        verified: true,
        linkedAt: currentUser.discordSync?.linkedAt || now,
        verifiedAt: now,
        lastSyncStatus: currentUser.discordSync?.lastSyncStatus || 'idle',
        lastSyncError: undefined,
        lastSyncErrorAt: undefined,
      }

      await currentUser.save()

      const redirectTo = stateResult.redirectTo || '/ze-club'
      if (requestPrefersHtml(req)) {
        const redirectUrl = new URL(redirectTo, req.url)
        redirectUrl.searchParams.set('discordLinked', '1')
        return NextResponse.redirect(redirectUrl)
      }

      return NextResponse.json({
        success: true,
        message: 'Discord account linked successfully',
        redirectTo,
        linked: true,
        verified: true,
        eligibleForRoleSync: true,
        discord: {
          id: currentUser.discordId,
          username: currentUser.discordUsername,
          globalName: currentUser.discordGlobalName,
          avatar: currentUser.discordAvatar,
        },
      })
    })
  )
)
