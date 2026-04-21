"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Zap } from "lucide-react"
import ZEClubMagicBento from "./ZEClubMagicBento"

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
            <p className="text-gray-400 mt-1.5 sm:mt-2 text-base sm:text-lg">Ready for your next challenge? Track progress, complete missions, and rise through the ZE Club ranks.</p>
            <div className="mt-4 inline-flex items-center gap-3 rounded-xl border border-red-400/30 bg-white/[0.05] px-3.5 py-2.5 backdrop-blur-sm">
              <Image
                src={dashboardData.rankIcon}
                alt={`${dashboardData.rank} rank icon`}
                width={36}
                height={36}
                className="h-9 w-9 rounded-md object-contain"
              />
              <div className="leading-tight">
                <p className="text-xs uppercase tracking-wider text-zinc-300">Current Rank</p>
                <p className="text-base sm:text-lg font-semibold text-white">{dashboardData.rank}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <ZEClubMagicBento dashboardData={dashboardData} />
    </div>
  )
}

export default Dashboard