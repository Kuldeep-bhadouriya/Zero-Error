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
      bgGradient: 'from-yellow-500/5 to-yellow-600/5',
      borderColor: 'border-yellow-500/20',
      iconBg: 'bg-yellow-500/10',
    },
    {
      icon: Target,
      label: 'Completed',
      value: stats.completedMissions,
      color: 'text-emerald-400',
      bgGradient: 'from-emerald-500/5 to-emerald-600/5',
      borderColor: 'border-emerald-500/20',
      iconBg: 'bg-emerald-500/10',
    },
    {
      icon: TrendingUp,
      label: 'Pending',
      value: stats.pendingMissions,
      color: 'text-blue-400',
      bgGradient: 'from-blue-500/5 to-blue-600/5',
      borderColor: 'border-blue-500/20',
      iconBg: 'bg-blue-500/10',
    },
    {
      icon: Gift,
      label: 'Total Points',
      value: stats.totalPoints.toLocaleString(),
      color: 'text-purple-400',
      bgGradient: 'from-purple-500/5 to-purple-600/5',
      borderColor: 'border-purple-500/20',
      iconBg: 'bg-purple-500/10',
    },
  ]

  return (
    <GlassCard variant="subtle" className="p-4 sm:p-6">
      <div className="mb-4 sm:mb-5">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Performance</h2>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">Your achievements and progress</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statItems.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ scale: 1.03, y: -4 }}
              className={`bg-gradient-to-br ${item.bgGradient} rounded-xl p-4 sm:p-5 border ${item.borderColor} hover:border-opacity-70 transition-all duration-300 backdrop-blur-sm`}
            >
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className={`${item.iconBg} p-2 sm:p-2.5 rounded-lg`}>
                  <item.icon className={`w-4 h-4 sm:w-6 sm:h-6 ${item.color}`} />
                </div>
              </div>
              <div className="text-xl sm:text-3xl font-bold text-white mb-1">{item.value}</div>
              <div className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wider font-medium">{item.label}</div>
            </motion.div>
          ))}
        </div>
    </GlassCard>
  )
}
