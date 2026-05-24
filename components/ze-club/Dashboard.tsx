"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  Activity,
  BarChart3,
  CalendarDays,
  Coins,
  ShieldCheck,
  Target,
  Trophy,
  Zap
} from "lucide-react"
import ZEClubPageHeader from "./ZEClubPageHeader"

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
  season?: {
    seasonNumber?: number
    name?: string
  } | null
}

interface DashboardActivity {
  monthlyXp: number[]
  serviceUsage: Array<{ label: string; value: number }>
  recentOrders: Array<{
    id: string
    label: string
    status: string
    amount: number
    createdAt: string
  }>
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
  const [activityData, setActivityData] = useState<DashboardActivity | null>(null)
  const [activityLoading, setActivityLoading] = useState(true)
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

  useEffect(() => {
    async function fetchActivityData() {
      try {
        const response = await fetch("/api/ze-club/user/activity", { cache: "no-store" })
        if (!response.ok) {
          throw new Error("Failed to fetch activity data")
        }
        const data = await response.json()
        setActivityData(data)
      } catch {
        setActivityData(null)
      } finally {
        setActivityLoading(false)
      }
    }

    fetchActivityData()
  }, [])

  const monthlyXp = activityData?.monthlyXp?.length === 12
    ? activityData.monthlyXp
    : Array.from({ length: 12 }, () => 0)
  const maxMonthlyXp = Math.max(1, ...monthlyXp)
  const chartPoints = useMemo(() => {
    return monthlyXp
      .map((value, index) => {
        const x = (index / (monthlyXp.length - 1)) * 100
        const y = 34 - (value / maxMonthlyXp) * 26
        return `${x},${y}`
      })
      .join(" ")
  }, [monthlyXp, maxMonthlyXp])

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

  const serviceUsage = activityData?.serviceUsage?.length
    ? activityData.serviceUsage
    : [
        { label: "Missions", value: 0 },
        { label: "Submissions", value: 0 },
        { label: "Redemptions", value: 0 },
        { label: "Coins Spent", value: 0 }
      ]
  const maxUsage = Math.max(1, ...serviceUsage.map((entry) => entry.value))
  const recentOrders = activityData?.recentOrders ?? []
  const seasonLabel = dashboardData.season?.seasonNumber
    ? `Season ${dashboardData.season.seasonNumber}`
    : "Season Live"

