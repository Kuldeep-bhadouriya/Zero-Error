import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Season from '@/models/season'
import SeasonArchive from '@/models/seasonArchive'
import logger from '@/lib/logger'

/**
 * GET /api/ze-club/season/history
 * Returns list of completed seasons with top 3 players each.
 */
export async function GET() {
  try {
    await dbConnect()

    const completedSeasons = await Season.find({
      status: 'completed',
      hideFromHistory: { $ne: true },
    })
      .select('seasonNumber name description startDate scheduledEndDate actualEndDate totalParticipants')
      .sort({ seasonNumber: -1 })
      .lean()

    // For each season, fetch top 3 players from archive
    const seasonsWithTop3 = await Promise.all(
      completedSeasons.map(async (season: any) => {
        const top3 = await SeasonArchive.find({ season: season._id })
          .sort({ leaderboardPosition: 1 })
          .limit(3)
          .select('zeTag finalExperience finalRank finalRankIcon leaderboardPosition profilePhotoUrl isSeasonWinner')
          .lean()

        return {
          ...season,
          top3,
        }
      })
    )

    return NextResponse.json(seasonsWithTop3)
  } catch (error) {
    logger.error('Error fetching season history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
