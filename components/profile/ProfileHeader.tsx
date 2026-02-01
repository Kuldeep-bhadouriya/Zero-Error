'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Camera, Edit2, Mail, Calendar, Coins, Sparkles, User } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ChangeZeTagModal } from './ChangeZeTagModal'
import { ProfilePhotoUploader } from './ProfilePhotoUploader'

interface ProfileHeaderProps {
  profile: {
    email?: string
    image?: string
    zeTag?: string
    profilePhotoUrl?: string
    rank: string
    rankIcon: string
    points: number
    zeCoins?: number
    experience?: number
    accountCreatedAt?: Date
  }
  onUpdate: () => void
}

export function ProfileHeader({ profile, onUpdate }: ProfileHeaderProps) {
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
          <div className="flex flex-col lg:flex-row">
            
            {/* Left: Avatar & Basic Info */}
            <div className="p-5 sm:p-6 lg:p-8 flex flex-col items-center gap-4 border-b lg:border-b-0 lg:border-r border-white/5 lg:w-80 xl:w-96 shrink-0 bg-black/20">
               <div className="relative group">
                 {/* Avatar Container */}
                 <div className="relative w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-2xl overflow-hidden border-4 border-black/50 shadow-2xl">
                    <Image
                      src={displayImage}
                      alt={displayName}
                      fill
                      className="object-cover"
                      priority
                    />
                 </div>
                 
                 {/* Camera Button */}
                 <button
                    onClick={() => setShowPhotoUploader(true)}
                    className="absolute -bottom-2 -right-2 w-10 h-10 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full flex items-center justify-center border-2 border-black shadow-lg transition-transform hover:scale-105 active:scale-95 z-20"
                    aria-label="Change profile photo"
                  >
                   <Camera className="w-5 h-5" />
                 </button>

                 {/* Rank Badge */}
                 <div className="absolute -top-2 -left-2 bg-zinc-900 rounded-full p-1.5 border border-zinc-700 shadow-lg z-10">
                    <Image
                      src={profile.rankIcon}
                      alt={profile.rank}
                      width={40}
                      height={40}
                      className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10"
                    />
                 </div>
               </div>

               <div className="text-center space-y-2 w-full">
                  <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 px-3 py-1 text-xs font-semibold">
                    {profile.rank}
                  </Badge>
                  
                  <div className="flex flex-col gap-1">
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight truncate px-2">
                      {displayName}
                    </h2>
                    <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>Member since {memberSince}</span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Right: Stats & Identity Info */}
            <div className="flex-1 p-4 sm:p-5 lg:p-8">
              <div className="space-y-5 sm:space-y-6">
                
                {/* Stats Section */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3 sm:mb-4">Statistics</h3>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-900/5 rounded-xl p-3 sm:p-4 border border-yellow-500/20 hover:border-yellow-500/30 transition-all">
                      <div className="flex flex-col gap-2 mb-2">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                          <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                        </div>
                        <div className="text-[10px] sm:text-xs text-yellow-400/80 font-medium uppercase tracking-wider">ZE Coins</div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                        {(profile.zeCoins || profile.points).toLocaleString()}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-900/5 rounded-xl p-3 sm:p-4 border border-purple-500/20 hover:border-purple-500/30 transition-all">
                      <div className="flex flex-col gap-2 mb-2">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                        </div>
                        <div className="text-[10px] sm:text-xs text-purple-400/80 font-medium uppercase tracking-wider">Experience</div>
                      </div>
                      <div className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
                        {(profile.experience || profile.points).toLocaleString()}
                      </div>
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
