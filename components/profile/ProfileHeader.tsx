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
        <div className="absolute inset-0 h-32 bg-gradient-to-r from-red-900/20 to-black/0 rounded-t-3xl sm:rounded-t-[2rem] -z-10" />

        <GlassCard variant="default" className="p-0 overflow-hidden border-zinc-800">
          {/* Header Content */}
          <div className="flex flex-col md:flex-row">
            
            {/* Left: Avatar & Key Info */}
            <div className="p-5 sm:p-6 md:p-8 flex flex-col items-center md:items-start gap-5 sm:gap-6 border-b md:border-b-0 md:border-r border-white/5 md:w-80 shrink-0 bg-black/20">
               <div className="relative group">
                 {/* Avatar Container */}
                 <div className="relative w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full md:rounded-2xl overflow-hidden border-4 border-black/50 shadow-2xl">
                    <Image
                      src={displayImage}
                      alt={displayName}
                      fill
                      className="object-cover"
                      priority
                    />
                 </div>
                 
                 {/* Mobile Camera Button (Always Visible) */}
                 <button
                    onClick={() => setShowPhotoUploader(true)}
                    className="absolute bottom-0 right-0 md:-bottom-2 md:-right-2 w-10 h-10 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full flex items-center justify-center border-2 border-black shadow-lg transition-transform hover:scale-105 active:scale-95 z-20"
                    aria-label="Change profile photo"
                  >
                   <Camera className="w-5 h-5" />
                 </button>

                 {/* Rank Badge absolute position */}
                 <div className="absolute -top-1 -left-1 md:-top-3 md:-left-3 bg-zinc-900 rounded-full p-1 border border-zinc-700 shadow-lg z-10">
                    <Image
                      src={profile.rankIcon}
                      alt={profile.rank}
                      width={32}
                      height={32}
                      className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10"
                    />
                 </div>
               </div>

               <div className="text-center md:text-left space-y-1.5 w-full">
                  <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 px-3 py-1 text-xs">
                    {profile.rank}
                  </Badge>
                  
                  <div className="flex flex-col">
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight truncate max-w-[250px] mx-auto md:mx-0">
                      {displayName}
                    </h2>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-zinc-500 text-xs sm:text-sm">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Since {memberSince}</span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Right: Detailed Info & Stats */}
            <div className="flex-1 p-5 sm:p-6 md:p-8 flex flex-col justify-between gap-6">
              
              {/* Top Row: Quick Stats */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                 <div className="bg-zinc-900/40 rounded-xl p-3 sm:p-4 border border-white/5 flex items-center gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                       <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
                    </div>
                    <div className="min-w-0">
                       <div className="text-lg sm:text-2xl font-bold text-white tabular-nums truncate">
                         {(profile.zeCoins || profile.points).toLocaleString()}
                       </div>
                       <div className="text-[10px] sm:text-xs text-zinc-500 font-medium uppercase tracking-wider">ZE Coins</div>
                    </div>
                 </div>

                 <div className="bg-zinc-900/40 rounded-xl p-3 sm:p-4 border border-white/5 flex items-center gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                       <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                    </div>
                    <div className="min-w-0">
                       <div className="text-lg sm:text-2xl font-bold text-white tabular-nums truncate">
                         {(profile.experience || profile.points).toLocaleString()}
                       </div>
                       <div className="text-[10px] sm:text-xs text-zinc-500 font-medium uppercase tracking-wider">XP</div>
                    </div>
                 </div>
              </div>

              {/* Bottom Row: Identity Details */}
              <div className="space-y-3 sm:space-y-4">
                 <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-widest identity-label">Identity</h3>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Username Field */}
                    <div className="group relative bg-black/20 hover:bg-black/40 rounded-lg p-3 border border-white/5 hover:border-white/10 transition-all">
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 overflow-hidden">
                             <User className="w-4 h-4 text-zinc-500" />
                             <div className="flex flex-col min-w-0">
                                <span className="text-xs text-zinc-500">Username</span>
                                <span className="text-sm text-zinc-300 font-mono truncate">@{profile.zeTag || 'not-set'}</span>
                             </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost" 
                            className="h-8 w-8 text-zinc-500 hover:text-white"
                            onClick={() => setShowZeTagModal(true)}
                          >
                             <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                       </div>
                    </div>

                    {/* Email Field */}
                    <div className="bg-black/20 rounded-lg p-3 border border-white/5 flex items-center gap-3 overflow-hidden">
                       <Mail className="w-4 h-4 text-zinc-500 shrink-0" />
                       <div className="flex flex-col min-w-0">
                          <span className="text-xs text-zinc-500">Email</span>
                          <span className="text-sm text-zinc-300 truncate">{profile.email}</span>
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
