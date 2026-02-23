'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Crown, Loader2, Shield, Calendar, Users, ArrowLeft, Target, Gift } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface SeasonInfo {
  seasonNumber: number
  name: string
  description?: string
  startDate: string
  scheduledEndDate: string
  actualEndDate?: string
  totalParticipants?: number
  status: string
}

interface ArchiveEntry {
  zeTag: string
  finalExperience: number
  finalZeCoins: number
  finalRank: string
  finalRankIcon: string
  leaderboardPosition: number
  profilePhotoUrl?: string
  totalMissionsCompleted: number
  totalRedemptions: number
  isSeasonWinner: boolean
  isTopThree: boolean
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function SeasonLeaderboard({ seasonNumber }: { seasonNumber: number }) {
  const [season, setSeason] = useState<SeasonInfo | null>(null)
  const [leaderboard, setLeaderboard] = useState<ArchiveEntry[]>([])
  const [userStats, setUserStats] = useState<ArchiveEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [leaderboardRes, userRes] = await Promise.all([
          fetch(`/api/ze-club/season/${seasonNumber}/leaderboard`),
          fetch(`/api/ze-club/season/${seasonNumber}/user`).catch(() => null),
        ])

        if (!leaderboardRes.ok) {
          throw new Error('Season not found')
        }

        const leaderboardData = await leaderboardRes.json()
        setSeason(leaderboardData.season)
        setLeaderboard(leaderboardData.leaderboard)

        if (userRes && userRes.ok) {
          const userData = await userRes.json()
          setUserStats(userData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [seasonNumber])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error || !season) {
    return (
      <div className="text-center py-20">
        <Shield className="h-12 w-12 text-red-400 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold text-white">Season not found</h3>
        <p className="text-gray-400 mt-2">{error}</p>
        <Link href="/ze-club/seasons" className="text-red-400 hover:text-red-300 text-sm mt-4 inline-block">
          Back to Season History
        </Link>
      </div>
    )
  }

  const topThree = leaderboard.slice(0, 3)
  const restPlayers = leaderboard.slice(3)

  return (
    <div className="text-white min-h-screen pb-24 w-full max-w-7xl mx-auto px-4 sm:px-6">
      {/* Back Link */}
      <Link
        href="/ze-club/seasons"
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        All Seasons
      </Link>

      {/* Season Header */}
      <div className="pt-0 pb-8 text-center space-y-4 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-32 bg-red-600/20 blur-[100px] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <h1 className="text-3xl md:text-5xl font-black italic tracking-tight text-white uppercase">
            Season {season.seasonNumber}:{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              {season.name}
            </span>
          </h1>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(season.startDate)} - {formatDate(season.actualEndDate || season.scheduledEndDate)}
            </span>
            {season.totalParticipants !== undefined && season.totalParticipants > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {season.totalParticipants} participants
              </span>
            )}
          </div>
        </motion.div>
      </div>

      {/* User's own stats card (if logged in and participated) */}
      {userStats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-xl bg-red-500/5 border border-red-500/20"
        >
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Your Performance</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-white">#{userStats.leaderboardPosition}</span>
              <div>
                <p className="text-sm font-medium text-white">{userStats.zeTag}</p>
                <p className="text-xs text-gray-400">{userStats.finalRank}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="font-bold text-white">{userStats.finalExperience.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500">XP</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-white flex items-center gap-1"><Target className="h-3 w-3" />{userStats.totalMissionsCompleted}</p>
                <p className="text-[10px] text-gray-500">Missions</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-white flex items-center gap-1"><Gift className="h-3 w-3" />{userStats.totalRedemptions}</p>
                <p className="text-[10px] text-gray-500">Redeemed</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {leaderboard.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No leaderboard data for this season.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Podium */}
          {topThree.length > 0 && (
            <div className="relative py-8 mb-4 md:mb-12 mt-4 md:mt-8">
              <div className="flex flex-row items-end justify-center gap-2 md:gap-8 max-w-4xl mx-auto px-2 md:px-4">
                {topThree[1] && (
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="order-1 w-1/3 md:flex-1"
                  >
                    <PodiumCard player={topThree[1]} rank={2} color="slate" />
                  </motion.div>
                )}
                {topThree[0] && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="order-2 w-1/3 md:w-1/3 z-20 pb-6 md:pb-0 md:-mt-16"
                  >
                    <PodiumCard player={topThree[0]} rank={1} color="yellow" isFirst />
                  </motion.div>
                )}
                {topThree[2] && (
                  <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="order-3 w-1/3 md:flex-1"
                  >
                    <PodiumCard player={topThree[2]} rank={3} color="orange" />
                  </motion.div>
                )}
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-gradient-to-t from-red-600/10 to-transparent blur-3xl pointer-events-none" />
            </div>
          )}

          {/* Rest of leaderboard */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-6 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center gap-12">
                <span className="w-8 text-center">#</span>
                <span>Player</span>
              </div>
              <div className="flex items-center gap-8 md:gap-16">
                <span className="hidden md:block">Rank</span>
                <span className="w-20 text-right">XP</span>
              </div>
            </div>

            <div className="space-y-2">
              {restPlayers.map((player) => (
                <motion.div
                  key={player.leaderboardPosition}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex items-center gap-3 md:gap-12">
                    <div className="w-8 flex justify-center">
                      <span className="font-mono font-bold text-lg text-gray-500">
                        #{player.leaderboardPosition}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 md:h-12 md:w-12 border border-white/10">
                        <AvatarImage src={player.profilePhotoUrl || undefined} />
                        <AvatarFallback className="bg-neutral-800 text-xs">
                          {player.zeTag.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold text-white text-sm md:text-base">
                          {player.zeTag}
                        </div>
                        <div className="text-xs text-gray-500 md:hidden">
                          {player.finalRank}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8 md:gap-16 text-right">
                    <div className="hidden md:block text-sm text-gray-400 font-medium">
                      {player.finalRank}
                    </div>
                    <div className="w-20">
                      <span className="font-mono font-bold text-white">
                        {player.finalExperience.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-gray-600 block leading-none mt-1">XP</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PodiumCard({
  player,
  rank,
  color,
  isFirst = false,
}: {
  player: ArchiveEntry
  rank: number
  color: 'yellow' | 'slate' | 'orange'
  isFirst?: boolean
}) {
  const borderColor = {
    yellow: 'border-yellow-500/50',
    slate: 'border-slate-400/30',
    orange: 'border-orange-700/50',
  }[color]

  const shadowColor = {
    yellow: 'shadow-yellow-500/20',
    slate: 'shadow-slate-500/10',
    orange: 'shadow-orange-500/10',
  }[color]

  const iconColor = {
    yellow: 'text-yellow-400',
    slate: 'text-slate-300',
    orange: 'text-orange-400',
  }[color]

  const bgGradient = {
    yellow: 'from-yellow-500/10 to-yellow-900/10',
    slate: 'from-slate-500/10 to-slate-900/10',
    orange: 'from-orange-500/10 to-orange-900/10',
  }[color]

  return (
    <div
      className={cn(
        'relative flex flex-col items-center p-3 md:p-6 rounded-2xl bg-transparent backdrop-blur-sm border',
        borderColor,
        'shadow-2xl',
        shadowColor,
        isFirst ? 'py-6 md:py-10' : 'py-4 md:py-6'
      )}
    >
      <div className="absolute -top-3 md:-top-5">
        {rank === 1 ? (
          <div className="bg-yellow-500 text-black p-2 md:p-3 rounded-full shadow-lg shadow-yellow-500/50">
            <Crown className="w-4 h-4 md:w-6 md:h-6 fill-current" />
          </div>
        ) : (
          <div
            className={cn(
              'px-2 py-0.5 md:px-4 md:py-1 rounded-full text-xs md:text-sm font-bold border bg-[#09090b]',
              borderColor,
              iconColor
            )}
          >
            #{rank}
          </div>
        )}
      </div>

      <div
        className={cn(
          'absolute inset-0 rounded-2xl bg-gradient-to-b opacity-50 pointer-events-none',
          bgGradient
        )}
      />

      <Avatar
        className={cn(
          'border-2 md:border-4 mb-2 md:mb-4',
          isFirst ? 'w-16 h-16 sm:w-32 sm:h-32' : 'w-10 h-10 sm:w-20 sm:h-20',
          borderColor
        )}
      >
        <AvatarImage src={player.profilePhotoUrl || undefined} className="object-cover" />
        <AvatarFallback className="bg-neutral-900 text-white font-bold text-sm md:text-xl">
          {player.zeTag[0].toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="text-center relative z-10 space-y-0.5 md:space-y-1 w-full">
        <h3
          className={cn(
            'font-bold text-white tracking-tight truncate w-full px-1 text-center',
            isFirst ? 'text-sm sm:text-2xl' : 'text-xs md:text-lg'
          )}
        >
          {player.zeTag}
        </h3>
        <div className="flex items-center justify-center gap-1.5 opacity-80 scale-75 md:scale-100">
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] uppercase tracking-wider border-white/10 bg-white/5',
              iconColor
            )}
          >
            {player.finalRank}
          </Badge>
        </div>
        <div
          className={cn(
            'font-mono font-bold mt-1 md:mt-2',
            isFirst
              ? 'text-lg sm:text-3xl text-yellow-500'
              : 'text-sm md:text-xl text-white/90'
          )}
        >
          {player.finalExperience.toLocaleString()}{' '}
          <span className="hidden md:inline text-xs sm:text-sm font-sans font-medium opacity-50">
            XP
          </span>
        </div>
      </div>
    </div>
  )
}
