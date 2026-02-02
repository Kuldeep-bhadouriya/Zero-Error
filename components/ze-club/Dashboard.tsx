"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { 
  Star, Zap, Target, Trophy, Coins, 
  User, MessageCircle, Share2, 
  Gamepad2, Rocket
} from "lucide-react"
import { GlassCard } from "@/components/ui/GlassCard"
import RankCard from "./RankCard"
import FeaturedMissions from "./FeaturedMissions"

interface UserDashboard {
  totalPoints: number
  zeCoins: number
  experience: number
  rank: string
  leaderboardRank?: number
  badge: string
  progress: number
  rankIcon: string
  progressToNextRank: number
  nextRankPoints: number
  currentRankPoints: number
}

function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startValue = 0
    const duration = 2000
    const startTime = Date.now()

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 4) // Quartic ease-out

      startValue = Math.floor(easedProgress * value)
      setCount(startValue)

      if (progress === 1) clearInterval(timer)
    }, 16)

    return () => clearInterval(timer)
  }, [value])

  return <span>{count.toLocaleString()}</span>
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  color = "blue",
  delay = 0 
}: { 
  icon: any, 
  label: string, 
  value: string | number, 
  subValue?: string,
  color?: "blue" | "purple" | "yellow" | "red" | "green",
  delay?: number 
}) {
  const colorMap = {
    blue: "text-blue-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]",
    purple: "text-purple-500 drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]",
    yellow: "text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]",
    red: "text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]",
    green: "text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]"
  }

  const gradientMap = {
    blue: "from-blue-500/20 to-cyan-500/20",
    purple: "from-purple-500/20 to-pink-500/20",
    yellow: "from-yellow-400/20 to-orange-500/20",
    red: "from-red-500/20 to-rose-600/20",
    green: "from-emerald-400/20 to-teal-500/20"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5 }}
      className="h-full"
    >
      <GlassCard className="relative overflow-hidden p-4 sm:p-5 md:p-6 h-full group border-l-4" style={{ borderColor: `${colorMap[color].split(' ')[0].replace('text-', '')}` }}>
        <div className={`absolute right-0 top-0 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br ${gradientMap[color]} blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-all duration-500`} />
        
        <div className="flex flex-col h-full justify-between relative z-10">
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className={`p-0`}>
              <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${colorMap[color]}`} strokeWidth={1.5} />
            </div>
            {subValue && (
              <Badge variant="outline" className="bg-white/5 text-[9px] sm:text-[10px] font-medium border-white/10 text-gray-400 tracking-wider px-2 py-0.5">
                {subValue}
              </Badge>
            )}
          </div>
          
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-400 mb-1 uppercase tracking-wide">{label}</p>
            <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
            </h3>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-12 h-12 rounded-full border-2 border-red-500 border-t-transparent" />
        </motion.div>
        <p className="text-gray-400 animate-pulse">Syncing your stats...</p>
      </div>
    )
  }

  if (error || !dashboardData) {
    return (
      <div className="p-8 text-center text-red-400 bg-red-500/10 rounded-2xl border border-red-500/20">
        <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">Failed to load dashboard</h3>
        <p className="text-sm opacity-70">{error || "No data available"}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-10">
      {/* Header Section */}
      <div className="relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2 sm:gap-3"
        >
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              Welcome back, <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">Champion</span>
            </h1>
            <p className="text-gray-400 mt-1.5 sm:mt-2 text-base sm:text-lg">Your gaming journey continues here.</p>
          </div>
        </motion.div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard 
          icon={Trophy} 
          label="Current Rank" 
          value={dashboardData.rank}
          color="yellow"
          delay={0.1}
        />
        <StatCard 
          icon={Coins} 
          label="ZE Coins" 
          value={dashboardData.zeCoins}
          subValue="Redeemable"
          color="yellow"
          delay={0.2}
        />
        <StatCard 
          icon={Star} 
          label="ZE Points" 
          value={dashboardData.experience}
          subValue="Total Points"
          color="purple"
          delay={0.3}
        />
        <StatCard 
          icon={Target} 
          label="Next Rank" 
          value={`${dashboardData.progress}%`}
          subValue="Progress"
          color="green"
          delay={0.4}
        />
      </div>

      {/* Rank Progress & Featured */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Detailed Rank Card */}
          <RankCard
            rank={dashboardData.rank}
            rankIcon={dashboardData.rankIcon}
            currentPoints={dashboardData.experience}
            currentRankPoints={dashboardData.currentRankPoints}
            nextRankPoints={dashboardData.nextRankPoints}
            progressToNextRank={dashboardData.progressToNextRank}
          />
          
          <FeaturedMissions />
        </div>

        <div className="lg:col-span-1">
          {/* Ways to Earn */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <GlassCard className="p-4 sm:p-5 md:p-6 border-blue-500/10" variant="intense">
              <div className="flex items-center gap-2.5 sm:gap-3 mb-5 sm:mb-6">
                <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/10 text-blue-400 flex-shrink-0">
                  <Rocket className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">Earning Opportunities</h3>
                  <p className="text-[10px] sm:text-xs text-gray-500">Boost your stats</p>
                </div>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                {[
                  { title: "Win Tournament", value: "+100 XP", icon: Trophy, color: "text-amber-400" },
                  { title: "Refer a Friend", value: "+30 XP", icon: User, color: "text-blue-400" },
                  { title: "Game Night", value: "+15 XP", icon: Gamepad2, color: "text-purple-400" },
                  { title: "Discord Event", value: "+10 XP", icon: MessageCircle, color: "text-indigo-400" },
                  { title: "Share Content", value: "+10 XP", icon: Share2, color: "text-pink-400" },
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.03)" }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-white/5 transition-all cursor-pointer group active:scale-95"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-black/40 border border-white/5 shadow-inner flex-shrink-0">
                        <item.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${item.color} group-hover:scale-110 transition-transform`} />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-300 font-medium group-hover:text-white transition-colors truncate">{item.title}</span>
                    </div>
                    <span className="text-[10px] sm:text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded border border-emerald-400/20 shadow-[0_0_10px_rgba(52,211,153,0.1)] whitespace-nowrap ml-2">
                      {item.value}
                    </span>
                  </motion.div>
                ))}
              </div>
              
              <Link href="/ze-club/missions" className="block w-full">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-5 sm:mt-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-xs sm:text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all active:scale-95"
                >
                  View All Opportunities
                </motion.button>
              </Link>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard