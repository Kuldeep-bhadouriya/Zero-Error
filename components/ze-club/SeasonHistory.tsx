'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Users, Calendar, Crown, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import logger from '@/lib/browser-logger'

interface SeasonTop3 {
  zeTag: string
  finalExperience: number
  finalRank: string
  finalRankIcon: string
  leaderboardPosition: number
  profilePhotoUrl?: string
  isSeasonWinner: boolean
}

interface SeasonHistoryItem {
  _id: string
  seasonNumber: number
  name: string
  description?: string
  startDate: string
  scheduledEndDate: string
  actualEndDate?: string
  totalParticipants?: number
  top3: SeasonTop3[]
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function SeasonHistory() {
  const [seasons, setSeasons] = useState<SeasonHistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/ze-club/season/history')
        if (res.ok) {
          const data = await res.json()
          setSeasons(data)
        }
      } catch (error) {
        logger.error('Failed to fetch season history:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (seasons.length === 0) {
    return (
      <div className="text-center py-20">
        <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">No Past Seasons</h3>
        <p className="text-gray-400">
          There are no completed seasons yet. Check back after the current season ends.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {seasons.map((season, index) => (
        <motion.div
          key={season._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Link href={`/ze-club/seasons/${season.seasonNumber}`}>
            <div className="group p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300">
              {/* Season Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                    Season {season.seasonNumber}: {season.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
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
                </div>
                <Badge variant="outline" className="text-gray-400 border-gray-600 text-xs">
                  Completed
                </Badge>
              </div>

              {/* Top 3 Podium */}
              {season.top3.length > 0 && (
                <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                  {season.top3.map((player, idx) => (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className="relative">
                        <Avatar className={cn(
                          'h-8 w-8 border',
                          idx === 0 ? 'border-yellow-500/50' : idx === 1 ? 'border-slate-400/30' : 'border-orange-500/30'
                        )}>
                          <AvatarImage src={player.profilePhotoUrl || undefined} />
                          <AvatarFallback className="bg-neutral-800 text-[10px]">
                            {player.zeTag.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {idx === 0 && (
                          <Crown className="absolute -top-1.5 -right-1.5 h-3 w-3 text-yellow-400 fill-yellow-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">{player.zeTag}</p>
                        <p className="text-[10px] text-gray-500">
                          {player.finalExperience.toLocaleString()} XP
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
