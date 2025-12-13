'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Camera, Edit2, Mail, Calendar, Award } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { ChangeZeTagModal } from './ChangeZeTagModal'
import { ProfilePhotoUploader } from './ProfilePhotoUploader'

interface ProfileHeaderProps {
  profile: {
    name?: string
    email?: string
    image?: string
    zeClubId: string
    zeTag?: string
    profilePhotoUrl?: string
    rank: string
    rankIcon: string
    points: number
    accountCreatedAt?: Date
  }
  onUpdate: () => void
}

export function ProfileHeader({ profile, onUpdate }: ProfileHeaderProps) {
  const [showZeTagModal, setShowZeTagModal] = useState(false)
  const [showPhotoUploader, setShowPhotoUploader] = useState(false)

  const displayImage = profile.profilePhotoUrl || profile.image || '/images/default-avatar.png'
  const displayName = profile.name || 'Anonymous User'
  const memberSince = profile.accountCreatedAt
    ? format(new Date(profile.accountCreatedAt), 'MMMM yyyy')
    : 'Unknown'

  return (
    <>
      <GlassCard variant="intense" className="p-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Profile Photo Section */}
            <div className="flex flex-col items-center gap-4">
              <motion.div
                className="relative group"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
              >
                <div className="relative w-40 h-40 rounded-2xl overflow-hidden border-4 border-red-500 shadow-lg shadow-red-500/20">
                  <Image
                    src={displayImage}
                    alt={displayName}
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => setShowPhotoUploader(true)}
                    className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm"
                  >
                    <div className="text-center">
                      <Camera className="w-10 h-10 text-white mb-2 mx-auto" />
                      <span className="text-white text-sm font-medium">Change Photo</span>
                    </div>
                  </button>
                </div>
                <div className="absolute -bottom-3 -right-3 bg-black/90 rounded-full p-2 border-2 border-red-500">
                  <Image
                    src={profile.rankIcon}
                    alt={profile.rank}
                    width={48}
                    height={48}
                    className="drop-shadow-lg"
                  />
                </div>
              </motion.div>
              
              <Badge className="bg-gradient-to-r from-red-600 to-red-500 text-white border-0 px-4 py-1.5 text-sm font-semibold shadow-lg">
                <Award className="w-4 h-4 mr-2" />
                {profile.rank}
              </Badge>
            </div>

            {/* Profile Info Section */}
            <div className="flex-1 space-y-6">
              {/* Name and Points */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">{displayName}</h1>
                  <div className="flex items-center gap-2 text-gray-400">
                    <span className="text-sm">Member since {memberSince}</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-4 text-center min-w-[140px]">
                  <div className="text-4xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                    {profile.points.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-wider">Total Points</div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ZE Club ID */}
                <div className="bg-black/50 rounded-lg p-4 border border-white/10">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">ZE Club ID</div>
                  <div className="text-red-400 font-mono text-lg font-bold">{profile.zeClubId}</div>
                </div>

                {/* ZE Tag */}
                <div className="bg-black/50 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">ZE Tag</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowZeTagModal(true)}
                      className="h-7 px-3 text-xs hover:bg-red-500/20 text-red-400 hover:text-red-300"
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                  <div className="text-red-400 font-mono text-lg font-bold">
                    @{profile.zeTag || 'Not set'}
                  </div>
                </div>

                {/* Email */}
                <div className="bg-black/50 rounded-lg p-4 border border-white/10">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    Email
                  </div>
                  <div className="text-white text-base font-medium truncate">{profile.email}</div>
                </div>

                {/* Member Since */}
                <div className="bg-black/50 rounded-lg p-4 border border-white/10">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    Member Since
                  </div>
                  <div className="text-white text-base font-medium">{memberSince}</div>
                </div>
              </div>
            </div>
          </div>
      </GlassCard>

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
