"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { GlassCard } from "@/components/ui/GlassCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Flame, 
  Clock, 
  Trophy, 
  ArrowRight,
  Zap,
  Target,
  Award
} from "lucide-react"
import Link from "next/link"

interface FeaturedMission {
  _id: string
  name: string
  description: string
  points: number
  category: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  daysRemaining: number | null
  isTimeLimited: boolean
}

const difficultyConfig = {
  Easy: { color: "bg-green-500/20 text-green-400 border-green-500/50", icon: Zap },
  Medium: { color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50", icon: Target },
  Hard: { color: "bg-red-500/20 text-red-400 border-red-500/50", icon: Flame },
}

function FeaturedMissions() {
  const [missions, setMissions] = useState<FeaturedMission[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchFeaturedMissions() {
      try {
        const response = await fetch("/api/ze-club/user/featured-missions")
        if (!response.ok) throw new Error("Failed to fetch featured missions")
        const data = await response.json()
        setMissions(data.slice(0, 3)) // Show max 3 featured missions
      } catch (err) {
        console.error("Error fetching featured missions:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFeaturedMissions()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Flame className="h-6 w-6 text-orange-500" />
          Featured Missions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <GlassCard key={i} className="p-6 h-48 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (missions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Flame className="h-6 w-6 text-orange-500" />
          Featured Missions
        </h2>
        <GlassCard variant="intense" className="p-8 text-center">
          <Trophy className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No featured missions available right now.</p>
          <p className="text-gray-500 text-sm mt-2">Check back soon for exciting challenges!</p>
        </GlassCard>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Flame className="h-7 w-7 text-orange-500" />
            <motion.div
              className="absolute inset-0 blur-lg"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Flame className="h-7 w-7 text-orange-500" />
            </motion.div>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent">
            Featured Missions
          </h2>
        </div>
        <Link href="/ze-club/missions">
          <Button 
            variant="ghost" 
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 group"
          >
            View All
            <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>

      {/* Mission Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {missions.map((mission, index) => {
          const diffConfig = difficultyConfig[mission.difficulty]
          const DifficultyIcon = diffConfig.icon

          return (
            <motion.div
              key={mission._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 + index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group"
            >
              <GlassCard variant="intense" hover className="relative overflow-hidden h-full">
                {/* Animated gradient overlay */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-red-500/20 via-orange-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 blur-3xl rounded-full transition-opacity duration-500" />
                
                {/* Featured badge */}
                <div className="absolute top-3 right-3 z-10">
                  <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg">
                    <Flame className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                </div>

                <div className="relative z-10 p-6 flex flex-col h-full">
                  {/* Category & Difficulty */}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge 
                      variant="outline" 
                      className="text-xs bg-black/60 border-white/10 text-gray-300"
                    >
                      {mission.category}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${diffConfig.color} border`}
                    >
                      <DifficultyIcon className="h-3 w-3 mr-1" />
                      {mission.difficulty}
                    </Badge>
                  </div>

                  {/* Mission Name */}
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-400 transition-colors line-clamp-2">
                    {mission.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-400 mb-4 flex-grow line-clamp-3">
                    {mission.description}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
                    {/* Points */}
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
                        <Award className="h-4 w-4 text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Reward</p>
                        <p className="text-sm font-bold text-yellow-400">
                          {mission.points} pts
                        </p>
                      </div>
                    </div>

                    {/* Time Remaining */}
                    {mission.isTimeLimited && mission.daysRemaining !== null && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Clock className="h-3.5 w-3.5 text-orange-400" />
                        <span className="text-orange-400 font-medium">
                          {mission.daysRemaining}d left
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Hover CTA */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <Link href={`/ze-club/missions#${mission._id}`}>
                      <Button 
                        className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg"
                      >
                        Start Mission
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </motion.div>
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default FeaturedMissions
