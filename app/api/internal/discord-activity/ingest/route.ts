import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  withErrorHandling,
  withInternalServiceAuth,
  withRequestLogging,
} from '@/lib/api/middleware'
import { badRequestFromZod } from '@/lib/validation'
import { buildRateLimitHeaders, checkRateLimit, getRateLimitRule } from '@/lib/rate-limit'
import dbConnect from '@/lib/mongodb'
import logger from '@/lib/logger'
import { DISCORD_ACTIVITY_LEDGER_TYPES } from '@/models/discordActivityLedger'
import { ingestDiscordActivityEvent } from '@/lib/services/discordActivityIngestionService'

const ROUTE_PATH = '/api/internal/discord-activity/ingest'

const ingestBodySchema = z.object({
  sourceEventId: z.string().trim().min(1).max(200),
  discordId: z.string().trim().min(1).max(80),
  guildId: z.string().trim().min(1).max(120).optional(),
  activityType: z.enum(DISCORD_ACTIVITY_LEDGER_TYPES),
  units: z.number().int().min(1).max(50).default(1),
  occurredAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export const POST = withRequestLogging(
  ROUTE_PATH,
  withErrorHandling(
    ROUTE_PATH,
    withInternalServiceAuth(async (req, _context, service) => {
      const rateRule = getRateLimitRule('apiInternalDiscordActivityIngest')
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

      const parsed = ingestBodySchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ ...badRequestFromZod(parsed.error), success: false }, { status: 400 })
      }

      await dbConnect()

      const result = await ingestDiscordActivityEvent({
        sourceEventId: parsed.data.sourceEventId,
        discordId: parsed.data.discordId,
        guildId: parsed.data.guildId,
        activityType: parsed.data.activityType,
        units: parsed.data.units,
        occurredAt: parsed.data.occurredAt ? new Date(parsed.data.occurredAt) : new Date(),
        metadata: parsed.data.metadata,
        correlationId: service.correlationId,
      })

      logger.info(
        {
          route: ROUTE_PATH,
          serviceName: service.serviceName,
          correlationId: service.correlationId,
          sourceEventId: result.sourceEventId,
          status: result.status,
          duplicate: result.duplicate,
          pointsAwarded: result.pointsAwarded,
          rankChanged: result.rankChanged,
          userId: result.userId,
        },
        'Discord activity event ingested'
      )

      return NextResponse.json({
        success: true,
        data: result,
      })
    })
  )
)
