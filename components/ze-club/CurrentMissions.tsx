'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/badge'
import { 
  Target,
  Clock,
  Trophy,
  Zap,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Video,
  FileImage,
  Search,
  Share2,
  PenTool,
  Users,
  Gamepad2,
  BookOpen,
  Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { useReducedMotion } from '@/hooks/useReducedMotion'

interface Mission {
  _id: string
  name: string
  description: string
  points: number
  category: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  requiredProofType: 'image' | 'video' | 'both'
  instructions: string
  exampleImageUrl?: string
  isTimeLimited: boolean
  daysRemaining: number | null
  startDate?: string
  endDate?: string
  maxCompletions?: number
  currentCompletions: number
  featured: boolean
  isCompleted?: boolean
  isPending?: boolean
  isAvailable?: boolean
}

const difficultyConfig = {
  Easy: { 
    color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30', 
    icon: Zap,
    gradient: 'blue' as const,
  },
  Medium: { 
    color: 'bg-orange-500/10 text-orange-300 border-orange-500/30', 
    icon: Target,
    gradient: 'orange' as const,
  },
  Hard: { 
    color: 'bg-red-500/10 text-red-300 border-red-500/30', 
    icon: Trophy,
    gradient: 'red' as const,
  },
}

const categoryConfig: Record<
  string,
  { icon: any; color: string }
> = {
  'Social Media': { icon: Share2, color: 'text-sky-300' },
  'Content Creation': { icon: PenTool, color: 'text-purple-300' },
  'Community': { icon: Users, color: 'text-emerald-300' },
  'Gaming': { icon: Gamepad2, color: 'text-red-300' },
  'Learning': { icon: BookOpen, color: 'text-amber-300' },
  'Event': { icon: Calendar, color: 'text-pink-300' },
}

function MissionCard({ mission, index }: { mission: Mission; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const [currentTime, setCurrentTime] = useState(() => new Date())
  const prefersReducedMotion = useReducedMotion()
  const diffConfig = difficultyConfig[mission.difficulty]
  const DiffIcon = diffConfig.icon
  const categoryInfo = categoryConfig[mission.category] || { icon: Target, color: 'text-zinc-400' }
  const CategoryIcon = categoryInfo.icon

  useEffect(() => {
    if (!mission.isTimeLimited || !mission.endDate) return
    const t = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [mission.isTimeLimited, mission.endDate])

  function formatCountdown(endDate: string): string {
    const msLeft = new Date(endDate).getTime() - currentTime.getTime()
    if (msLeft <= 0) return 'Expired'
    const days = Math.floor(msLeft / (1000 * 60 * 60 * 24))
    const hours = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const mins = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60))
    const secs = Math.floor((msLeft % (1000 * 60)) / 1000)
    const hh = hours.toString().padStart(2, '0')
    const mm = mins.toString().padStart(2, '0')
    const ss = secs.toString().padStart(2, '0')
    return days > 0 ? `${days}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`
  }

  function isUrgent(endDate: string): boolean {
    return new Date(endDate).getTime() - currentTime.getTime() < 2 * 24 * 60 * 60 * 1000
  }

  const canSubmit = Boolean(mission.isAvailable) && !mission.isCompleted && !mission.isPending

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
      animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.25, delay: 0 }}
    >
      <GlassCard 
        hover={canSubmit}
        variant="subtle"
        gradient={diffConfig.gradient}
        className={`text-white p-4 sm:p-5 md:p-6 !bg-[#09090b]/30 ${mission.isCompleted || mission.isPending ? 'opacity-80' : ''}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg bg-white/5 border border-white/10 ${categoryInfo.color}`}>
                <CategoryIcon className="h-4 w-4" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-white truncate">{mission.name}</h3>
            </div>
            <p className="text-gray-400 text-sm mt-2 line-clamp-2">{mission.description}</p>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {mission.featured && (
              <Badge className="bg-white/10 text-white border border-white/15">Featured</Badge>
            )}
            {mission.isCompleted && (
              <Badge className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Completed
              </Badge>
            )}
            {mission.isPending && (
              <Badge className="bg-sky-500/10 text-sky-300 border border-sky-500/30">
                Pending
              </Badge>
            )}
          </div>
        </div>

        {/* Mission Stats */}
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="bg-red-500/10 text-red-200 border border-red-500/30">
            <Trophy className="h-3 w-3 mr-1" />
            {mission.points} pts
          </Badge>

          <Badge className={`${diffConfig.color} border`}>
            <DiffIcon className="h-3 w-3 mr-1" />
            {mission.difficulty}
          </Badge>

          <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/15">
            {mission.category}
          </Badge>

          {mission.isTimeLimited && mission.endDate && (
            <Badge
              className={`${
                isUrgent(mission.endDate)
                  ? 'bg-red-500/10 text-red-200 border-red-500/30'
                  : 'bg-sky-500/10 text-sky-200 border-sky-500/30'
              } border font-mono`}
            >
              <Clock className="h-3 w-3 mr-1" />
              {formatCountdown(mission.endDate)}
            </Badge>
          )}

          {mission.maxCompletions && (
            <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/15">
              {mission.currentCompletions}/{mission.maxCompletions}
            </Badge>
          )}
        </div>

        {/* Proof Type Indicator */}
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            {mission.requiredProofType === 'image' && <><ImageIcon className="h-4 w-4" /> Image Required</>}
            {mission.requiredProofType === 'video' && <><Video className="h-4 w-4" /> Video Required</>}
            {mission.requiredProofType === 'both' && <><FileImage className="h-4 w-4" /> Image or Video Required</>}
          </span>
        </div>

        {/* Expandable Instructions */}
        <div className="border-t border-white/10 pt-4 mt-4">
          <Button
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-white hover:bg-white/5 px-2 py-2"
          >
            <span className="font-semibold">
              {expanded ? 'Hide details' : 'View details'}
            </span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                animate={prefersReducedMotion ? undefined : { height: 'auto', opacity: 1 }}
                exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                className="mt-3 p-4 rounded-lg bg-black/30 border border-white/10 overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 w-full">
                    <h4 className="text-white font-semibold">Instructions</h4>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap mt-2 break-words">
                      {mission.instructions}
                    </p>
                  </div>
                  <Button asChild size="sm" className="bg-red-600 hover:bg-red-700 text-white shrink-0 w-full sm:w-auto mt-2 sm:mt-0" disabled={!canSubmit}>
                    <Link href={`/ze-club/missions/submit?missionId=${mission._id}`}>Submit proof</Link>
                  </Button>
                </div>

                {mission.exampleImageUrl && (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-widest text-zinc-500 font-medium">Example</p>
                    <div className="mt-2 rounded-lg overflow-hidden border border-white/10 bg-black/40">
                      <img
                        src={mission.exampleImageUrl}
                        alt="Mission example"
                        loading="lazy"
                        decoding="async"
                        width={1280}
                        height={720}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                )}

                {mission.isTimeLimited && (mission.startDate || mission.endDate) && (
                  <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-sky-500/5 border border-sky-500/20">
                    <AlertCircle className="h-4 w-4 text-sky-300 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="text-sky-200 font-medium">Time window</p>
                      <p className="text-gray-400">
                        {mission.startDate && `Starts: ${new Date(mission.startDate).toLocaleDateString()}`}
                        {mission.endDate && ` • Ends: ${new Date(mission.endDate).toLocaleDateString()}`}
                      </p>
                      {mission.endDate && (
                        <p className={`font-mono font-semibold mt-1 ${isUrgent(mission.endDate) ? 'text-red-300' : 'text-sky-300'}`}>
                          {formatCountdown(mission.endDate)} remaining
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            className="text-gray-200 hover:bg-white/5"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? 'Hide details' : 'Details'}
          </Button>

          <Button
            asChild
            disabled={!canSubmit}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Link href={`/ze-club/missions/submit?missionId=${mission._id}`}>Submit proof</Link>
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  )
}

export default function CurrentMissions({ missions }: { missions: Mission[] }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | 'available' | 'completed' | 'pending'>('all')

  const filteredMissions = useMemo(() => {
    const q = query.trim().toLowerCase()

    return missions
      .filter((m) => {
        if (!q) return true
        return (
          m.name.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q) ||
          m.category?.toLowerCase().includes(q)
        )
      })
      .filter((m) => {
        if (status === 'all') return true
        if (status === 'available') return Boolean(m.isAvailable)
        if (status === 'completed') return Boolean(m.isCompleted)
        return Boolean(m.isPending)
      })
  }, [missions, query, status])

  if (missions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-600">
            <Target className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Missions</h2>
        </div>
        <GlassCard variant="intense" className="p-8 text-center">
          <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-lg">No missions available right now.</p>
          <p className="text-gray-500 text-sm mt-2">Check back soon for exciting challenges!</p>
        </GlassCard>
      </div>
    )
  }

  const featuredMissions = filteredMissions.filter((m) => m.featured)
  const regularMissions = filteredMissions.filter((m) => !m.featured)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-white">Browse missions</h2>
          <p className="text-gray-400 text-sm sm:text-base">
            Find missions that match your playstyle and submit proof when you're done.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:min-w-[320px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search missions…"
              className="pl-9 bg-black/40 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-red-500/30"
            />
          </div>
          <div className="flex items-center gap-2">
            {([
              { key: 'all', label: 'All' },
              { key: 'available', label: 'Available' },
              { key: 'pending', label: 'Pending' },
              { key: 'completed', label: 'Completed' },
            ] as const).map((item) => (
              <Button
                key={item.key}
                type="button"
                variant={status === item.key ? 'secondary' : 'ghost'}
                className={
                  status === item.key
                    ? 'bg-white/10 text-white hover:bg-white/15'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                }
                onClick={() => setStatus(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Missions */}
      {featuredMissions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-medium">
            Featured
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {featuredMissions.map((mission, index) => (
              <MissionCard key={mission._id} mission={mission} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Regular Missions */}
      {regularMissions.length > 0 && (
        <div className="space-y-4">
          {featuredMissions.length > 0 && (
            <h3 className="text-sm uppercase tracking-widest text-zinc-500 font-medium">
              All missions
            </h3>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {regularMissions.map((mission, index) => (
              <MissionCard 
                key={mission._id} 
                mission={mission} 
                index={index + featuredMissions.length} 
              />
            ))}
          </div>
        </div>
      )}

      {filteredMissions.length === 0 && (
        <GlassCard variant="intense" className="p-10 text-center">
          <p className="text-white font-semibold">No results</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your search or filters.</p>
        </GlassCard>
      )}
    </div>
  )
}
