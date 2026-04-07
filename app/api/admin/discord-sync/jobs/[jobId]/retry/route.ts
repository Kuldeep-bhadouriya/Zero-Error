import { NextResponse } from 'next/server'
import {
  withAdmin,
  withErrorHandling,
  withRequestLogging,
} from '@/lib/api/middleware'
import dbConnect from '@/lib/mongodb'
import DiscordSyncJob from '@/models/discordSyncJob'
import { objectIdSchema } from '@/lib/validation'
import { createNoStoreHeaders } from '@/lib/http-cache'

const ROUTE_PATH = '/api/admin/discord-sync/jobs/[jobId]/retry'

type RouteParams = {
  params: Promise<{ jobId: string }>
}

export const POST = withRequestLogging(
  ROUTE_PATH,
  withErrorHandling(
    ROUTE_PATH,
    withAdmin(async (_req, context: RouteParams, session) => {
      const { jobId } = await context.params
      const parsedId = objectIdSchema.safeParse(jobId)

      if (!parsedId.success) {
        return NextResponse.json(
          { success: false, error: 'Invalid job ID' },
          { status: 400, headers: createNoStoreHeaders() }
        )
      }

      await dbConnect()

      const updatedRaw = await DiscordSyncJob.findOneAndUpdate(
        { _id: parsedId.data, status: { $in: ['failed', 'dead_letter'] } },
        {
          $set: {
            status: 'pending',
            nextRetryAt: null,
            claimedAt: null,
            claimedBy: null,
            correlationId: `admin-retry:${session.user.id}:${Date.now()}`,
          },
        },
        { new: true }
      ).lean()
      const updated = updatedRaw as {
        _id: { toString(): string }
        status: string
      } | null

      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'Retryable failed job not found' },
          { status: 404, headers: createNoStoreHeaders() }
        )
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            jobId: updated._id.toString(),
            status: updated.status,
          },
        },
        { headers: createNoStoreHeaders() }
      )
    })
  )
)
