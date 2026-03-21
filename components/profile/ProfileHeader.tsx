'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Camera, Edit2, Mail, Calendar, User } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ChangeZeTagModal } from './ChangeZeTagModal'
import { ProfilePhotoUploader } from './ProfilePhotoUploader'
import { GamingProfileCard } from './GamingProfileCard'

interface ProfileHeaderProps {
  profile: {
    email?: string
    image?: string
    zeTag?: string
    bio?: string
    profilePhotoUrl?: string
    rank: string
    rankIcon: string
    points: number
    zeCoins?: number
    experience?: number
    currentRankPoints?: number
    nextRankPoints?: number
    accountCreatedAt?: Date
  }
  stats: {
    completedMissions: number
    pendingMissions: number
    leaderboardPosition: number
  }
  onUpdate: () => void
}

export function ProfileHeader({ profile, stats, onUpdate }: ProfileHeaderProps) {
  const [showZeTagModal, setShowZeTagModal] = useState(false)
  const [showPhotoUploader, setShowPhotoUploader] = useState(false)

  const displayImage = profile.profilePhotoUrl || profile.image || '/images/default-avatar.png'
  const displayName = profile.zeTag ? `@${profile.zeTag}` : 'Set your ZE Tag'
  const memberSince = profile.accountCreatedAt
    ? format(new Date(profile.accountCreatedAt), 'MMM yyyy')
    : 'Unknown'

  return (
    <>
      <div className="relative mb-6">
        {/* Banner / Background decoration */}
        <div className="absolute inset-0 h-20 sm:h-24 bg-gradient-to-r from-red-900/20 to-black/0 rounded-t-3xl sm:rounded-t-[2rem] -z-10" />

        <GlassCard variant="default" className="p-0 overflow-hidden border-zinc-800">
          {/* Header Content */}
          <div className="flex flex-col xl:flex-row">
            
            {/* Left: Gaming Card */}
            <div className="p-4 sm:p-6 xl:p-8 border-b xl:border-b-0 xl:border-r border-white/5 xl:w-[460px] shrink-0 bg-black/20">
              <GamingProfileCard profile={profile} stats={stats} />
            </div>

            {/* Right: Stats & Identity Info */}
            <div className="flex-1 p-4 sm:p-5 xl:p-8">
              <div className="space-y-5 sm:space-y-6">
                
                {/* Identity Summary */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3 sm:mb-4">Identity</h3>
                  <div className="bg-zinc-900/40 rounded-lg p-3 sm:p-4 border border-white/5">
                    <div className="flex flex-wrap items-center gap-3 justify-between">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{displayName}</h2>
                        <div className="flex items-center gap-2 text-zinc-400 text-sm mt-1">
                          <Calendar className="w-4 h-4" />
                          <span>Member since {memberSince}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 px-3 py-1 text-xs font-semibold">
                        {profile.rank}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Identity Section */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3 sm:mb-4">Account Details</h3>
                  <div className="space-y-3">
                    {/* Username Field */}
                    <div className="group relative bg-zinc-900/40 hover:bg-zinc-900/60 rounded-lg p-3 sm:p-4 border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex justify-between items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden flex-1">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[10px] sm:text-xs text-zinc-500 font-medium mb-0.5">Username</span>
                            <span className="text-xs sm:text-sm text-white font-mono truncate">@{profile.zeTag || 'not-set'}</span>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost" 
                          className="h-8 w-8 sm:h-9 sm:w-9 text-zinc-400 hover:text-white hover:bg-white/10 shrink-0"
                          onClick={() => setShowZeTagModal(true)}
                        >
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Profile Photo Action */}
                    <div className="group relative bg-zinc-900/40 hover:bg-zinc-900/60 rounded-lg p-3 sm:p-4 border border-white/5 hover:border-white/10 transition-all">
                      <div className="flex justify-between items-center gap-3 sm:gap-4">
                        <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden flex-1">
                          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg overflow-hidden border border-white/10 bg-white/5 shrink-0">
                            <Image
                              src={displayImage}
                              alt={displayName}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[10px] sm:text-xs text-zinc-500 font-medium mb-0.5">Profile Photo</span>
                            <span className="text-xs sm:text-sm text-white truncate">Update your card portrait</span>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 sm:h-9 sm:w-9 text-zinc-400 hover:text-white hover:bg-white/10 shrink-0"
                          onClick={() => setShowPhotoUploader(true)}
                        >
                          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Email Field */}
                    <div className="bg-zinc-900/40 rounded-lg p-3 sm:p-4 border border-white/5">
                      <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                          <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-[10px] sm:text-xs text-zinc-500 font-medium mb-0.5">Email Address</span>
                          <span className="text-xs sm:text-sm text-white truncate">{profile.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      <ChangeZeTagModal
        isOpen={showZeTagModal}
        onClose={() => setShowZeTagModal(false)}
        currentZeTag={profile.zeTag}
        onSuccess={onUpdate}
      />

      <ProfilePhotoUploader
        isOpen={showPhotoUploader}
        onClose={() => setShowPhotoUploader(false)}
        currentPhotoUrl={displayImage}
        onSuccess={onUpdate}
      />
    </>
  )
}
