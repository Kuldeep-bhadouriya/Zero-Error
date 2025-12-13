'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { EditProfileForm } from '@/components/profile/EditProfileForm'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Key, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ProfileClientProps {
  profile: {
    id: string
    name?: string
    email?: string
    image?: string
    zeClubId: string
    zeTag?: string
    bio?: string
    profilePhotoUrl?: string
    points: number
    rank: string
    rankIcon: string
    progressToNextRank: number
    nextRankPoints: number
    currentRankPoints: number
    accountCreatedAt?: Date
    lastLoginAt?: Date
    roles: string[]
  }
  stats: {
    completedMissions: number
    pendingMissions: number
    totalPoints: number
    leaderboardPosition: number
  }
}

export function ProfileClient({ profile, stats }: ProfileClientProps) {
  const router = useRouter()
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  function handleUpdate() {
    router.refresh()
  }

  async function handlePasswordChange() {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setIsChangingPassword(true)
    try {
      const res = await fetch('/api/user/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (res.ok) {
        toast.success('Password updated successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update password')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <ProfileHeader profile={profile} onUpdate={handleUpdate} />

      {/* Statistics */}
      <ProfileStats stats={stats} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit Profile Form */}
        <EditProfileForm profile={profile} onSuccess={handleUpdate} />

        {/* Security Card */}
        <GlassCard variant="intense" gradient="red" className="p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-red-500/10 p-2 rounded-lg">
                <Shield className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Security Settings</h2>
                <p className="text-gray-400 text-sm mt-1">
                  Manage your account security and authentication
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            {/* Change Password */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Key className="w-4 h-4 text-red-400" />
                <h3 className="font-semibold text-white text-lg">Change Password</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-white font-semibold">
                    Current Password
                  </Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500/20 h-11"
                    placeholder="Enter current password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-white font-semibold">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500/20 h-11"
                    placeholder="Enter new password (min 8 characters)"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-white font-semibold">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500/20 h-11"
                    placeholder="Confirm new password"
                  />
                </div>

                <Button
                  onClick={handlePasswordChange}
                  disabled={isChangingPassword || !newPassword || !confirmPassword}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold h-11 shadow-lg shadow-red-500/20"
                >
                  {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Password
                </Button>
              </div>
            </div>

            {/* Future Features */}
            <div className="border-t border-zinc-700/50 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <h3 className="font-semibold text-white text-lg">Coming Soon</h3>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-3 text-gray-300 bg-black/40 p-3 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <span className="text-sm">Two-factor authentication (2FA)</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300 bg-black/40 p-3 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <span className="text-sm">Session management & device tracking</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300 bg-black/40 p-3 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <span className="text-sm">Login history & activity logs</span>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
