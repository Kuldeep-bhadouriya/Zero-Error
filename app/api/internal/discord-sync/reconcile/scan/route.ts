import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandling,
  withInternalServiceAuth,
  withRequestLogging,
} from '@/lib/api/middleware'
import { badRequestFromZod, objectIdSchema } from '@/lib/validation'
import { buildRateLimitHeaders, checkRateLimit, getRateLimitRule } from '@/lib/rate-limit'
import dbConnect from '@/lib/mongodb'
import logger from '@/lib/logger'
import { getDiscordSyncFlags } from '@/lib/discord-sync-flags'
import { listDiscordReconcileCandidates } from '@/lib/services/discordReconcileService'

const ROUTE_PATH = '/api/internal/discord-sync/reconcile/scan'

const scanBodySchema = z.object({
  guildId: z.string().trim().min(1).max(120),
  userId: objectIdSchema.optional(),
  limit: z.number().int().min(1).max(500).optional(),
})

export const POST = withRequestLogging(
  ROUTE_PATH,
  withErrorHandling(
    ROUTE_PATH,
    withInternalServiceAuth(async (req, _context, service) => {
      const rateRule = getRateLimitRule('apiInternalDiscordSyncReconcileScan')
      const rateResult = await checkRateLimit({
        key: `service:${service.serviceName}`,
        ...rateRule,
      })

      if (!rateResult.success) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.', success: false },
          { status: 429, headers: buildRateLimitHeaders(rateResult) }
        )
      }

      let body: unknown
      try {
        body = await req.json()
      } catch {
        return NextResponse.json({ error: 'Invalid request payload', success: false }, { status: 400 })
      }

      const parsedBody = scanBodySchema.safeParse(body)
      if (!parsedBody.success) {
        return NextResponse.json({ ...badRequestFromZod(parsedBody.error), success: false }, { status: 400 })
      }

      const flags = getDiscordSyncFlags()
      if (!flags.reconcileEnabled) {
        return NextResponse.json(
          {
            error: 'Reconciliation is disabled by feature flag',
            success: false,
          },
          { status: 503 }
        )
      }

      await dbConnect()

      const { guildId, userId, limit } = parsedBody.data

      let result
      try {
        result = await listDiscordReconcileCandidates({ guildId, userId, limit })
      } catch (error) {
        if (
          typeof error === 'object' &&
          error &&
          'code' in error &&
          (error as { code?: string }).code === 'GUILD_CONFIG_NOT_FOUND'
        ) {
          return NextResponse.json(
            { error: 'Active guild config not found for the provided guildId', success: false },
            { status: 404 }
          )
        }
        throw error
      }

      logger.info(
        {
          route: ROUTE_PATH,
          serviceName: service.serviceName,
          correlationId: service.correlationId,
          guildId,
          scopedUserId: result.scopedUserId,
          scannedUsers: result.scannedUsers,
          candidateCount: result.candidates.length,
          skippedMissingMapping: result.skippedMissingMapping,
        },
        'Discord reconcile scan endpoint executed'
      )

      return NextResponse.json({
        success: true,
        data: result,
      })
    })
  )
)
