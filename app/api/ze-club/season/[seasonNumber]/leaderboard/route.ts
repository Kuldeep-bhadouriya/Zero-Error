import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import SeasonArchive from '@/models/seasonArchive'
import Season from '@/models/season'
import logger from '@/lib/logger'

/**
 * GET /api/ze-club/season/[seasonNumber]/leaderboard
 * Returns the historical leaderboard for a completed season.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ seasonNumber: string }> }
) {
  try {
    await dbConnect()
    const { seasonNumber } = await params
    const num = parseInt(seasonNumber, 10)

    if (isNaN(num)) {
      return NextResponse.json({ error: 'Invalid season number' }, { status: 400 })
    }

    // Verify season exists and is completed
    const season = await Season.findOne({ seasonNumber: num })
      .select('seasonNumber name description startDate scheduledEndDate actualEndDate totalParticipants status')
      .lean()

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    // Fetch leaderboard from archive
    const leaderboard = await SeasonArchive.find({ seasonNumber: num })
      .sort({ leaderboardPosition: 1 })
      .limit(50)
      .select(
        'zeTag finalExperience finalZeCoins finalRank finalRankIcon leaderboardPosition profilePhotoUrl totalMissionsCompleted totalRedemptions isSeasonWinner isTopThree'
      )
      .lean()

    return NextResponse.json({
      season,
      leaderboard,
    })
  } catch (error) {
    logger.error('Error fetching season leaderboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
