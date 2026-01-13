import { auth } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import dbConnect from '@/lib/mongodb'
import User, { IUser } from '@/models/user'
import MissionSubmission from '@/models/missionSubmission'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { EditProfileForm } from '@/components/profile/EditProfileForm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, Key, AlertTriangle } from 'lucide-react'
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

  // Convert MongoDB document to plain object
  const profile = {
    id: (user._id as any).toString(),
    email: user.email,
    image: user.image,
    zeTag: user.zeTag,
    bio: user.bio,
    profilePhotoUrl: user.profilePhotoUrl,
    points: user.points,
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
      <div className="min-h-screen py-8 sm:py-12 px-3 sm:px-4 lg:px-6">
        <div className="container mx-auto max-w-7xl space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Page Header */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
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
