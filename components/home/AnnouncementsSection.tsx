'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Megaphone, BellRing } from 'lucide-react'
import type { AnnouncementItem } from '@/components/shared/AnnouncementCarousel'
import { formatAnnouncementMessage } from '@/components/shared/AnnouncementCarousel'
import { cn } from '@/lib/utils'

interface ExtendedAnnouncement extends AnnouncementItem {
  updatedAt?: string
  link?: string
  linkText?: string
}

const TYPE_META: Record<AnnouncementItem['type'], { label: string; icon: any; ring: string; chip: string }> = {
  info: {
    label: 'Info',
    icon: Megaphone,
    ring: 'ring-sky-400/60',
    chip: 'bg-sky-500/15 text-sky-200 border border-sky-400/30',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    ring: 'ring-amber-400/60',
    chip: 'bg-amber-500/15 text-amber-200 border border-amber-400/30',
  },
  success: {
    label: 'Success',
    icon: CheckCircle2,
    ring: 'ring-emerald-400/60',
    chip: 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/30',
  },
  urgent: {
    label: 'Urgent',
    icon: BellRing,
    ring: 'ring-rose-500/80',
    chip: 'bg-rose-500/20 text-rose-100 border border-rose-500/40',
  },
}

function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState<ExtendedAnnouncement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchAnnouncements() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/announcements/active?targetPage=home', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Unable to fetch announcements')
        }
        const data = await response.json()
        if (isMounted) {
          setAnnouncements(data.announcements || [])
        }
      } catch (fetchError: any) {
        if (isMounted) {
          setError(fetchError.message || 'Something went wrong')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchAnnouncements()

    return () => {
      isMounted = false
    }
  }, [])

  const visibleAnnouncements = useMemo(() => announcements.slice(0, 3), [announcements])

  if (loading && !announcements.length) {
    return (
      <section className="relative z-10 w-full px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/5 bg-white/5 p-8 backdrop-blur">
          <SkeletonRow />
          <SkeletonRow delay={0.1} />
          <SkeletonRow delay={0.2} />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="relative z-10 w-full px-6 py-20 md:px-12">
        <div className="mx-auto max-w-4xl rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center text-rose-100">
          <p className="text-lg font-semibold">Announcements are offline for a moment.</p>
          <p className="text-sm text-rose-200/80">{error}</p>
        </div>
      </section>
    )
  }

  if (!visibleAnnouncements.length) {
    return null
  }

  return (
    <section className="relative z-10 w-full px-6 py-20 md:px-12">
      <div className="mx-auto max-w-6xl space-y-10 rounded-3xl border border-white/10 bg-black/40 p-8 shadow-[0_20px_120px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-400">Stay in the loop</p>
            <h2 className="mt-2 text-3xl font-black text-white md:text-4xl">Latest announcements</h2>
            <p className="text-sm text-gray-400">
              Admins post real-time updates about missions, events, and ZE Club rewards here.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Synced live
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {visibleAnnouncements.map((announcement, index) => {
            const meta = TYPE_META[announcement.type]
            const Icon = meta.icon

            return (
              <motion.article
                key={announcement._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ delay: index * 0.08 }}
              className={cn(
                'group flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/[0.02] p-6 text-white shadow-xl transition hover:-translate-y-1',
                'ring-1',
                  meta.ring
              )}
            >
                <div>
                  <div className="flex items-center gap-3">
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide', meta.chip)}>
                      <Icon className="h-3.5 w-3.5" />
                      {meta.label}
                    </span>
                    <span className="text-xs text-gray-400">Priority {announcement.priority}/10</span>
                  </div>
                  <h3 className="mt-4 text-xl font-bold leading-tight">{announcement.title}</h3>
                  <p
                    className="mt-3 text-sm text-gray-100/90"
                    dangerouslySetInnerHTML={{ __html: formatAnnouncementMessage(announcement.message) }}
                  />
                </div>

              {announcement.link && announcement.linkText ? (
                <Link
                  href={announcement.link}
                  target="_blank"
                  className="mt-6 inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold shadow-inner shadow-white/20 transition hover:bg-white hover:text-black"
                >
                  {announcement.linkText}
                </Link>
              ) : (
                <div className="mt-6 text-xs text-gray-400">
                  Posted by ZE Club Admins
                </div>
              )}
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function SkeletonRow({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="mb-6 h-32 rounded-2xl border border-white/5 bg-white/5"
    />
  )
}

export default AnnouncementsSection
