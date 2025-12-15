'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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
  FileImage
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
}

const difficultyConfig = {
  Easy: { 
    color: 'bg-green-500/20 text-green-400 border-green-500/50', 
    icon: Zap,
    gradient: 'from-green-500/10 to-green-600/5'
  },
  Medium: { 
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', 
    icon: Target,
    gradient: 'from-yellow-500/10 to-yellow-600/5'
  },
  Hard: { 
    color: 'bg-red-500/20 text-red-400 border-red-500/50', 
    icon: Trophy,
    gradient: 'from-red-500/10 to-red-600/5'
  },
}

const categoryConfig: Record<string, { emoji: string, color: string }> = {
  'Social Media': { emoji: '📱', color: 'text-blue-400' },
  'Content Creation': { emoji: '🎨', color: 'text-purple-400' },
  'Community': { emoji: '👥', color: 'text-green-400' },
  'Gaming': { emoji: '🎮', color: 'text-red-400' },
  'Learning': { emoji: '📚', color: 'text-yellow-400' },
  'Event': { emoji: '🎉', color: 'text-pink-400' },
}

function MissionCard({ mission, index }: { mission: Mission; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const diffConfig = difficultyConfig[mission.difficulty]
  const DiffIcon = diffConfig.icon
  const categoryInfo = categoryConfig[mission.category] || { emoji: '🎯', color: 'text-gray-400' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <GlassCard 
        hover 
        className={`text-white p-4 sm:p-5 md:p-6 bg-gradient-to-br ${diffConfig.gradient} backdrop-blur-md bg-black/20 relative overflow-hidden`}
      >
        {/* Featured Badge */}
        {mission.featured && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-lg">
              ⭐ Featured
            </Badge>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{categoryInfo.emoji}</span>
              <h3 className="text-xl sm:text-2xl font-bold text-white">{mission.name}</h3>
            </div>
            <p className="text-gray-400 text-sm sm:text-base line-clamp-2">{mission.description}</p>
          </div>
        </div>

        {/* Mission Stats */}
        <div className="flex flex-wrap gap-2 mb-4">
          {/* Points Badge */}
          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-md">
            <Trophy className="h-3 w-3 mr-1" />
            {mission.points} Points
          </Badge>

          {/* Difficulty Badge */}
          <Badge className={`${diffConfig.color} border shadow-sm`}>
            <DiffIcon className="h-3 w-3 mr-1" />
            {mission.difficulty}
          </Badge>

          {/* Category Badge */}
          <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/20">
            {mission.category}
          </Badge>

          {/* Time Limited Badge */}
          {mission.isTimeLimited && mission.daysRemaining !== null && (
            <Badge 
              className={`${
                mission.daysRemaining <= 3 
                  ? 'bg-red-500/20 text-red-400 border-red-500/50 animate-pulse' 
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
              } border shadow-sm`}
            >
              <Clock className="h-3 w-3 mr-1" />
              {mission.daysRemaining} {mission.daysRemaining === 1 ? 'day' : 'days'} left
            </Badge>
          )}

          {/* Completion Progress */}
          {mission.maxCompletions && (
            <Badge variant="outline" className="bg-white/5 text-gray-300 border-white/20">
              {mission.currentCompletions}/{mission.maxCompletions} completed
            </Badge>
          )}
        </div>

        {/* Proof Type Indicator */}
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            {mission.requiredProofType === 'image' && <><ImageIcon className="h-4 w-4" /> Image Required</>}
            {mission.requiredProofType === 'video' && <><Video className="h-4 w-4" /> Video Required</>}
            {mission.requiredProofType === 'both' && <><FileImage className="h-4 w-4" /> Image or Video Required</>}
          </span>
        </div>

        {/* Expandable Instructions */}
        <div className="border-t border-white/10 pt-4">
          <Button
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between text-white hover:bg-white/5 p-2"
          >
            <span className="font-semibold">
              {expanded ? 'Hide' : 'View'} Instructions
            </span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-3 p-4 rounded-lg bg-black/40 border border-white/10"
            >
              <h4 className="text-white font-semibold mb-2">📋 Instructions:</h4>
              <p className="text-gray-300 text-sm whitespace-pre-wrap">{mission.instructions}</p>
              
              {mission.exampleImageUrl && (
                <div className="mt-4">
                  <h4 className="text-white font-semibold mb-2">📸 Example:</h4>
                  <img 
                    src={mission.exampleImageUrl} 
                    alt="Mission example" 
                    className="rounded-lg border border-white/20 max-w-full h-auto"
                  />
                </div>
              )}

              {mission.isTimeLimited && (
                <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-blue-300 font-semibold">Time-Limited Mission</p>
                    <p className="text-gray-400">
                      {mission.startDate && `Started: ${new Date(mission.startDate).toLocaleDateString()}`}
                      {mission.endDate && ` • Ends: ${new Date(mission.endDate).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  )
}

export default function CurrentMissions() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMissions() {
      try {
        const response = await fetch('/api/ze-club/missions')
        if (!response.ok) {
          throw new Error('Failed to fetch missions')
        }
        const data = await response.json()
        setMissions(data)
      } catch (err) {
        console.error('Error fetching missions:', err)
        setError('Failed to load missions. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMissions()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-600">
            <Target className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Current Missions</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <GlassCard key={i} className="p-6 h-64 animate-pulse" variant="intense" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-600">
            <Target className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Current Missions</h2>
        </div>
        <GlassCard variant="intense" className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-400">{error}</p>
        </GlassCard>
      </div>
    )
  }

  if (missions.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-600">
            <Target className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Current Missions</h2>
        </div>
        <GlassCard variant="intense" className="p-8 text-center">
          <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 text-lg">No missions available right now.</p>
          <p className="text-gray-500 text-sm mt-2">Check back soon for exciting challenges!</p>
        </GlassCard>
      </div>
    )
  }

  // Separate featured and regular missions
  const featuredMissions = missions.filter(m => m.featured)
  const regularMissions = missions.filter(m => !m.featured)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-600">
          <Target className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Current Missions</h2>
          <p className="text-gray-400 text-sm sm:text-base">Complete these missions to earn points and climb the leaderboard!</p>
        </div>
      </div>

      {/* Featured Missions */}
      {featuredMissions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-yellow-400 flex items-center gap-2">
            ⭐ Featured Missions
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
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              🎯 All Missions
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
    </div>
  )
}
