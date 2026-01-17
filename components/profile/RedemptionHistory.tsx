'use client'

import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Package, Clock, CheckCircle, XCircle, Loader2, Gift } from 'lucide-react'
import { toast } from 'sonner'

interface Redemption {
  _id: string
  rewardName: string
  rewardCost: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  contactName: string
  contactEmail: string
  contactPhone: string
  address: string
  additionalNotes?: string
  adminNotes?: string
  createdAt: string
  processedAt?: string
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    description: 'Your request is waiting for review'
  },
  processing: {
    icon: Package,
    label: 'Processing',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
    description: 'Your reward is being prepared'
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    description: 'Your reward has been delivered'
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    description: 'This request was cancelled'
  }
}

export function RedemptionHistory() {
  const [redemptions, setRedemptions] = useState<Redemption[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRedemptions()
    
    // Scroll to redemptions section if hash is present
    if (window.location.hash === '#redemptions') {
      setTimeout(() => {
        const element = document.getElementById('redemptions')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }, [])

  async function fetchRedemptions() {
    try {
      const response = await fetch('/api/ze-club/user-redemptions')
      if (!response.ok) throw new Error('Failed to fetch redemptions')
      
      const data = await response.json()
      setRedemptions(data)
    } catch (error) {
      console.error('Error fetching redemptions:', error)
      toast.error('Failed to load redemption history')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <GlassCard variant="intense" gradient="purple" className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard variant="intense" gradient="purple" className="p-4 sm:p-6" id="redemptions">
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-purple-500/10 p-1.5 sm:p-2 rounded-lg">
            <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">Redemption History</h2>
            <p className="text-gray-400 text-xs sm:text-sm mt-1">
              Track your reward redemption requests and their status
            </p>
          </div>
        </div>
      </div>

      {redemptions.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-purple-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No Redemptions Yet</h3>
          <p className="text-gray-400 text-sm">
            Visit the <a href="/ze-club/rewards" className="text-purple-400 hover:text-purple-300 underline">Rewards</a> page to claim your first reward!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {redemptions.map((redemption) => {
            const config = statusConfig[redemption.status]
            const Icon = config.icon
            
            return (
              <div
                key={redemption._id}
                className={`border ${config.borderColor} ${config.bgColor} rounded-lg p-3 sm:p-4 transition-all hover:scale-[1.01]`}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 mb-3">
                  <div className="flex-1 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                      <h3 className="text-base sm:text-lg font-bold text-white">{redemption.rewardName}</h3>
                      <span className="text-yellow-400 text-xs sm:text-sm font-semibold">
                        {redemption.rewardCost} ZE Coins
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Requested on {new Date(redemption.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bgColor} border ${config.borderColor} self-start`}>
                    <Icon className={`w-3 h-3 sm:w-4 sm:h-4 ${config.color}`} />
                    <span className={`text-xs sm:text-sm font-semibold ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                </div>

                <p className={`text-xs sm:text-sm ${config.color} mb-3`}>
                  {config.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="truncate">
                    <span className="text-gray-400">Contact:</span>
                    <span className="text-white ml-2">{redemption.contactName}</span>
                  </div>
                  <div className="truncate">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white ml-2 break-all">{redemption.contactEmail}</span>
                  </div>
                  <div className="truncate">
                    <span className="text-gray-400">Phone:</span>
                    <span className="text-white ml-2">{redemption.contactPhone}</span>
                  </div>
                  {redemption.processedAt && (
                    <div className="truncate">
                      <span className="text-gray-400">Processed:</span>
                      <span className="text-white ml-2">
                        {new Date(redemption.processedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {redemption.address && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <span className="text-gray-400 text-xs sm:text-sm">Delivery Address:</span>
                    <p className="text-white text-xs sm:text-sm mt-1 break-words">{redemption.address}</p>
                  </div>
                )}

                {redemption.additionalNotes && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <span className="text-gray-400 text-xs sm:text-sm">Your Notes:</span>
                    <p className="text-white text-xs sm:text-sm mt-1 break-words">{redemption.additionalNotes}</p>
                  </div>
                )}

                {redemption.adminNotes && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <span className="text-gray-400 text-xs sm:text-sm">Admin Notes:</span>
                    <p className="text-white text-xs sm:text-sm mt-1 break-words">{redemption.adminNotes}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}
