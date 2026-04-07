import { NextResponse } from 'next/server'
import { z } from 'zod'
import { withAuth, withErrorHandling, withRequestLogging } from '@/lib/api/middleware'
import { badRequestFromZod } from '@/lib/validation'
import { buildRateLimitHeaders, checkRateLimit, getRateLimitRule } from '@/lib/rate-limit'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'

const ROUTE_PATH = '/api/user/discord/unlink'

const unlinkBodySchema = z.object({
  confirm: z.literal(true, {
    errorMap: () => ({ message: 'confirm must be true to unlink Discord account' }),
  }),
})

export const POST = withRequestLogging(
  ROUTE_PATH,
  withErrorHandling(
    ROUTE_PATH,
    withAuth(async (req, _context, session) => {
      const rateRule = getRateLimitRule('apiDiscordUnlink')
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

      const parsedBody = unlinkBodySchema.safeParse(await req.json())
      if (!parsedBody.success) {
        return NextResponse.json(badRequestFromZod(parsedBody.error), { status: 400 })
      }

      await dbConnect()

      const user = await User.findById(session.user.id)
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const isLinked = Boolean(user.discordId) && user.discordSync?.linkStatus !== 'unlinked'
      if (!isLinked) {
        return NextResponse.json({ error: 'Discord account is not linked' }, { status: 400 })
      }

      if (user.discordSync?.lastSyncStatus === 'processing') {
        return NextResponse.json(
          { error: 'Cannot unlink while a Discord sync is processing. Try again shortly.' },
          { status: 409 }
        )
      }

      user.set('discordId', undefined)
      user.set('discordUsername', undefined)
      user.set('discordGlobalName', undefined)
      user.set('discordAvatar', undefined)
      user.discordSync = {
        ...user.discordSync,
        linkStatus: 'unlinked',
        verified: false,
        linkedAt: undefined,
        verifiedAt: undefined,
        lastSyncStatus: 'idle',
      }

      await user.save()

      return NextResponse.json({
        success: true,
        message: 'Discord account unlinked successfully',
        linked: false,
        verified: false,
        eligibleForRoleSync: false,
      })
    })
  )
)
