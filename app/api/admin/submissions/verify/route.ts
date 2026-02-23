
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { withAdmin, withErrorHandling, withRequestLogging } from '@/lib/api/middleware'
import { verifyMissionSubmission } from '@/lib/services/missionService'

/**
 * PATCH /api/admin/submissions/verify
 * Admin endpoint to approve or reject mission submissions.
 * On approval, awards points to the user and updates their rank.
 * Requires admin role in the session.
 */
export const PATCH = withRequestLogging(
  '/api/admin/submissions/verify',
  withErrorHandling(
    '/api/admin/submissions/verify',
    withAdmin(async (req, _context, session) => {
    const { submissionId, status } = await req.json()

    // Validate status value
    if (!['approved', 'rejected'].includes(status)) {
      return new NextResponse('Invalid status', { status: 400 })
    }

    const result = await verifyMissionSubmission({
      submissionId,
      status,
      adminUserId: session.user.id,
    })

    // Revalidate the leaderboard page to show updated data
    revalidatePath('/ze-club/leaderboard')

    return NextResponse.json(result.data, { status: result.status })
    })
  )
)