  return (
    <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <ZEClubPageHeader
          eyebrow="Dashboard Overview"
          title="Welcome back,"
          highlight="Champion"
          subtitle="Track your ZE Club stats, recent activity, and season performance without leaving the arena."
          action={
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-300">
              <CalendarDays className="h-3.5 w-3.5 text-red-300" />
              <span>{seasonLabel}</span>
            </div>
          }
        />
      </motion.div>

      <section className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-0">
            <Image
              src="/images/valo.jpg"
              alt="ZE Club dashboard hero"
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover opacity-70"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-6 p-6 sm:p-8">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-300">ZE Club</p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-white">
                Your competitive edge is rising.
              </h2>
              <p className="mt-2 text-sm text-zinc-300 max-w-lg">
                Complete missions, stack ZE Coins, and keep your rank momentum steady through the season.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-zinc-300">
                <span className="text-zinc-400">Total ZE Points</span>
                <span className="font-semibold text-white">{dashboardData.totalPoints.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur">
                <Image
                  src={dashboardData.rankIcon}
                  alt={`${dashboardData.rank} rank icon`}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-md object-contain"
                />
                <div className="leading-tight">
                  <p className="text-[10px] uppercase tracking-wider text-zinc-300">Current Rank</p>
                  <p className="text-base font-semibold text-white">{dashboardData.rank}</p>
                </div>
              </div>
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-zinc-200">
                <p className="uppercase tracking-wider text-zinc-400">Progress</p>
                <p className="text-base font-semibold text-white">{dashboardData.progressToNextRank}%</p>
              </div>
              <div className="rounded-xl border border-white/15 bg-white/10 px-3.5 py-2.5 text-xs text-zinc-200 backdrop-blur">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Trophy className="h-4 w-4 text-amber-300" />
                  <p className="uppercase tracking-wider text-zinc-400">Leaderboard</p>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-base font-semibold text-white">
                    {dashboardData.leaderboardRank ? `#${dashboardData.leaderboardRank}` : "Unranked"}
                  </p>
                  <Link
                    href="/ze-club/leaderboard"
                    className="text-[10px] uppercase tracking-wider text-amber-200 hover:text-amber-100"
                  >
                    View
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.26em] text-zinc-400">Account Pulse</p>
              <ShieldCheck className="h-4 w-4 text-red-300" />
            </div>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-zinc-200">
                <span className="text-zinc-400">ZE Coins</span>
                <span className="font-semibold text-white">{dashboardData.zeCoins.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-zinc-200">
                <span className="text-zinc-400">Season XP</span>
                <span className="font-semibold text-white">{dashboardData.experience.toLocaleString()}</span>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-zinc-400">
                  <span>Rank Momentum</span>
                  <span>{dashboardData.progressToNextRank}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-black/70">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-500 via-orange-400 to-amber-300"
                    style={{ width: `${Math.min(100, Math.max(0, dashboardData.progressToNextRank))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.26em] text-zinc-400">Quick Actions</p>
              <Activity className="h-4 w-4 text-red-300" />
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              {[
                { label: "Open Missions", icon: Target, href: "/ze-club/missions" },
                { label: "Rewards Store", icon: Coins, href: "/ze-club/rewards" },
                { label: "Leaderboard", icon: Trophy, href: "/ze-club/leaderboard" }
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/[0.08]"
                >
                  <div className="flex items-center gap-2">
                    <action.icon className="h-4 w-4 text-red-300" />
                    <span>{action.label}</span>
                  </div>
                  <span className="text-xs text-zinc-400">Go</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-zinc-400">XP Progress</p>
              <h3 className="text-lg font-semibold text-white">Season Momentum</h3>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs text-zinc-300">
              Monthly
            </span>
          </div>
          <div className="mt-6">
            <svg viewBox="0 0 100 40" className="w-full">
              <defs>
                <linearGradient id="xpLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#f97316" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke="url(#xpLine)"
                strokeWidth="2"
                points={chartPoints}
              />
            </svg>
            <div className="mt-4 grid grid-cols-6 gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              {[
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec"
              ].map((month) => (
                <span key={month} className="text-center">{month}</span>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-zinc-300">
              <span>Peak XP surge</span>
              <span className="text-white">{Math.max(...monthlyXp).toLocaleString()} XP</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-zinc-400">Service Usage</p>
              <h3 className="text-lg font-semibold text-white">Activity Split</h3>
            </div>
            <BarChart3 className="h-4 w-4 text-red-300" />
          </div>
          <div className="mt-6 grid grid-cols-4 gap-3">
            {serviceUsage.map((bar, index) => {
              const color = ["bg-red-500", "bg-orange-400", "bg-amber-400", "bg-rose-400"][index % 4]
              const height = Math.round((bar.value / maxUsage) * 100)

              return (
              <div key={bar.label} className="flex flex-col items-center gap-3">
                <div className="relative h-28 w-full overflow-hidden rounded-full bg-black/70">
                  <div
                    className={`absolute inset-x-0 bottom-0 rounded-full ${color}`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">{bar.label}</span>
                <span className="text-[10px] text-zinc-500">{bar.value}</span>
              </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/40 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-zinc-400">Recent Orders</p>
            <h3 className="text-lg font-semibold text-white">Latest ZE Club Activity</h3>
          </div>
          <Link
            href="/ze-club/rewards"
            className="rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-zinc-200"
          >
            View all orders
          </Link>
        </div>
        <div className="mt-5 overflow-x-auto rounded-xl border border-white/10">
          <div className="min-w-[520px]">
            <div className="grid grid-cols-5 gap-3 bg-black/50 px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-zinc-400">
            <span>Order ID</span>
            <span>Service</span>
            <span>Date</span>
            <span>Status</span>
            <span className="text-right">Amount</span>
          </div>
            {activityLoading ? (
              <div className="px-4 py-6 text-sm text-zinc-400">Loading recent activity...</div>
            ) : recentOrders.length === 0 ? (
              <div className="px-4 py-6 text-sm text-zinc-400">No recent orders yet.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentOrders.map((row) => (
                  <div key={row.id} className="grid grid-cols-5 gap-3 px-4 py-3 text-sm text-zinc-200">
                    <span className="text-zinc-400">#{row.id.slice(-6).toUpperCase()}</span>
                    <span>{row.label}</span>
                    <span className="text-zinc-400">
                      {new Date(row.createdAt).toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "2-digit"
                      })}
                    </span>
                    <span className={row.status === "completed" ? "text-rose-300" : "text-amber-300"}>
                      {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                    </span>
                    <span className="text-right text-white">-{row.amount.toLocaleString()} ZE</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Dashboard