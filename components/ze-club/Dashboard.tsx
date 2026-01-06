"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { TrendingUp, Award, Star, Zap, Target, Clock, Trophy, Medal, Coins, User, Monitor, MessageCircle, Crosshair, Video, BookOpen, Share2 } from "lucide-react"
import { GlassCard } from "@/components/ui/GlassCard"
import RankCard from "./RankCard"
import FeaturedMissions from "./FeaturedMissions"

interface UserDashboard {
  totalPoints: number // Deprecated: kept for compatibility
  zeCoins: number // For redemption/purchasing
  experience: number // For ranking
  rank: string
  leaderboardRank?: number
  badge: string
  progress: number
  // Phase 1: Valorant-style rank system
  rankIcon: string
  progressToNextRank: number
  nextRankPoints: number
  currentRankPoints: number
}

/**
 * SimpleCounter Component
 * Animates a number from 0 to the target value with easing.
 * Used for the points counter on the dashboard.
 */
function SimpleCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startValue = 0
    const duration = 1500 // Animation duration in milliseconds
    const startTime = Date.now()

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Cubic easing out for smooth animation
      const easedProgress = 1 - Math.pow(1 - progress, 3)

      startValue = Math.floor(easedProgress * value)
      setCount(startValue)

      if (progress === 1) clearInterval(timer)
    }, 16) // ~60fps

    return () => clearInterval(timer)
  }, [value])

  return <span>{count}</span>
}

/**
 * Dashboard Component
 * Displays user's ZE Club statistics including points, rank, badge, and progress.
 * Features animated counters and responsive design.
 */
