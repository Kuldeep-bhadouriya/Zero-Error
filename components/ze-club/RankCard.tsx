"use client"

import { motion } from "framer-motion"
import { GlassCard } from "@/components/ui/GlassCard"
import RankBadge from "./RankBadge"
import RankProgressBar from "./RankProgressBar"
import { Trophy, TrendingUp, Award } from "lucide-react"

interface RankCardProps {
  rank: string
  rankIcon: string
  currentPoints: number
  currentRankPoints: number
  nextRankPoints: number
  progressToNextRank: number
}

/**
 * RankCard Component
 * Combined card displaying rank badge and progress bar
 * Features responsive design, animations, and rank-specific styling
 */
function RankCard({
  rank,
  rankIcon,
  currentPoints,
  currentRankPoints,
  nextRankPoints,
  progressToNextRank
}: RankCardProps) {
  // Calculate next rank
  const rankOrder = ["Rookie", "Contender", "Gladiator", "Vanguard", "Errorless Legend"]
  const currentRankIndex = rankOrder.indexOf(rank)
  const nextRank = currentRankIndex < rankOrder.length - 1 
    ? rankOrder[currentRankIndex + 1] 
    : "Errorless Legend"

  const getRankGradient = (rank: string) => {
    const gradients = {
      Rookie: "from-red-900/20 to-red-950/20",
      Contender: "from-red-800/20 to-red-900/20",
      Gladiator: "from-red-700/20 to-orange-800/20",
      Vanguard: "from-red-600/20 to-red-700/20",
      "Errorless Legend": "from-red-600/20 to-yellow-600/20",
    }
    return gradients[rank as keyof typeof gradients] || gradients.Rookie
  }

  const getRankBorder = (rank: string) => {
    const borders = {
      Rookie: "border-red-800/30",
      Contender: "border-red-700/40",
      Gladiator: "border-red-600/50",
      Vanguard: "border-red-500/60",
      "Errorless Legend": "border-yellow-500/70",
    }
    return borders[rank as keyof typeof borders] || borders.Rookie
  }

  const getRankAccent = (rank: string) => {
    const accents = {
      Rookie: "#DC2626",
      Contender: "#EF4444",
      Gladiator: "#F97316",
      Vanguard: "#FB923C",
      "Errorless Legend": "#EAB308",
    }
    return accents[rank as keyof typeof accents] || accents.Rookie
  }

  const isMaxRank = rank === "Errorless Legend" && progressToNextRank === 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GlassCard 
        variant="intense" 
        gradient="red" 
        className={`relative overflow-hidden ${getRankBorder(rank)} border-2`}
      >
        {/* Animated background gradient */}
        <motion.div
          className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${getRankGradient(rank)} blur-3xl opacity-40`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Content */}
        <div className="relative z-10 p-6 md:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <motion.h2 
                className="text-2xl md:text-3xl font-bold text-white mb-1 flex items-center gap-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Trophy className="h-7 w-7 text-yellow-500" />
                Your Rank
              </motion.h2>
              <motion.p 
                className="text-gray-400 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {isMaxRank 
                  ? "🏆 Maximum rank achieved!" 
                  : `Keep grinding to reach ${nextRank}!`
                }
              </motion.p>
            </div>

            {/* Quick stats indicator */}
            <motion.div
              className="flex items-center gap-1 bg-black/60 px-3 py-1.5 rounded-full border border-white/10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-xs font-semibold text-white">{currentPoints} pts</span>
            </motion.div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Rank Badge - Takes 1 column */}
            <motion.div
              className="flex justify-center md:justify-start"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              <RankBadge 
                rank={rank} 
                rankIcon={rankIcon} 
                size="lg" 
                showLabel={true}
                animated={true}
              />
            </motion.div>

            {/* Progress Bar - Takes 2 columns */}
            <motion.div
              className="md:col-span-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <RankProgressBar
                currentPoints={currentPoints}
                currentRankPoints={currentRankPoints}
                nextRankPoints={nextRankPoints}
                progressToNextRank={progressToNextRank}
                currentRank={rank}
                nextRank={nextRank}
              />
            </motion.div>
          </div>

          {/* Rank Benefits/Info Section */}
          <motion.div
            className="mt-6 pt-6 border-t border-gray-700/50"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-5 w-5 text-purple-400" />
              <h3 className="text-sm font-semibold text-white">Rank Benefits</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {getRankBenefits(rank).map((benefit, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-2 text-xs text-gray-400 bg-black/40 p-2 rounded-lg"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                >
                  <span 
                    className="text-base mt-0.5" 
                    style={{ color: getRankAccent(rank) }}
                  >
                    {benefit.icon}
                  </span>
                  <span>{benefit.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </GlassCard>
    </motion.div>
  )
}

/**
 * Helper function to get rank-specific benefits
 */
function getRankBenefits(rank: string) {
  const benefits = {
    Rookie: [
      { icon: "🎮", text: "Access to basic missions" },
      { icon: "🏆", text: "Community member badge" },
    ],
    Contender: [
      { icon: "⭐", text: "Exclusive Contender missions" },
      { icon: "💬", text: "Priority support access" },
    ],
    Gladiator: [
      { icon: "🎁", text: "Monthly reward drops" },
      { icon: "🔥", text: "Higher point multipliers" },
    ],
    Vanguard: [
      { icon: "👑", text: "VIP mission access" },
      { icon: "🎯", text: "Early event registration" },
    ],
    "Errorless Legend": [
      { icon: "🏅", text: "Ultimate prestige status" },
      { icon: "✨", text: "Exclusive Legend perks" },
    ],
  }
  return benefits[rank as keyof typeof benefits] || benefits.Rookie
}

export default RankCard
