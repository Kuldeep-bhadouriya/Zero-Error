"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Zap } from "lucide-react"

interface RankProgressBarProps {
  currentPoints: number
  currentRankPoints: number
  nextRankPoints: number
  progressToNextRank: number
  currentRank: string
  nextRank?: string
}

/**
 * RankProgressBar Component
 * Animated progress bar showing progress to next rank
 * Features smooth fill animations, tooltips, and responsive design
 */
function RankProgressBar({
  currentPoints,
  currentRankPoints,
  nextRankPoints,
  progressToNextRank,
  currentRank,
  nextRank
}: RankProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  useEffect(() => {
    // Animate progress from 0 to actual value
    const timer = setTimeout(() => {
      setDisplayProgress(progressToNextRank)
    }, 300)
    return () => clearTimeout(timer)
  }, [progressToNextRank])

  const pointsEarned = currentPoints - currentRankPoints
  const pointsNeeded = nextRankPoints - currentRankPoints
  const pointsRemaining = nextRankPoints - currentPoints

  const getRankColor = (rank: string) => {
    const colors = {
      Rookie: { from: "#DC2626", to: "#991B1B" },
      Contender: { from: "#EF4444", to: "#DC2626" },
      Gladiator: { from: "#F97316", to: "#EA580C" },
      Vanguard: { from: "#FB923C", to: "#F97316" },
      "Errorless Legend": { from: "#EAB308", to: "#F59E0B" },
    }
    return colors[rank as keyof typeof colors] || colors.Rookie
  }

  const color = getRankColor(currentRank)
  const isMaxRank = progressToNextRank === 100 && currentRank === "Errorless Legend"

  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Progress to {nextRank || "Max Rank"}</span>
          {!isMaxRank && (
            <Zap className="h-4 w-4 text-yellow-500" />
          )}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className="font-bold text-white cursor-help">
                {displayProgress}%
              </span>
            </TooltipTrigger>
            <TooltipContent className="bg-black/90 border-white/10">
              <div className="space-y-1 text-xs">
                <p><span className="text-gray-400">Current:</span> {currentPoints} points</p>
                <p><span className="text-gray-400">Progress:</span> {pointsEarned} / {pointsNeeded} points</p>
                {!isMaxRank && (
                  <p><span className="text-yellow-400">Need:</span> {pointsRemaining} more points</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Progress Bar Container */}
      <div className="relative h-6 bg-black/60 rounded-full overflow-hidden border border-white/10 shadow-inner">
        {/* Background shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
          animate={{
            x: [-200, 400],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Progress Fill */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
          initial={{ width: "0%" }}
          animate={{ width: `${displayProgress}%` }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
            delay: 0.2
          }}
        >
          {/* Gradient fill */}
          <div 
            className="h-full"
            style={{
              background: `linear-gradient(90deg, ${color.from}, ${color.to})`
            }}
          />

          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 opacity-50 blur-sm"
            style={{
              background: `linear-gradient(90deg, ${color.from}, ${color.to})`
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Animated shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ["-100%", "200%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />
        </motion.div>

        {/* Progress indicator dot */}
        {displayProgress > 0 && displayProgress < 100 && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2"
            initial={{ left: "0%" }}
            animate={{ left: `${displayProgress}%` }}
            transition={{
              duration: 1.5,
              ease: "easeOut",
              delay: 0.2
            }}
          >
            <motion.div
              className="w-3 h-3 rounded-full bg-white shadow-lg -ml-1.5"
              animate={{
                scale: [1, 1.3, 1],
                boxShadow: [
                  `0 0 0 0 ${color.to}80`,
                  `0 0 0 8px ${color.to}00`,
                  `0 0 0 0 ${color.to}80`
                ]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>
        )}
      </div>

      {/* Points Info */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          {currentRankPoints} pts
        </span>
        {!isMaxRank ? (
          <span className="text-gray-500">
            {nextRankPoints} pts
          </span>
        ) : (
          <span className="text-yellow-400 font-semibold flex items-center gap-1">
            <span>🏆</span> Max Rank!
          </span>
        )}
      </div>

      {/* Motivational message */}
      {!isMaxRank && (
        <motion.p
          className="text-xs text-center text-gray-400 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {pointsRemaining <= 100 
            ? "🔥 So close! Keep pushing!" 
            : `${pointsRemaining} points to ${nextRank}! You got this! 💪`
          }
        </motion.p>
      )}
    </div>
  )
}

export default RankProgressBar
