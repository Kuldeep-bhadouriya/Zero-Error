'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Gift, Coins, ShoppingBag, Star, Sparkles, TrendingUp, Package, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RedemptionDialog } from './RedemptionDialog';

interface Reward {
  _id: string;
  name: string;
  description: string;
  cost: number;
  stock: number;
}

export default function Rewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCoins, setUserCoins] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch rewards and user points in parallel
        const [rewardsResponse, dashboardResponse] = await Promise.all([
          fetch('/api/ze-club/rewards'),
          fetch('/api/ze-club/user/dashboard')
        ]);

        if (!rewardsResponse.ok) {
          throw new Error('Failed to fetch rewards');
        }
        const rewardsData = await rewardsResponse.json();
        setRewards(rewardsData);

        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          // Use zeCoins if it exists (even if 0), fallback to totalPoints, default to 0
          const coins = dashboardData.zeCoins !== undefined ? dashboardData.zeCoins : (dashboardData.totalPoints || 0);
          console.log('💰 User ZE Coins loaded:', coins); // Debug log
          setUserCoins(coins);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  async function handleRedeem(rewardId: string, cost: number) {
    console.log('🎁 Attempting redemption - User Coins:', userCoins, 'Required:', cost); // Debug log
    
    if (userCoins < cost) {
      toast({
        title: 'Insufficient ZE Coins 💰',
        description: `You need ${cost - userCoins} more ZE Coins to redeem this reward. Complete missions to earn more coins!`,
        variant: 'destructive',
      });
      return;
    }

    // Find the reward and open dialog
    const reward = rewards.find(r => r._id === rewardId);
    if (reward) {
      setSelectedReward(reward);
      setDialogOpen(true);
    }
  }

  function handleRedemptionSuccess() {
    // Refresh data after successful redemption
    async function refreshData() {
      try {
        const [rewardsResponse, dashboardResponse] = await Promise.all([
          fetch('/api/ze-club/rewards'),
          fetch('/api/ze-club/user/dashboard')
        ]);

        if (rewardsResponse.ok) {
          const rewardsData = await rewardsResponse.json();
          setRewards(rewardsData);
        }

        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
          // Use zeCoins if it exists (even if 0), fallback to totalPoints, default to 0
          const coins = dashboardData.zeCoins !== undefined ? dashboardData.zeCoins : (dashboardData.totalPoints || 0);
          setUserCoins(coins);
        }
      } catch (err) {
        console.error('Error refreshing data:', err);
      }
    }
    refreshData();
  }

  if (loading) {
    return (
      <motion.div 
        className="relative z-10 text-white flex items-center justify-center h-64"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-6 w-6 text-red-500 animate-pulse" />
          <p className="text-xl">Loading rewards...</p>
        </div>
      </motion.div>
    );
  }
  
  if (error) {
    return (
      <motion.div 
        className="relative z-10 text-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <GlassCard variant="intense" gradient="red" className="p-6">
          <p className="text-xl text-red-400">Error: {error}</p>
        </GlassCard>
      </motion.div>
    );
  }

  const rewardIcons = [Gift, Star, Sparkles, Package, TrendingUp];

  return (
    <motion.div 
      className="relative z-10 text-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="mb-5 sm:mb-6 md:mb-8">
        <motion.h1 
          className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 leading-tight bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 bg-clip-text text-transparent"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          🎁 Rewards Store
        </motion.h1>
        <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg">Redeem your ZE Coins for exclusive rewards</p>
      </div>

      {/* User ZE Coins Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-4 sm:mb-6"
      >
        <GlassCard variant="intense" gradient="purple" className="pt-4 sm:pt-5 md:pt-6 px-3 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="p-2.5 sm:p-3 rounded-full bg-gradient-to-br from-purple-500 to-pink-600">
                  <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-400">Your ZE Coins</p>
                  <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    {userCoins} Coins
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">💡 Rank protected!</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs text-gray-500">Available Rewards</p>
                <p className="text-xl sm:text-2xl font-bold text-white">{rewards.length}</p>
              </div>
            </div>
          </GlassCard>
      </motion.div>

      {/* Low Coins Warning */}
      {userCoins === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-4 sm:mb-6"
        >
          <GlassCard variant="intense" gradient="blue" className="p-4 sm:p-5 md:p-6 border-blue-500/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Target className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Need ZE Coins?</h3>
                <p className="text-sm text-gray-300">
                  You currently have 0 ZE Coins. Complete missions to earn coins and unlock these awesome rewards! 
                  Head to the <a href="/ze-club/missions" className="text-blue-400 hover:text-blue-300 underline">Missions</a> page to get started.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {/* Rewards Grid */}
      {rewards.length === 0 ? (
        <motion.div 
          className="text-center py-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-xl text-gray-400">No rewards available at the moment.</p>
          <p className="text-sm text-gray-500 mt-2">Check back soon for new rewards!</p>
        </motion.div>
      ) : (
        <>
          {/* Errorless Legend Exclusive Section */}
          {rewards.some(r => r.name.includes('Prize')) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-8"
            >
              <div className="mb-5 sm:mb-6 text-center">
                <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-red-600/20 to-orange-600/20 px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-red-500/30 mb-2 sm:mb-3">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                    EXCLUSIVE
                  </h2>
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1 sm:mb-2">Errorless Legend Rewards</h3>
                <p className="text-xs sm:text-sm md:text-base text-gray-400">Premium gaming gear for our top-tier players</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {rewards.filter(r => r.name.includes('Prize')).map((reward, index) => {
                  const canAfford = userCoins >= reward.cost;
                  const isLowStock = reward.stock <= 3;
                  const prizeLabel = reward.name.includes('1st') ? '1ST PRIZE' : reward.name.includes('2nd') ? '2ND PRIZE' : '3RD PRIZE';
                  
                  return (
                    <motion.div
                      key={reward._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.5 + index * 0.15 }}
                      whileHover={{ scale: 1.05, y: -10 }}
                      className="h-full"
                    >
                      <GlassCard variant="intense" className="text-white h-full flex flex-col relative overflow-hidden group border-2 border-red-500/50 hover:border-red-400/70 transition-colors">
                        {/* Animated gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-600/30 via-orange-500/20 to-transparent opacity-50 group-hover:opacity-70 transition-opacity duration-500" />
                        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-red-500 to-orange-600 opacity-20 group-hover:opacity-40 blur-3xl transition-opacity duration-500" />
                        
                        {/* Prize label */}
                        <div className="absolute top-4 left-4 z-10">
                          <Badge className="bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold px-3 py-1 text-xs">
                            {prizeLabel}
                          </Badge>
                        </div>

                        {/* Low stock badge */}
                        {isLowStock && (
                          <div className="absolute top-4 right-4 z-10">
                            <Badge variant="destructive" className="bg-red-600/90 backdrop-blur-sm">
                              Only {reward.stock} left!
                            </Badge>
                          </div>
                        )}

                        <div className="relative z-10 p-6 pt-14">
                          <div className="flex items-center justify-center mb-4">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 shadow-2xl shadow-red-500/50">
                              <Gift className="h-12 w-12 text-white" />
                            </div>
                          </div>
                          <h3 className="text-white text-xl font-bold mb-2 text-center">{reward.name}</h3>
                          <p className="text-gray-300 text-sm mb-4 text-center">
                            {reward.description}
                          </p>
                        </div>

                        <div className="flex-1 relative z-10 px-6">
                          <div className="flex items-center justify-center mb-2">
                            <div className="flex items-center gap-2">
                              <Coins className="h-6 w-6 text-yellow-400" />
                              <span className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                                {reward.cost}+
                              </span>
                            </div>
                          </div>
                          {!canAfford && (
                            <div className="text-center mb-2">
                              <Badge variant="outline" className="text-xs border-red-500/50 text-red-400">
                                Need {reward.cost - userCoins} more coins
                              </Badge>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-center gap-2 text-sm mb-4">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-400">
                              {reward.stock} {reward.stock === 1 ? 'item' : 'items'} remaining
                            </span>
                          </div>
                        </div>

                        <div className="relative z-10 p-6 pt-0">
                          <Button 
                            onClick={() => handleRedeem(reward._id, reward.cost)} 
                            disabled={reward.stock <= 0 || !canAfford}
                            className={`w-full font-semibold transition-all ${
                              canAfford 
                                ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg hover:shadow-red-500/50' 
                                : 'bg-black/60 cursor-not-allowed'
                            }`}
                          >
                            {reward.stock <= 0 ? '❌ Out of Stock' : canAfford ? '🎁 Redeem Now' : '🔒 Not Enough Coins'}
                          </Button>
                        </div>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Other Rewards Section */}
          {rewards.some(r => !r.name.includes('Prize')) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">More Rewards</h2>
                <p className="text-gray-400">Additional items to redeem with your ZE Coins</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {rewards.filter(r => !r.name.includes('Prize')).map((reward, index) => {
            const Icon = rewardIcons[index % rewardIcons.length];
            const canAfford = userCoins >= reward.cost;
            const isLowStock = reward.stock <= 3;
            
            return (
              <motion.div
                key={reward._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.03, y: -8 }}
                className="h-full"
              >
                <GlassCard variant="intense" hover className="text-white h-full flex flex-col relative overflow-hidden group">
                  {/* Gradient overlay */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500 to-orange-600 opacity-0 group-hover:opacity-20 blur-3xl transition-opacity duration-500" />
                  
                  {/* Low stock badge */}
                  {isLowStock && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge variant="destructive" className="bg-red-600/90 backdrop-blur-sm">
                        Only {reward.stock} left!
                      </Badge>
                    </div>
                  )}

                  <div className="relative z-10 p-6">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg">
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                    </div>
                    <h3 className="text-white text-xl font-bold mb-2">{reward.name}</h3>
                    <p className="text-gray-300 text-sm mb-4">
                      {reward.description}
                    </p>
                  </div>

                  <div className="flex-1 relative z-10 px-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-yellow-400" />
                        <span className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                          {reward.cost}
                        </span>
                      </div>
                      {!canAfford && (
                        <Badge variant="outline" className="text-xs border-red-500/50 text-red-400">
                          Need {reward.cost - userCoins} more
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400">
                        {reward.stock} {reward.stock === 1 ? 'item' : 'items'} remaining
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10 p-6 pt-0">
                    <Button 
                      onClick={() => handleRedeem(reward._id, reward.cost)} 
                      disabled={reward.stock <= 0 || !canAfford}
                      className={`w-full font-semibold transition-all ${
                        canAfford 
                          ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-lg hover:shadow-red-500/50' 
                          : 'bg-black/60 cursor-not-allowed'
                      }`}
                    >
                      {reward.stock <= 0 ? '❌ Out of Stock' : canAfford ? '🎁 Redeem Now' : '🔒 Not Enough Coins'}
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            );
                })}
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Redemption Dialog */}
      <RedemptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reward={selectedReward}
        userCoins={userCoins}
        onSuccess={handleRedemptionSuccess}
      />
    </motion.div>
  );
}
