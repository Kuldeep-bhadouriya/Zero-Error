'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, BellRing, CheckCircle2, Megaphone, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const STORAGE_KEY = 'ze-dismissed-announcements'

export interface AnnouncementItem {
  _id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'urgent'
  priority: number
  active: boolean
  dismissible: boolean
  link?: string
  linkText?: string
}

interface AnnouncementCarouselProps {
  announcements: AnnouncementItem[]
}

const TYPE_STYLES: Record<AnnouncementItem['type'], { background: string; accent: string }> = {
  info: {
    background: 'from-sky-600/90 via-blue-600/90 to-cyan-500/80',
    accent: 'bg-sky-400/20 text-sky-50',
  },
  warning: {
    background: 'from-amber-500/90 via-orange-500/90 to-yellow-500/80',
    accent: 'bg-amber-400/20 text-amber-50',
  },
  success: {
    background: 'from-emerald-500/90 via-green-500/90 to-lime-500/80',
    accent: 'bg-emerald-400/20 text-emerald-50',
  },
  urgent: {
    background: 'from-rose-600/90 via-red-600/90 to-orange-600/80',
    accent: 'bg-rose-500/20 text-rose-50',
  },
}

const TYPE_ICONS = {
  info: Megaphone,
  warning: AlertTriangle,
  success: CheckCircle2,
  urgent: BellRing,
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function formatAnnouncementMessage(raw: string) {
  let formatted = escapeHtml(raw)
  formatted = formatted.replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="underline font-semibold">$1</a>')
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  formatted = formatted.replace(/(^|[^*])\*(?!\*)([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
  formatted = formatted.replace(/\n/g, '<br />')
  return formatted
}

function AnnouncementCarousel({ announcements }: AnnouncementCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [autoHiddenIds, setAutoHiddenIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setDismissedIds(new Set(parsed))
        }
      }
    } catch (error) {
      console.error('Failed to parse dismissed announcements', error)
    }
  }, [])

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(
      (announcement) => !dismissedIds.has(announcement._id) && !autoHiddenIds.has(announcement._id)
    )
  }, [announcements, dismissedIds, autoHiddenIds])

  useEffect(() => {
    if (!filteredAnnouncements.length) {
      setActiveIndex(0)
      return
    }
    setActiveIndex((prev) => Math.min(prev, filteredAnnouncements.length - 1))
  }, [filteredAnnouncements.length])

  useEffect(() => {
    if (filteredAnnouncements.length <= 1) {
      return
    }

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % filteredAnnouncements.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [filteredAnnouncements.length])

  useEffect(() => {
    const currentAnnouncement = filteredAnnouncements[activeIndex]
    if (!currentAnnouncement || !currentAnnouncement.dismissible) {
      return
    }

    const timer = setTimeout(() => {
      setAutoHiddenIds((prev) => {
        const next = new Set(prev)
        next.add(currentAnnouncement._id)
        return next
      })
    }, 10000)

    return () => clearTimeout(timer)
  }, [filteredAnnouncements, activeIndex])

  function handleDismiss(id: string, persist = true) {
    if (persist) {
      setDismissedIds((prev) => {
        const next = new Set(prev)
        next.add(id)
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)))
          } catch (error) {
            console.error('Unable to persist dismissed announcements', error)
          }
        }
        return next
      })
    } else {
      setAutoHiddenIds((prev) => {
        const next = new Set(prev)
        next.add(id)
        return next
      })
    }
  }

  if (!filteredAnnouncements.length) {
    return null
  }

  const currentAnnouncement = filteredAnnouncements[activeIndex]
  const Icon = TYPE_ICONS[currentAnnouncement.type]

  return (
    <div className="pointer-events-auto">
      <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-black/60 shadow-2xl shadow-black/40">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentAnnouncement._id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className={cn(
              'bg-gradient-to-r px-4 py-5 md:px-6 md:py-6 text-white',
              TYPE_STYLES[currentAnnouncement.type].background,
              currentAnnouncement.type === 'urgent' && 'animate-pulse'
            )}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn('rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest', TYPE_STYLES[currentAnnouncement.type].accent)}>
                    {currentAnnouncement.type}
                  </span>
                  <div className="flex items-center text-xs text-white/80">
                    <Icon className="mr-1 h-4 w-4" />
                    Priority {currentAnnouncement.priority}/10
                  </div>
                </div>
                <h3 className="mt-2 text-lg font-bold md:text-2xl">{currentAnnouncement.title}</h3>
                <p
                  className="mt-2 text-sm leading-relaxed md:text-base"
                  dangerouslySetInnerHTML={{ __html: formatAnnouncementMessage(currentAnnouncement.message) }}
                />
              </div>

              {currentAnnouncement.link && currentAnnouncement.linkText && (
                <Link
                  href={currentAnnouncement.link}
                  target="_blank"
                  className="inline-flex items-center justify-center rounded-xl bg-white/90 px-4 py-2 text-sm font-semibold text-black shadow-lg shadow-black/30 transition hover:bg-white"
                >
                  {currentAnnouncement.linkText}
                </Link>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute right-3 top-3 flex items-center gap-2 text-xs text-white/70">
          {filteredAnnouncements.length > 1 && (
            <span>
              {activeIndex + 1}/{filteredAnnouncements.length}
            </span>
          )}
          {currentAnnouncement.dismissible && (
            <button
              type="button"
              onClick={() => handleDismiss(currentAnnouncement._id)}
              className="rounded-full bg-white/20 p-1 transition hover:bg-white/40"
              aria-label="Dismiss announcement"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {filteredAnnouncements.length > 1 && (
        <div className="mt-3 flex items-center justify-between text-xs text-white/70">
          <div className="flex gap-2">
            {filteredAnnouncements.map((item, index) => (
              <button
                key={item._id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={cn(
                  'h-2.5 w-2.5 rounded-full transition',
                  index === activeIndex ? 'bg-white' : 'bg-white/30'
                )}
                aria-label={`Show announcement ${index + 1}`}
              />
            ))}
          </div>
          <p>Auto advances every 5s • auto hides at 10s</p>
        </div>
      )}
    </div>
  )
}

export default AnnouncementCarousel
