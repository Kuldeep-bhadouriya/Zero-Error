import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { errorResponse } from '@/lib/api-response'
import dbConnect from '@/lib/mongodb'
import Season, { type ISeason } from '@/models/season'
import logger from '@/lib/logger'

/**
 * GET /api/admin/seasons/current
 * Returns the currently active season, or null.
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || !session.user.roles?.includes('admin')) {
      return errorResponse('Unauthorized', 401)
    }

    await dbConnect()
    const activeSeason = await Season.findOne({ status: 'active' }).lean() as ISeason | null

    if (!activeSeason) {
      return NextResponse.json({ season: null })
    }

    const now = new Date()
    const endDate = new Date(activeSeason.scheduledEndDate)
    const diffMs = endDate.getTime() - now.getTime()
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    const hoursRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)))

    return NextResponse.json({
      season: {
        ...activeSeason,
        daysRemaining,
        hoursRemaining,
        isExpired: diffMs <= 0,
      },
    })
  } catch (error) {
    logger.error('Error fetching current season:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
