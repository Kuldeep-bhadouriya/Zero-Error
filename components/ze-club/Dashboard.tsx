"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { AlertTriangle, CheckCircle2, Link2, ShieldCheck, Zap, Loader2, ExternalLink } from "lucide-react"
import ZEClubMagicBento from "./ZEClubMagicBento"
import { deriveDiscordSyncUiState, type DiscordSyncDashboardPayload } from "@/lib/ze-club/discordSyncUi"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

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
  discord?: DiscordSyncDashboardPayload
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
  const [isLinking, setIsLinking] = useState(false)

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

  async function handleStartDiscordLink() {
    setIsLinking(true)
    try {
      const response = await fetch('/api/user/discord/link/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ redirectTo: '/ze-club' }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to start Discord verification')
      }

      const authorizationUrl = payload?.authorizationUrl as string | undefined
      if (!authorizationUrl) {
        throw new Error('Missing Discord authorization URL')
      }

      window.location.assign(authorizationUrl)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start Discord verification'
      toast.error(message)
      setIsLinking(false)
    }
  }

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

  const isVerified = dashboardData.discord?.eligibleForRoleSync

  return (
    <div className="space-y-6 sm:space-y-8 pb-6 sm:pb-10">
      {/* Verification Banner */}
      {!isVerified && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 sm:p-5"
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-sm sm:text-base font-bold text-amber-100">Verify your Identity</h3>
              <p className="text-xs sm:text-sm text-amber-200/70 mt-0.5">Link your Discord ID to sync your ZE Club rank and unlock exclusive community roles.</p>
            </div>
            <Button 
              onClick={handleStartDiscordLink}
              disabled={isLinking}
              size="sm"
              className="bg-amber-600 hover:bg-amber-500 text-white border-amber-400/30 shadow-lg shadow-amber-900/20 whitespace-nowrap"
            >
              {isLinking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ExternalLink className="w-4 h-4 mr-2" />}
              {dashboardData.discord?.linked ? 'Complete Verification' : 'Verify ID Now'}
            </Button>
          </div>
        </motion.div>
      )}

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
          </div>
        </motion.div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-zinc-700/40 bg-gradient-to-br from-zinc-900/70 via-zinc-900/55 to-zinc-800/50 p-4 sm:p-6"
      >
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-white">Discord Sync Status</h2>
            <p className="text-xs sm:text-sm text-zinc-400">Keep your ZE Club rank mirrored to Discord roles.</p>
          </div>
          <div className="flex items-center gap-2">
            {dashboardData.discord?.eligibleForRoleSync ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Eligible
              </span>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" /> Action needed
                </span>
                <Button 
                  onClick={handleStartDiscordLink}
                  disabled={isLinking}
                  variant="outline"
                  size="sm"
                  className="h-7 px-3 text-[10px] bg-zinc-800/50 border-zinc-700 text-zinc-300 hover:text-white"
                >
                  {isLinking ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : null}
                  Verify
                </Button>
              </>
            )}
          </div>
        </div>

        {(() => {
          const discordState = deriveDiscordSyncUiState(dashboardData.discord)
          return (
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-zinc-700/40 bg-zinc-900/45 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <Link2 className="h-4 w-4 text-red-400" /> Link Status
                </div>
                <p className="text-base font-semibold text-white">{discordState.linkLabel}</p>
              </div>

              <div className="rounded-xl border border-zinc-700/40 bg-zinc-900/45 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                  <ShieldCheck className="h-4 w-4 text-red-400" /> Verification
                </div>
                <p className="text-base font-semibold text-white">{discordState.verifiedLabel}</p>
              </div>

              <div className="rounded-xl border border-zinc-700/40 bg-zinc-900/45 p-4">
                <div className="mb-2 text-sm font-medium text-zinc-300">Last Sync</div>
                <p className="text-sm text-zinc-100">{discordState.lastSyncText}</p>
              </div>

              <div
                className={`rounded-xl border p-4 ${
                  discordState.showError
                    ? 'border-red-500/35 bg-red-500/10'
                    : 'border-zinc-700/40 bg-zinc-900/45'
                }`}
              >
                <div className="mb-2 text-sm font-medium text-zinc-300">Last Error</div>
                <p className={`text-sm ${discordState.showError ? 'text-red-200' : 'text-zinc-100'}`}>
                  {discordState.lastErrorText}
                </p>
              </div>
            </div>
          )
        })()}
      </motion.section>

      <ZEClubMagicBento dashboardData={dashboardData} />
    </div>
  )
}

export default Dashboard