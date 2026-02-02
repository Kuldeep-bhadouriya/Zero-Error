import { auth } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import dbConnect from '@/lib/mongodb'
import User, { IUser } from '@/models/user'
import MissionSubmission from '@/models/missionSubmission'
import { ProfileClient } from './profile-client'
import ZEClubLayout from '@/components/ze-club/ZEClubLayout'

export default async function ProfilePage() {
  const session = await auth()

  if (!session) {
    redirect('/join-us')
  }

  await dbConnect()
  const user = await User.findById(session.user.id).lean() as IUser | null

  if (!user) {
    redirect('/join-us')
  }

  // Get statistics
  const completedMissions = await MissionSubmission.countDocuments({
    user: session.user.id,
    status: 'approved',
  })

  const pendingMissions = await MissionSubmission.countDocuments({
    user: session.user.id,
    status: 'pending',
  })

  // Get leaderboard position (based on experience for consistency with ranking system)
  const higherRankedUsers = await User.countDocuments({
    experience: { $gt: user.experience },
  })
  const leaderboardPosition = higherRankedUsers + 1

  // Convert MongoDB document to plain object
  const profile = {
    id: (user._id as any).toString(),
    email: user.email,
    image: user.image,
    zeTag: user.zeTag,
    bio: user.bio,
    profilePhotoUrl: user.profilePhotoUrl,
    points: user.points,
    zeCoins: user.zeCoins,
    experience: user.experience,
    rank: user.rank,
    rankIcon: user.rankIcon,
    progressToNextRank: user.progressToNextRank,
    nextRankPoints: user.nextRankPoints,
    currentRankPoints: user.currentRankPoints,
    accountCreatedAt: user.accountCreatedAt,
    lastLoginAt: user.lastLoginAt,
    roles: user.roles,
  }

  const stats = {
    completedMissions,
    pendingMissions,
    totalPoints: user.points,
    leaderboardPosition,
  }

  return (
    <ZEClubLayout>
      <div className="min-h-screen py-8 sm:py-12">
        <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 px-0 sm:px-4 lg:px-6">
          {/* Page Header */}
          <div className="mb-4 sm:mb-6 lg:mb-8 px-4 sm:px-0">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              My Profile
            </h1>
            <p className="text-gray-400 text-sm sm:text-base lg:text-lg">Manage your ZE Club profile and settings</p>
          </div>

          <ProfileClient profile={profile} stats={stats} />
        </div>
      </div>
    </ZEClubLayout>
  )
}
