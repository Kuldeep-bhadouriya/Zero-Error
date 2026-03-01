import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Season, { type ISeason } from '@/models/season'
import logger from '@/lib/logger'

export const dynamic = 'force-dynamic'

/**
 * GET /api/ze-club/season/current
 * Returns the current active season info for users. No auth required.
 */
export async function GET() {
  try {
    await dbConnect()
    const activeSeason = await Season.findOne({ status: 'active' })
      .select('seasonNumber name description startDate scheduledEndDate')
      .lean() as ISeason | null

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
