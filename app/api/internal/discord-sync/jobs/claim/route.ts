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
import DiscordSyncJob from '@/models/discordSyncJob'
import DiscordGuildConfig from '@/models/discordGuildConfig'

const ROUTE_PATH = '/api/internal/discord-sync/jobs/claim'

const claimBodySchema = z.object({
  workerId: z.string().trim().min(1, 'workerId is required').max(100),
  guildId: z.string().trim().min(1).max(100).optional(),
  limit: z.number().int().min(1).max(10).default(1),
})

export const POST = withRequestLogging(
  ROUTE_PATH,
  withErrorHandling(
    ROUTE_PATH,
    withInternalServiceAuth(async (req, _context, service) => {
      const rateRule = getRateLimitRule('apiInternalDiscordSyncClaim')
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

      const parsed = claimBodySchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ ...badRequestFromZod(parsed.error), success: false }, { status: 400 })
      }

      await dbConnect()

      const now = new Date()
      const { workerId, guildId, limit } = parsed.data
      const jobs: Array<Record<string, unknown>> = []

      const configuredGuilds = await DiscordGuildConfig.find(
        guildId ? { enabled: true, guildId } : { enabled: true }
      ).lean()

      const rankRoleIdsByGuild = new Map<string, string[]>()
      for (const guildConfig of configuredGuilds) {
        const roleIds = Array.from(
          new Set(
            guildConfig.rankRoleMappings
              .filter((mapping) => mapping.enabled)
              .map((mapping) => mapping.roleId)
          )
        )
        rankRoleIdsByGuild.set(guildConfig.guildId, roleIds)
      }

      for (let i = 0; i < limit; i++) {
        const claimFilter: Record<string, unknown> = {
          status: { $in: ['pending', 'failed'] },
          $or: [
            { nextRetryAt: { $exists: false } },
            { nextRetryAt: null },
            { nextRetryAt: { $lte: now } },
          ],
        }

        if (guildId) {
          claimFilter.guildId = guildId
        }

        const claimedJob = await DiscordSyncJob.findOneAndUpdate(
          claimFilter,
          {
            $set: {
              status: 'processing',
              claimedAt: now,
              claimedBy: workerId,
              correlationId: service.correlationId,
            },
            $inc: { attemptCount: 1 },
          },
          {
            new: true,
            sort: { createdAt: 1 },
          }
        ).lean()

        if (!claimedJob) {
          break
        }

        jobs.push({
          id: claimedJob._id.toString(),
          userId: claimedJob.userId.toString(),
          guildId: claimedJob.guildId,
          discordId: claimedJob.discordId,
          targetRank: claimedJob.targetRank,
          targetRoleId: claimedJob.targetRoleId,
          source: claimedJob.source,
          attemptCount: claimedJob.attemptCount,
          maxAttempts: claimedJob.maxAttempts,
          idempotencyKey: claimedJob.idempotencyKey,
          claimedAt: claimedJob.claimedAt,
          correlationId: claimedJob.correlationId,
          rankRoleIds:
            rankRoleIdsByGuild.get(claimedJob.guildId) || [claimedJob.targetRoleId],
        })
      }

      logger.info(
        {
          route: ROUTE_PATH,
          serviceName: service.serviceName,
          correlationId: service.correlationId,
          claimedCount: jobs.length,
          requestedLimit: limit,
          guildId: guildId || null,
        },
        'Discord sync jobs claimed'
      )

      return NextResponse.json({
        success: true,
        data: {
          jobs,
          claimedCount: jobs.length,
        },
      })
    })
  )
)
