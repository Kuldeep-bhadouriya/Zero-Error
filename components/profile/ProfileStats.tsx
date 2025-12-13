'use client'

import { Trophy, Target, Gift, TrendingUp } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { motion } from 'framer-motion'

interface ProfileStatsProps {
  stats: {
    completedMissions: number
    pendingMissions: number
    totalPoints: number
    leaderboardPosition: number
  }
}

export function ProfileStats({ stats }: ProfileStatsProps) {
  const statItems = [
    {
      icon: Trophy,
      label: 'Leaderboard Rank',
      value: `#${stats.leaderboardPosition}`,
      color: 'text-yellow-400',
      bgGradient: 'from-yellow-500/10 to-yellow-600/5',
      borderColor: 'border-yellow-500/30',
      iconBg: 'bg-yellow-500/10',
    },
    {
      icon: Target,
      label: 'Completed Missions',
      value: stats.completedMissions,
      color: 'text-emerald-400',
      bgGradient: 'from-emerald-500/10 to-emerald-600/5',
      borderColor: 'border-emerald-500/30',
      iconBg: 'bg-emerald-500/10',
    },
    {
      icon: TrendingUp,
      label: 'Pending Missions',
      value: stats.pendingMissions,
      color: 'text-blue-400',
      bgGradient: 'from-red-500/10 to-red-600/5',
      borderColor: 'border-blue-500/30',
      iconBg: 'bg-blue-500/10',
    },
    {
      icon: Gift,
      label: 'Total Points',
      value: stats.totalPoints.toLocaleString(),
      color: 'text-red-400',
      bgGradient: 'from-red-500/10 to-red-600/5',
      borderColor: 'border-red-500/30',
      iconBg: 'bg-red-500/10',
    },
  ]

  return (
    <GlassCard variant="intense" className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Performance Statistics</h2>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">Your ZE Club achievements and progress</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              className={`bg-gradient-to-br ${item.bgGradient} rounded-lg sm:rounded-xl p-3 sm:p-5 border ${item.borderColor} hover:border-opacity-50 transition-all duration-300`}
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className={`${item.iconBg} p-2 sm:p-3 rounded-lg`}>
                  <item.icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${item.color}`} />
                </div>
              </div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">{item.value}</div>
              <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold line-clamp-1">{item.label}</div>
            </motion.div>
          ))}
        </div>
    </GlassCard>
  )
}
