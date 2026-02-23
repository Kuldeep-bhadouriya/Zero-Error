import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { withAdmin, withErrorHandling, withRequestLogging } from '@/lib/api/middleware'
import { revertMissionSubmission } from '@/lib/services/missionService'

/**
 * POST /api/admin/submissions/revert
 * Admin endpoint to revert an approved mission submission.
 * Deducts points from the user, recalculates rank, and updates submission status.
 * Requires admin role in the session.
 */
export const POST = withRequestLogging(
  '/api/admin/submissions/revert',
  withErrorHandling(
    '/api/admin/submissions/revert',
    withAdmin(async (req, _context, session) => {
    const { submissionId, revertReason } = await req.json()

    const result = await revertMissionSubmission({
      submissionId,
      revertReason,
      adminUserId: session.user.id,
    })

    // Revalidate the leaderboard page
    revalidatePath('/ze-club/leaderboard')

    return NextResponse.json(result.data, { status: result.status })
    })
  )
)
