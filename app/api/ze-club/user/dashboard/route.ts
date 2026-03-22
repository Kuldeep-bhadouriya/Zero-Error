import { NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { errorResponse } from '@/lib/api-response'
import dbConnect from "@/lib/mongodb"
import User from "@/models/user"
import { checkAndAutoEndSeason, getCurrentSeason } from "@/lib/ze-club/seasonTransition"
import { createNoStoreHeaders } from '@/lib/http-cache'
import logger from '@/lib/logger'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type DashboardUser = {
  points?: number
  zeCoins?: number
  experience?: number
  rank?: string
  badge?: string
  progress?: number
  zeTag?: string
  rankIcon?: string
  progressToNextRank?: number
  nextRankPoints?: number
  currentRankPoints?: number
}

/**
 * GET /api/ze-club/user/dashboard
 * Fetches the user's ZE Club dashboard data including points, rank, badge, and progress.
 * Requires authentication via NextAuth session.
 */
export async function GET() {
  const session = await auth()

  // Verify user authentication
  if (!session || !session.user || !session.user.email) {
    return errorResponse('Unauthorized', 401)
  }

  try {
    await dbConnect()

    // Trigger auto-end check for expired seasons
    checkAndAutoEndSeason().catch(() => {})

    // Fetch current season and user in parallel to reduce endpoint latency.
    const [activeSeason, user] = await Promise.all([
      getCurrentSeason(),
      User.findOne(
        { email: session.user.email },
        {
          points: 1,
          zeCoins: 1,
          experience: 1,
          rank: 1,
          badge: 1,
          progress: 1,
          zeTag: 1,
          rankIcon: 1,
          progressToNextRank: 1,
          nextRankPoints: 1,
          currentRankPoints: 1,
        }
      ).lean<DashboardUser | null>(),
    ])

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404, headers: createNoStoreHeaders() }
      )
    }

    // Calculate leaderboard rank (position) based on experience
    const userExperience = user.experience !== undefined ? user.experience : user.points;
    const betterPlayersCount = await User.countDocuments({ experience: { $gt: userExperience } });
    const leaderboardRank = betterPlayersCount + 1;

    // Prepare dashboard data
    const dashboardData = {
      totalPoints: user.experience !== undefined ? user.experience : user.points, // Display ranking points
      zeCoins: user.zeCoins !== undefined ? user.zeCoins : user.points, // For redemption
      experience: user.experience !== undefined ? user.experience : user.points, // For ranking
      rank: user.rank || 'Rookie',
      leaderboardRank,
      badge: user.badge,
      progress: user.progress,
      zeTag: user.zeTag,
      // Phase 1: Valorant-style rank system
      rankIcon: user.rankIcon || '/images/ranks/rookie.png',
      progressToNextRank: user.progressToNextRank || 0,
      nextRankPoints: user.nextRankPoints || 500,
      currentRankPoints: user.currentRankPoints || 0,
      // Season info
      season: activeSeason ? {
        seasonNumber: activeSeason.seasonNumber,
        name: activeSeason.name,
      } : null,
    }

    return NextResponse.json(dashboardData, {
      headers: createNoStoreHeaders(),
    })
  } catch (error) {
    logger.error("Error fetching user dashboard data:", error)
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500, headers: createNoStoreHeaders() }
    )
  }
}