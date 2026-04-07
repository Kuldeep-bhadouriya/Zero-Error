import { NextResponse } from 'next/server'
import { withAuth, withErrorHandling, withRequestLogging } from '@/lib/api/middleware'
import { buildRateLimitHeaders, checkRateLimit, getRateLimitRule } from '@/lib/rate-limit'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'

const ROUTE_PATH = '/api/user/discord/status'

export const GET = withRequestLogging(
  ROUTE_PATH,
  withErrorHandling(
    ROUTE_PATH,
    withAuth(async (req, _context, session) => {
      const rateRule = getRateLimitRule('apiDiscordStatus')
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

      await dbConnect()

      const userRaw = await User.findById(session.user.id).lean()
      const user = userRaw as {
        discordId?: string
        discordUsername?: string
        discordGlobalName?: string
        discordAvatar?: string
        discordSync?: {
          linkStatus?: string
          verified?: boolean
          linkedAt?: Date
          verifiedAt?: Date
          lastSyncedAt?: Date
          lastSyncStatus?: string
          lastSyncError?: string
          lastSyncErrorAt?: Date
        }
      } | null
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const discordSync = user.discordSync || {}
      const linked = Boolean(user.discordId) && discordSync.linkStatus !== 'unlinked'
      const verified = Boolean(discordSync.verified) && linked

      return NextResponse.json({
        linked,
        verified,
        eligibleForRoleSync: linked && verified,
        discord: {
          id: user.discordId || null,
          username: user.discordUsername || null,
          globalName: user.discordGlobalName || null,
          avatar: user.discordAvatar || null,
        },
        sync: {
          linkStatus: discordSync.linkStatus || 'unlinked',
          linkedAt: discordSync.linkedAt || null,
          verifiedAt: discordSync.verifiedAt || null,
          lastSyncedAt: discordSync.lastSyncedAt || null,
          lastSyncStatus: discordSync.lastSyncStatus || 'idle',
          lastSyncError: discordSync.lastSyncError || null,
          lastSyncErrorAt: discordSync.lastSyncErrorAt || null,
        },
      })
    })
  )
)
