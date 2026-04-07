import { NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import {
  withErrorHandling,
  withInternalServiceAuth,
  withRequestLogging,
} from '@/lib/api/middleware'
import { badRequestFromZod, objectIdSchema } from '@/lib/validation'
import { buildRateLimitHeaders, checkRateLimit, getRateLimitRule } from '@/lib/rate-limit'
import dbConnect from '@/lib/mongodb'
import logger from '@/lib/logger'
import DiscordGuildConfig from '@/models/discordGuildConfig'
import DiscordSyncJob from '@/models/discordSyncJob'
import User from '@/models/user'

const ROUTE_PATH = '/api/internal/discord-sync/reconcile'

const reconcileBodySchema = z.object({
  guildId: z.string().trim().min(1).max(120),
  userId: objectIdSchema.optional(),
  dryRun: z.boolean().default(true),
  reason: z.string().trim().max(200).optional(),
})

export const POST = withRequestLogging(
  ROUTE_PATH,
  withErrorHandling(
    ROUTE_PATH,
    withInternalServiceAuth(async (req, _context, service) => {
      const rateRule = getRateLimitRule('apiInternalDiscordSyncReconcile')
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

      const parsedBody = reconcileBodySchema.safeParse(body)
      if (!parsedBody.success) {
        return NextResponse.json({ ...badRequestFromZod(parsedBody.error), success: false }, { status: 400 })
      }

      await dbConnect()

      const { guildId, userId, dryRun, reason } = parsedBody.data

      const guildConfig = await DiscordGuildConfig.findOne({ guildId, enabled: true }).lean()
      if (!guildConfig) {
        return NextResponse.json(
          { error: 'Active guild config not found for the provided guildId', success: false },
          { status: 404 }
        )
      }

      const roleByRank = new Map(
        guildConfig.rankRoleMappings
          .filter((mapping) => mapping.enabled)
          .map((mapping) => [mapping.rank, mapping.roleId])
      )

      const userFilter: Record<string, unknown> = {
        discordId: { $exists: true, $ne: null },
        'discordSync.linkStatus': 'linked_verified',
        'discordSync.verified': true,
      }

      if (userId) {
        userFilter._id = userId
      }

      const eligibleUsers = await User.find(userFilter)
        .select('_id discordId rank')
        .lean()

      let mappedUsers = 0
      let queuedJobs = 0
      let skippedActiveJob = 0
      let skippedMissingMapping = 0

      if (!dryRun) {
        for (const user of eligibleUsers) {
          const targetRoleId = roleByRank.get(user.rank)
          if (!targetRoleId) {
            skippedMissingMapping += 1
            continue
          }

          mappedUsers += 1

          const activeJob = await DiscordSyncJob.exists({
            userId: user._id,
            guildId,
            status: { $in: ['pending', 'processing'] },
          })

          if (activeJob) {
            skippedActiveJob += 1
            continue
          }

          await DiscordSyncJob.create({
            userId: user._id,
            guildId,
            discordId: user.discordId,
            targetRank: user.rank,
            targetRoleId,
            status: 'pending',
            source: 'reconcile',
            idempotencyKey: `reconcile:${service.correlationId}:${user._id.toString()}:${crypto.randomUUID()}`,
            correlationId: service.correlationId,
          })

          queuedJobs += 1
        }
      } else {
        for (const user of eligibleUsers) {
          const targetRoleId = roleByRank.get(user.rank)
          if (!targetRoleId) {
            skippedMissingMapping += 1
            continue
          }
          mappedUsers += 1
        }
      }

      logger.info(
        {
          route: ROUTE_PATH,
          serviceName: service.serviceName,
          correlationId: service.correlationId,
          guildId,
          dryRun,
          reason: reason || null,
          scopedUserId: userId || null,
          eligibleCount: eligibleUsers.length,
          mappedUsers,
          queuedJobs,
          skippedActiveJob,
          skippedMissingMapping,
        },
        'Discord reconcile endpoint executed'
      )

      return NextResponse.json({
        success: true,
        data: {
          dryRun,
          guildId,
          scopedUserId: userId || null,
          eligibleCount: eligibleUsers.length,
          mappedUsers,
          queuedJobs,
          skippedActiveJob,
          skippedMissingMapping,
        },
      })
    })
  )
)
