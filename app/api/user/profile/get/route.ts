import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'
import MissionSubmission from '@/models/missionSubmission'

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    await dbConnect()

    const user = await User.findById(session.user.id)
    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Get statistics
    const completedMissions = await MissionSubmission.countDocuments({
      userId: session.user.id,
      status: 'approved',
    })

    const pendingMissions = await MissionSubmission.countDocuments({
      userId: session.user.id,
      status: 'pending',
    })

    // Get leaderboard position
    const higherRankedUsers = await User.countDocuments({
      points: { $gt: user.points },
    })
    const leaderboardPosition = higherRankedUsers + 1

    return NextResponse.json({
      profile: {
        id: user._id.toString(),
        email: user.email,
        image: user.image,
        zeClubId: user.zeClubId,
        zeTag: user.zeTag,
        bio: user.bio,
        profilePhotoUrl: user.profilePhotoUrl,
        points: user.points, // Kept for backward compatibility
        zeCoins: user.zeCoins || user.points, // For redemption
        experience: user.experience || user.points, // For ranking
        rank: user.rank,
        rankIcon: user.rankIcon,
        progressToNextRank: user.progressToNextRank,
        nextRankPoints: user.nextRankPoints,
        currentRankPoints: user.currentRankPoints,
        accountCreatedAt: user.accountCreatedAt,
        lastLoginAt: user.lastLoginAt,
        roles: user.roles,
      },
      stats: {
        completedMissions,
        pendingMissions,
        totalPoints: user.points,
        zeCoins: user.zeCoins || user.points,
        experience: user.experience || user.points,
        leaderboardPosition,
      },
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
