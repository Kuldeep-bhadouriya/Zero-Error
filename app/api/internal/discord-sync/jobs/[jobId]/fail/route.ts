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

const ROUTE_PATH = '/api/internal/discord-sync/jobs/[jobId]/fail'

const failBodySchema = z.object({
  error: z.string().trim().min(1, 'error is required').max(1000),
  errorCode: z.string().trim().max(120).optional(),
  retryDelaySeconds: z.number().int().min(5).max(3600).default(60),
  deadLetter: z.boolean().default(false),
})

type RouteParams = { params: Promise<{ jobId: string }> }

export const POST = withRequestLogging(
  ROUTE_PATH,
  withErrorHandling(
    ROUTE_PATH,
    withInternalServiceAuth(async (req, context: RouteParams, service) => {
      const rateRule = getRateLimitRule('apiInternalDiscordSyncFail')
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

      let body: unknown
      try {
        body = await req.json()
      } catch {
        return NextResponse.json({ error: 'Invalid request payload', success: false }, { status: 400 })
      }

      const parsedBody = failBodySchema.safeParse(body)
      if (!parsedBody.success) {
        return NextResponse.json({ ...badRequestFromZod(parsedBody.error), success: false }, { status: 400 })
      }

      await dbConnect()

      const job = await DiscordSyncJob.findOne({ _id: parsedId.data, status: 'processing' })
      if (!job) {
        return NextResponse.json(
          { error: 'Processing job not found for failure update', success: false },
          { status: 404 }
        )
      }

      const now = new Date()
      const { error, errorCode, retryDelaySeconds, deadLetter } = parsedBody.data
      const shouldDeadLetter = deadLetter || job.attemptCount >= job.maxAttempts
      const nextRetryAt = shouldDeadLetter
        ? undefined
        : new Date(now.getTime() + retryDelaySeconds * 1000)

      job.status = shouldDeadLetter ? 'dead_letter' : 'failed'
      job.failedAt = now
      job.lastError = error
      job.lastErrorCode = errorCode
      job.nextRetryAt = nextRetryAt
      job.correlationId = service.correlationId
      await job.save()

      logger.info(
        {
          route: ROUTE_PATH,
          serviceName: service.serviceName,
          correlationId: service.correlationId,
          jobId: job._id.toString(),
          status: job.status,
          retryDelaySeconds,
          attemptCount: job.attemptCount,
          maxAttempts: job.maxAttempts,
        },
        'Discord sync job marked as failed'
      )

      return NextResponse.json({
        success: true,
        data: {
          jobId: job._id.toString(),
          status: job.status,
          failedAt: job.failedAt,
          nextRetryAt: job.nextRetryAt || null,
        },
      })
    })
  )
)
