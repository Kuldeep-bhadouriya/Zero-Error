'use client'

import { useState, useEffect } from 'react'
import { CalendarClock, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import logger from '@/lib/browser-logger'

interface SeasonInfo {
  seasonNumber: number
  name: string
  daysRemaining: number
  hoursRemaining: number
}

export default function SeasonBanner() {
  const [season, setSeason] = useState<SeasonInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSeason() {
      try {
        // Also trigger the auto-end check
        fetch('/api/ze-club/season/check-end').catch(() => {})

        const res = await fetch('/api/ze-club/season/current')
        if (res.ok) {
          const data = await res.json()
          setSeason(data.season)
        }
      } catch (error) {
        logger.error('Failed to fetch season:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSeason()
  }, [])

  if (loading) return null

  return (
    <Link
      href="/ze-club/seasons"
      className={cn(
        'flex items-center justify-between px-4 py-2.5 rounded-xl border backdrop-blur-sm transition-all hover:scale-[1.01]',
        season
          ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
          : 'bg-zinc-900/50 border-zinc-700/30 hover:border-zinc-600/50'
      )}
    >
      <div className="flex items-center gap-2.5">
        <CalendarClock
          className={cn(
            'h-4 w-4',
            season ? 'text-red-400' : 'text-zinc-500'
          )}
        />
        <span className="text-sm font-medium">
          {season
            ? `Season ${season.seasonNumber}: ${season.name}`
            : 'Off-Season'}
        </span>
      </div>

      {season && (
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock className="h-3 w-3" />
          <span>
            {season.daysRemaining}d {season.hoursRemaining}h left
          </span>
        </div>
      )}

      {!season && (
        <span className="text-xs text-zinc-500">View past seasons</span>
      )}
    </Link>
  )
}
