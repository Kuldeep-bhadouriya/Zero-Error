import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  withAdmin,
  withErrorHandling,
  withRequestLogging,
} from '@/lib/api/middleware'
import dbConnect from '@/lib/mongodb'
import { badRequestFromZod, objectIdSchema } from '@/lib/validation'
import { createNoStoreHeaders } from '@/lib/http-cache'
import { getDiscordSyncFlags } from '@/lib/discord-sync-flags'
import { executeDiscordReconcile } from '@/lib/services/discordReconcileService'
import logger from '@/lib/logger'

const ROUTE_PATH = '/api/admin/discord-sync/reconcile'

const bodySchema = z.object({
  guildId: z.string().trim().min(1).max(120),
  userId: objectIdSchema.optional(),
  dryRun: z.boolean().default(true),
  reason: z.string().trim().max(200).optional(),
})

export const POST = withRequestLogging(
  ROUTE_PATH,
  withErrorHandling(
    ROUTE_PATH,
    withAdmin(async (req, _context, session) => {
      let body: unknown
      try {
        body = await req.json()
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid request payload' },
          { status: 400, headers: createNoStoreHeaders() }
        )
      }

      const parsedBody = bodySchema.safeParse(body)
      if (!parsedBody.success) {
        return NextResponse.json(
          { success: false, ...badRequestFromZod(parsedBody.error) },
          { status: 400, headers: createNoStoreHeaders() }
        )
      }

      const flags = getDiscordSyncFlags()
      if (!flags.reconcileEnabled) {
        return NextResponse.json(
          { success: false, error: 'Reconciliation is disabled by feature flag' },
          { status: 503, headers: createNoStoreHeaders() }
        )
      }

      await dbConnect()

      const correlationId = `admin-reconcile:${session.user.id}:${Date.now()}`
      const { guildId, userId, dryRun, reason } = parsedBody.data

      try {
        const summary = await executeDiscordReconcile({
          guildId,
          userId,
          dryRun,
          correlationId,
        })

        logger.info(
          {
            route: ROUTE_PATH,
            adminUserId: session.user.id,
            correlationId,
            reason: reason || null,
            summary,
          },
          'Admin triggered Discord reconcile'
        )

        return NextResponse.json(
          { success: true, data: summary },
          { headers: createNoStoreHeaders() }
        )
      } catch (error) {
        if (
          typeof error === 'object' &&
          error &&
          'code' in error &&
          (error as { code?: string }).code === 'GUILD_CONFIG_NOT_FOUND'
        ) {
          return NextResponse.json(
            { success: false, error: 'Active guild config not found for the provided guildId' },
            { status: 404, headers: createNoStoreHeaders() }
          )
        }

        throw error
      }
    })
  )
)
