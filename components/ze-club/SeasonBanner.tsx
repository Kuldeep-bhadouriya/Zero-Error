'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { CalendarClock, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import logger from '@/lib/browser-logger'

interface SeasonInfo {
  seasonNumber: number
  name: string
  scheduledEndDate: string
  daysRemaining: number
  hoursRemaining: number
  isExpired?: boolean
}

export default function SeasonBanner() {
  const pathname = usePathname()
  const [season, setSeason] = useState<SeasonInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSeason = useCallback(async () => {
    try {
      fetch('/api/ze-club/season/check-end', { cache: 'no-store' }).catch(() => {})

      const res = await fetch('/api/ze-club/season/current', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        const s: SeasonInfo | null = data.season
          ? {
              seasonNumber: data.season.seasonNumber,
              name: data.season.name,
              scheduledEndDate: data.season.scheduledEndDate,
              daysRemaining: data.season.daysRemaining,
              hoursRemaining: data.season.hoursRemaining,
              isExpired: data.season.isExpired,
            }
          : null
        setSeason(s)
      }
    } catch (error) {
      logger.error('Failed to fetch season:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Re-fetch on ZE Club page navigation so extension updates are reflected quickly
  useEffect(() => {
    fetchSeason()
  }, [pathname, fetchSeason])

  // Also poll periodically so users see updated extension times without manual refresh/navigation
  useEffect(() => {
    const id = setInterval(() => {
      fetchSeason()
    }, 60_000)

    return () => clearInterval(id)
  }, [fetchSeason])

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
            {season.isExpired
              ? 'Ending soon'
              : `${season.daysRemaining}d ${(season.hoursRemaining || 0) % 24}h left`}
          </span>
        </div>
      )}

      {!season && (
        <span className="text-xs text-zinc-500">View past seasons</span>
      )}
    </Link>
  )
}
