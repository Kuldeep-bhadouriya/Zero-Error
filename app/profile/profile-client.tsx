'use client'

import { useRouter } from 'next/navigation'
import { ProfileHeader } from '@/components/profile/ProfileHeader'
import { ProfileStats } from '@/components/profile/ProfileStats'
import { EditProfileForm } from '@/components/profile/EditProfileForm'
import { RedemptionHistory } from '@/components/profile/RedemptionHistory'
import { SecuritySettings } from '@/components/profile/SecuritySettings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Shield, History } from 'lucide-react'

interface ProfileClientProps {
  profile: {
    id: string
    email?: string
    image?: string
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
    zeCoins?: number
    experience?: number
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

  function handleUpdate() {
    router.refresh()
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Profile Header - Condensed & Cleaner */}
      <ProfileHeader profile={profile} onUpdate={handleUpdate} />

      {/* Global Stats - Always Visible */}
      <ProfileStats stats={stats} />

      {/* Tabbed Interface for Settings & History */}
      <div className="mt-8 px-4 sm:px-0">
        <Tabs defaultValue="general" className="w-full">
          <div className="flex justify-center sm:justify-start mb-6">
            <TabsList className="bg-black/40 border border-white/5 h-12 p-1 rounded-xl glass-effect w-full sm:w-auto grid grid-cols-3 sm:flex">
              <TabsTrigger 
                value="general" 
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/20 w-full sm:w-auto px-2 sm:px-6 h-full rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>General</span>
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/20 w-full sm:w-auto px-2 sm:px-6 h-full rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger 
                value="history" 
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-red-500/20 w-full sm:w-auto px-2 sm:px-6 h-full rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm"
              >
                <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>History</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="min-h-[400px]">
            <TabsContent value="general" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="max-w-2xl">
                 <EditProfileForm profile={profile} onSuccess={handleUpdate} />
               </div>
            </TabsContent>
            
            <TabsContent value="security" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
               <div className="max-w-2xl">
                 <SecuritySettings />
               </div>
            </TabsContent>

            <TabsContent value="history" className="mt-0 focus-visible:outline-none animate-in fade-in slide-in-from-bottom-2 duration-500">
              <RedemptionHistory />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
