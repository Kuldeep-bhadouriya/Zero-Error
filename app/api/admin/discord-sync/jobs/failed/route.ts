import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  withAdmin,
  withErrorHandling,
  withRequestLogging,
} from '@/lib/api/middleware'
import dbConnect from '@/lib/mongodb'
import DiscordSyncJob from '@/models/discordSyncJob'
import { createNoStoreHeaders } from '@/lib/http-cache'

const ROUTE_PATH = '/api/admin/discord-sync/jobs/failed'

const querySchema = z.object({
  guildId: z.string().trim().min(1).max(120).optional(),
  status: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
})

export const GET = withRequestLogging(
  ROUTE_PATH,
  withErrorHandling(
    ROUTE_PATH,
    withAdmin(async (req) => {
      const parsed = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams.entries()))
      const params = parsed.success ? parsed.data : { limit: 50 }

      await dbConnect()

      const statusSet = params.status
        ? params.status
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
        : ['failed', 'dead_letter']

      const query: Record<string, unknown> = {
        status: { $in: statusSet },
      }

      if (params.guildId) {
        query.guildId = params.guildId
      }

      const jobsRaw = await DiscordSyncJob.find(query)
        .sort({ updatedAt: -1 })
        .limit(params.limit)
        .lean()
      const jobs = jobsRaw as unknown as Array<{
        _id: { toString(): string }
        userId: { toString(): string }
        guildId: string
        discordId: string
        status: string
        source: string
        targetRank: string
        targetRoleId: string
        attemptCount: number
        maxAttempts: number
        lastError?: string
        lastErrorCode?: string
        nextRetryAt?: Date | null
        failedAt?: Date | null
        updatedAt: Date
      }>

      const payload = jobs.map((job) => ({
        id: job._id.toString(),
        userId: job.userId.toString(),
        guildId: job.guildId,
        discordId: job.discordId,
        status: job.status,
        source: job.source,
        targetRank: job.targetRank,
        targetRoleId: job.targetRoleId,
        attemptCount: job.attemptCount,
        maxAttempts: job.maxAttempts,
        lastError: job.lastError || null,
        lastErrorCode: job.lastErrorCode || null,
        nextRetryAt: job.nextRetryAt || null,
        failedAt: job.failedAt || null,
        updatedAt: job.updatedAt,
      }))

      return NextResponse.json(
        {
          success: true,
          jobs: payload,
          total: payload.length,
        },
        { headers: createNoStoreHeaders() }
      )
    })
  )
)
