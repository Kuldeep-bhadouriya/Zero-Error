'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import AnnouncementCarousel, { AnnouncementItem } from './AnnouncementCarousel'
import { Loader2 } from 'lucide-react'

function mapPathToTarget(pathname: string | null) {
  if (!pathname || pathname === '/') {
    return 'home'
  }

  const normalized = pathname.replace(/^\/+/, '')

  if (normalized.startsWith('ze-club/missions')) {
    return 'ze-club/missions'
  }
  if (normalized.startsWith('ze-club/leaderboard')) {
    return 'ze-club/leaderboard'
  }
  if (normalized.startsWith('ze-club/rewards')) {
    return 'ze-club/rewards'
  }
  if (normalized.startsWith('ze-club')) {
    return 'ze-club'
  }
  if (normalized.startsWith('events')) {
    return 'events'
  }
  if (normalized.startsWith('about')) {
    return 'about'
  }
  if (normalized.startsWith('services')) {
    return 'services'
  }
  if (normalized.startsWith('teams')) {
    return 'teams'
  }
  if (normalized.startsWith('contact')) {
    return 'contact'
  }
  if (normalized.startsWith('support')) {
    return 'support'
  }

  return normalized
}

function AnnouncementBanner() {
  const pathname = usePathname()
  const targetPage = useMemo(() => mapPathToTarget(pathname), [pathname])
  const shouldHide = pathname?.startsWith('/admin') || pathname?.startsWith('/join-us') || pathname?.startsWith('/signup')
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (shouldHide) {
      setAnnouncements([])
      return
    }

    const controller = new AbortController()

    async function fetchAnnouncements() {
      setLoading(true)
      try {
        const response = await fetch(`/api/announcements/active?targetPage=${encodeURIComponent(targetPage)}`, {
          cache: 'no-store',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to load announcements')
        }

        const data = await response.json()
        setAnnouncements(data.announcements || [])
      } catch (error: any) {
        if (error.name === 'AbortError') {
          return
        }
        console.error('Announcement fetch failed', error)
        setAnnouncements([])
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()

    return () => controller.abort()
  }, [targetPage, shouldHide])

  if (shouldHide) {
    return null
  }

  const hasAnnouncements = announcements.length > 0

  return (
    <>
      <AnimatePresence>
        {hasAnnouncements && (
          <motion.div
            key="announcement-banner"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none fixed left-0 right-0 top-16 z-[90] px-4 md:top-24"
          >
            <div className="pointer-events-auto mx-auto max-w-5xl">
              <AnnouncementCarousel announcements={announcements} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && !hasAnnouncements && (
        <div className="fixed left-0 right-0 top-16 z-[80] px-4 md:top-24">
          <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/50 py-3 text-sm text-white/70">
            <Loader2 className="h-4 w-4 animate-spin" />
            Syncing announcements...
          </div>
        </div>
      )}

      {hasAnnouncements && <div className="h-20 md:h-20" aria-hidden />}
    </>
  )
}

export default AnnouncementBanner