function Dashboard() {
  const [dashboardData, setDashboardData] = useState<UserDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch("/api/ze-club/user/dashboard")
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data")
        }
        const data = await response.json()
        setDashboardData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div 
          className="text-xl text-gray-400 flex items-center gap-3"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Zap className="h-6 w-6 text-red-500" />
          Loading your stats...
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <GlassCard variant="intense" gradient="red" className="p-6">
          <div className="text-red-400 flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <span>Error: {error}</span>
          </div>
        </GlassCard>
      </motion.div>
    )
  }

  if (!dashboardData) {
    return (
      <GlassCard className="p-6">
        <div className="text-gray-400">No data available.</div>
      </GlassCard>
    )
  }

  const achievements = [
    { icon: Coins, label: "ZE Coins", value: dashboardData.zeCoins, gradient: "from-yellow-500 to-orange-600", description: "For Redemption" },
    { icon: Star, label: "Experience", value: dashboardData.experience, gradient: "from-purple-500 to-pink-600", description: "For Ranking" },
    { icon: Medal, label: "Current Rank", value: dashboardData.rank, gradient: "from-red-500 to-orange-600", description: "Your Level" },
  ]

  return (
    <motion.div 
      className="relative z-10 text-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div 
        className="mb-5 sm:mb-6 md:mb-8"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 leading-tight bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent">
          Welcome Back, Champion! 🎮
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg">Here's your gaming performance overview</p>
      </motion.div>

      {/* Top 3 Legend Banner */}
      {dashboardData.rank === 'Errorless Legend' && dashboardData.leaderboardRank && dashboardData.leaderboardRank <= 3 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <GlassCard variant="intense" className="p-6 border-yellow-500/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 animate-pulse" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-yellow-400 to-orange-600 shadow-lg shadow-yellow-500/30">
                <Trophy className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-200 bg-clip-text text-transparent">
                  Elite Status: Rank #{dashboardData.leaderboardRank}
                </h2>
                <p className="text-yellow-200/80 text-sm">
                  You are eligible for exclusive Top 3 Errorless Legend rewards! Check the Rewards store.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Phase 1: Valorant-Style Rank Card */}
      <div className="mb-8">
        <RankCard
          rank={dashboardData.rank}
          rankIcon={dashboardData.rankIcon}
          currentPoints={dashboardData.experience}
          currentRankPoints={dashboardData.currentRankPoints}
          nextRankPoints={dashboardData.nextRankPoints}
          progressToNextRank={dashboardData.progressToNextRank}
        />
      </div>

      {/* Featured Missions Section */}
      <div className="mb-8">
        <FeaturedMissions />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-5 sm:mb-6 md:mb-8">
        {achievements.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -8 }}
              className="relative group"
            >
              <GlassCard variant="intense" hover className="relative overflow-hidden p-4 sm:p-5 md:p-6">
                {/* Gradient overlay */}
                <div className={`absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${stat.gradient} opacity-20 blur-3xl rounded-full group-hover:opacity-30 transition-opacity`} />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                  </div>
                  
                  <h3 className="text-xs sm:text-sm font-medium text-gray-400 mb-1.5 sm:mb-2">{stat.label}</h3>
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                    {typeof stat.value === 'number' ? (
                      <SimpleCounter value={stat.value} />
                    ) : (
                      stat.value
                    )}
                  </div>
                  {stat.description && (
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>

      {/* Ways to Earn Points */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <GlassCard variant="intense" className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Ways to Earn ZE Points</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { action: "Win Tournaments", points: "+100", icon: Trophy, color: "text-yellow-400" },
              { action: "Runner-up in Tournaments", points: "+50", icon: Medal, color: "text-gray-400" },
              { action: "Refer a New Member", points: "+30", icon: User, color: "text-blue-400" }, // Need User icon import
              { action: "Attend Game Night", points: "+15", icon: Monitor, color: "text-purple-400" }, // Need Monitor icon
              { action: "Join Discord Events", points: "+10", icon: MessageCircle, color: "text-indigo-400" }, // Need MessageCircle
              { action: "Participate in Tournaments", points: "+10", icon: Crosshair, color: "text-red-400" }, // Need Crosshair
              { action: "Content Contests", points: "+10", icon: Video, color: "text-pink-400" }, // Need Video
              { action: "Attend Webinars", points: "+10", icon: BookOpen, color: "text-cyan-400" }, // Need BookOpen
              { action: "Share Memes/Reels", points: "+10", icon: Share2, color: "text-orange-400" }, // Need Share2
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5">
                <div className="flex items-center gap-3">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-sm text-gray-300">{item.action}</span>
                </div>
                <Badge variant="secondary" className="bg-green-500/10 text-green-400 border-green-500/20 font-bold">
                  {item.points}
                </Badge>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Progress Section */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 md:gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        {/* Rank Progress */}
        <GlassCard variant="intense" gradient="red" className="p-4 sm:p-5 md:p-6">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-600">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-white">Progress to Next Rank</h2>
          </div>
          
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="text-gray-400">Current: {dashboardData.rank}</span>
              <span className="text-red-400 font-semibold">{dashboardData.progress}%</span>
            </div>
            
            <div className="relative">
              <Progress 
                value={dashboardData.progress} 
                className="h-3 sm:h-4 bg-black/50"
              />
              <motion.div
                className="absolute inset-0 h-4 rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-red-600 opacity-50 blur-sm"
                initial={{ width: "0%" }}
                animate={{ width: `${dashboardData.progress}%` }}
                transition={{ duration: 1.5, delay: 0.8 }}
              />
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Keep completing missions to level up! 🚀
            </p>
          </div>
        </GlassCard>

        {/* Quick Stats */}
        <GlassCard variant="intense" gradient="purple" className="p-4 sm:p-5 md:p-6">
          <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4 md:mb-5">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-bold text-white">Your Progress</h2>
          </div>
          
          <div className="space-y-2.5 sm:space-y-3 md:space-y-4">
            <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-black/40 hover:bg-black/60 transition-colors">
              <div className="p-1.5 sm:p-2 rounded-full bg-green-500/20 shrink-0">
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">Mission Completed</p>
                <p className="text-xs text-gray-400">+50 points earned</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-black/40 hover:bg-black/60 transition-colors">
              <div className="p-2 rounded-full bg-red-500/20">
                <Award className="h-4 w-4 text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white font-medium">Rank Updated</p>
                <p className="text-xs text-gray-400">You're climbing!</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-black/40 hover:bg-black/60 transition-colors">
              <div className="p-2 rounded-full bg-yellow-500/20">
                <Star className="h-4 w-4 text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white font-medium">New Rewards Available</p>
                <p className="text-xs text-gray-400">Check rewards tab</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}

export default Dashboard