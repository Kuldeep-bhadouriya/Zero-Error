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
import DiscordSyncJob from '@/models/discordSyncJob'

const ROUTE_PATH = '/api/internal/discord-sync/jobs/[jobId]/complete'

const completeBodySchema = z.object({
  note: z.string().trim().max(400, 'note must be 400 characters or fewer').optional(),
})

type RouteParams = { params: Promise<{ jobId: string }> }

export const POST = withRequestLogging(
  ROUTE_PATH,
  withErrorHandling(
    ROUTE_PATH,
    withInternalServiceAuth(async (req, context: RouteParams, service) => {
      const rateRule = getRateLimitRule('apiInternalDiscordSyncComplete')
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

      const { jobId } = await context.params
      const parsedId = objectIdSchema.safeParse(jobId)
      if (!parsedId.success) {
        return NextResponse.json({ error: 'Invalid job ID', success: false }, { status: 400 })
      }

      let body: unknown = {}
      try {
        body = await req.json()
      } catch {
        body = {}
      }

      const parsedBody = completeBodySchema.safeParse(body)
      if (!parsedBody.success) {
        return NextResponse.json({ ...badRequestFromZod(parsedBody.error), success: false }, { status: 400 })
      }

      await dbConnect()

      const completedJob = await DiscordSyncJob.findOneAndUpdate(
        { _id: parsedId.data, status: 'processing' },
        {
          $set: {
            status: 'completed',
            completedAt: new Date(),
            nextRetryAt: undefined,
            lastError: undefined,
            lastErrorCode: undefined,
            correlationId: service.correlationId,
          },
        },
        { new: true }
      ).lean()

      if (!completedJob) {
        return NextResponse.json(
          { error: 'Processing job not found for completion', success: false },
          { status: 404 }
        )
      }

      logger.info(
        {
          route: ROUTE_PATH,
          serviceName: service.serviceName,
          correlationId: service.correlationId,
          jobId: completedJob._id.toString(),
          note: parsedBody.data.note,
        },
        'Discord sync job marked as completed'
      )

      return NextResponse.json({
        success: true,
        data: {
          jobId: completedJob._id.toString(),
          status: completedJob.status,
          completedAt: completedJob.completedAt,
        },
      })
    })
  )
)
