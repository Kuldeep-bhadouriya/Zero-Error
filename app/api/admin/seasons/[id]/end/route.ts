import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { errorResponse } from '@/lib/api-response'
import dbConnect from '@/lib/mongodb'
import { endSeason } from '@/lib/ze-club/seasonTransition'
import Season from '@/models/season'
import MissionSubmission from '@/models/missionSubmission'
import RedemptionRequest from '@/models/redemptionRequest'
import logger from '@/lib/logger'

/**
 * POST /api/admin/seasons/[id]/end
 * End the active season. Triggers the full season transition.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.roles?.includes('admin')) {
      return errorResponse('Unauthorized', 401)
    }

    await dbConnect()
    const { id } = await params

    const season = await Season.findById(id)
    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    if (season.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active seasons can be ended' },
        { status: 400 }
      )
    }

    // Determine reason
    const now = new Date()
    const reason = now < season.scheduledEndDate ? 'manual_early' : 'scheduled'

    const result = await endSeason(id, session.user.id, reason)

    return NextResponse.json({
      message: `Season ${result.seasonNumber} ended successfully`,
      ...result,
    })
  } catch (error) {
    logger.error('Error ending season:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/admin/seasons/[id]/end
 * Get pre-end summary (pending items that would be affected).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.roles?.includes('admin')) {
      return errorResponse('Unauthorized', 401)
    }

    await dbConnect()
    const { id } = await params

    const season = await Season.findById(id)
    if (!season || season.status !== 'active') {
      return NextResponse.json({ error: 'No active season found' }, { status: 404 })
    }

    const pendingSubmissions = await MissionSubmission.countDocuments({ status: 'pending' })
    const pendingRedemptions = await RedemptionRequest.countDocuments({
      status: { $in: ['pending', 'processing'] },
    })

    return NextResponse.json({
      pendingSubmissions,
      pendingRedemptions,
      seasonName: season.name,
      seasonNumber: season.seasonNumber,
    })
  } catch (error) {
    logger.error('Error fetching end-season summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
