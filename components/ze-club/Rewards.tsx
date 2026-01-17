'use client';

import { useState, useEffect } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { Gift, Coins, ShoppingBag, Star, Sparkles, TrendingUp, Package, Target, Lock, ShieldAlert, Award, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RedemptionDialog } from './RedemptionDialog';
import { cn } from '@/lib/utils';

interface Reward {
  _id: string;
  name: string;
  description: string;
  cost: number;
  stock: number;
  // New fields from API
  isLocked?: boolean;
  lockedReason?: string;
  originalCost?: number;
  finalCost?: number;
  requiredRank?: string;
  exclusiveToTop3?: boolean;
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
          const coins = dashboardData.zeCoins !== undefined ? dashboardData.zeCoins : (dashboardData.totalPoints || 0);
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

  async function handleRedeem(reward: Reward) {
    const cost = reward.finalCost ?? reward.cost;
    
    if (userCoins < cost) {
      toast({
        title: 'Insufficient ZE Coins 💰',
        description: `You need ${cost - userCoins} more ZE Coins.`,
        variant: 'destructive',
      });
      return;
    }

    if (reward.isLocked) {
       toast({
        title: 'Reward Locked 🔒',
        description: reward.lockedReason || 'This reward is currently locked for you.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedReward(reward);
    setDialogOpen(true);
  }

  function handleRedemptionSuccess() {
    async function refreshData() {
      try {
        const [rewardsResponse, dashboardResponse] = await Promise.all([
          fetch('/api/ze-club/rewards'),
          fetch('/api/ze-club/user/dashboard')
        ]);

        if (rewardsResponse.ok) {
          setRewards(await rewardsResponse.json());
        }

        if (dashboardResponse.ok) {
          const dashboardData = await dashboardResponse.json();
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
      <div className="flex items-center justify-center h-64">
        <motion.div 
          className="text-xl text-gray-400 flex items-center gap-3"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ShoppingBag className="h-6 w-6 text-red-500" />
          Loading rewards...
        </motion.div>
      </div>
    );
  }
  
  if (error) {
    return (
      <GlassCard variant="intense" gradient="red" className="p-6">
        <div className="text-red-400 flex items-center gap-2">
          <ShieldAlert className="h-6 w-6" />
          <span>Error: {error}</span>
        </div>
      </GlassCard>
    );
  }

  const exclusiveRewards = rewards.filter(r => r.exclusiveToTop3 || r.name.includes('Prize'));
  const regularRewards = rewards.filter(r => !r.exclusiveToTop3 && !r.name.includes('Prize'));

  const RewardCard = ({ reward, index, isExclusive = false }: { reward: Reward, index: number, isExclusive?: boolean }) => {
    const cost = reward.finalCost ?? reward.cost;
    const canAfford = userCoins >= cost;
    const isDiscounted = (reward.originalCost ?? reward.cost) > cost;
    const isLowStock = reward.stock <= 3;
    const isLocked = reward.isLocked;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 * index }}
        whileHover={!isLocked ? { scale: 1.03, y: -5 } : {}}
        className="h-full"
      >
        <GlassCard 
          variant={isExclusive ? "intense" : "default"} 
          className={cn(
            "h-full flex flex-col relative overflow-hidden group transition-all",
            isExclusive ? "border-red-500/30" : "",
            isLocked ? "opacity-75 grayscale-[0.5]" : "hover:border-red-400/50"
          )}
        >
          {/* Discount Badge */}
          {isDiscounted && !isLocked && (
            <div className="absolute top-0 left-0 z-20">
              <Badge className="rounded-tl-lg rounded-br-lg bg-green-600 text-white font-bold border-none px-3 py-1">
                SALE
              </Badge>
            </div>
          )}

          {/* Locked Overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-black/60 z-30 flex flex-col items-center justify-center p-4 text-center backdrop-blur-[2px]">
              <div className="p-3 rounded-full bg-black/50 border border-gray-700 mb-3">
                <Lock className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-white font-semibold mb-1">Locked</p>
              <p className="text-sm text-gray-300">{reward.lockedReason}</p>
              {reward.requiredRank && (
                <Badge variant="outline" className="mt-3 border-red-500/40 text-red-400">
                  Req: {reward.requiredRank}
                </Badge>
              )}
            </div>
          )}

          {/* Low Stock Badge */}
          {!isLocked && isLowStock && reward.stock > 0 && (
            <div className="absolute top-4 right-4 z-10">
              <Badge variant="destructive" className="bg-red-600/90 shadow-lg animate-pulse">
                Only {reward.stock} left!
              </Badge>
            </div>
          )}

          {/* Exclusive Glow */}
          {isExclusive && !isLocked && (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-orange-500/5 to-transparent opacity-100" />
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/20 blur-3xl rounded-full" />
            </>
          )}

          <div className="relative z-10 p-6 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div className={cn(
                "p-3 rounded-xl shadow-lg",
                isExclusive ? "bg-gradient-to-br from-red-600 to-orange-600" : "bg-gradient-to-br from-gray-700 to-gray-600"
              )}>
                {isExclusive ? <Gift className="h-6 w-6 text-white" /> : <Package className="h-6 w-6 text-white" />}
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-2 leading-tight">{reward.name}</h3>
            <p className="text-sm text-gray-400 line-clamp-3">{reward.description}</p>
          </div>

          <div className="relative z-10 px-6 pb-6 mt-auto space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Cost</p>
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-yellow-400" />
                  <div className="flex flex-col">
                    {isDiscounted && (
                      <span className="text-xs text-gray-500 line-through">
                        {reward.originalCost}
                      </span>
                    )}
                    <span className={cn(
                      "text-xl font-bold bg-clip-text text-transparent",
                      canAfford ? "bg-gradient-to-r from-yellow-400 to-orange-400" : "bg-gray-500"
                    )}>
                      {cost}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Stock</p>
                <span className={cn("text-sm font-medium", reward.stock === 0 ? "text-red-500" : "text-gray-300")}>
                  {reward.stock} remaining
                </span>
              </div>
            </div>

            <Button 
              onClick={() => handleRedeem(reward)} 
              disabled={reward.stock <= 0 || !canAfford || isLocked}
              className={cn(
                "w-full font-semibold transition-all h-10",
                canAfford && !isLocked
                  ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 shadow-md hover:shadow-red-500/25" 
                  : "bg-gray-800 text-gray-400 hover:bg-gray-800"
              )}
            >
              {reward.stock <= 0 ? 'Out of Stock' : isLocked ? 'Locked' : canAfford ? 'Redeem Now' : 'Not Enough Coins'}
            </Button>
          </div>
        </GlassCard>
      </motion.div>
    );
  };

  const ranks = ['Errorless Legend', 'Vanguard', 'Gladiator', 'Contender', 'Rookie'];

  return (
    <motion.div 
      className="relative z-10 text-white space-y-12"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-2">
            Rewards Store
          </h1>
          <p className="text-gray-400">Redeem your hard-earned ZE Coins for exclusive gear and perks.</p>
        </div>
        
        <GlassCard variant="intense" className="px-5 py-3 flex items-center gap-3 bg-purple-900/20 border-purple-500/30">
          <div className="p-2 rounded-full bg-purple-500/20">
            <Coins className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-purple-300 font-medium">Your Balance</p>
            <p className="text-xl font-bold text-white">{userCoins} Coins</p>
          </div>
        </GlassCard>
      </div>

      {userCoins === 0 && (
        <GlassCard variant="intense" gradient="blue" className="p-4 flex items-start gap-4">
          <Target className="h-6 w-6 text-blue-400 shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-white">Start Earning!</h3>
            <p className="text-sm text-gray-300 mt-1">
              Complete missions and participate in events to earn ZE Coins. Check the Dashboard for ways to earn.
            </p>
          </div>
        </GlassCard>
      )}

      {/* Info about redemption tracking */}
      <GlassCard variant="intense" gradient="purple" className="p-4 flex items-start gap-4">
        <Info className="h-6 w-6 text-purple-400 shrink-0 mt-1" />
        <div>
          <h3 className="font-semibold text-white">Track Your Redemptions</h3>
          <p className="text-sm text-gray-300 mt-1">
            After redeeming a reward, you can track its status (pending, processing, completed, or cancelled) in your{' '}
            <a href="/profile#redemptions" className="text-purple-400 hover:text-purple-300 underline font-semibold">
              Profile → Redemption History
            </a>
            . We'll keep you updated on your request progress!
          </p>
        </div>
      </GlassCard>

      {/* Rewards by Rank */}
      {rewards.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl text-gray-400">No rewards available at the moment.</p>
          <p className="text-sm text-gray-500 mt-2">Check back soon for new rewards!</p>
        </div>
      ) : (
        <div className="space-y-16">
          {ranks.map((rank) => {
            const rankRewards = rewards.filter(r => r.requiredRank === rank || (rank === 'Rookie' && !r.requiredRank));
            
            if (rankRewards.length === 0) return null;

            const isLegend = rank === 'Errorless Legend';
            const sectionTitle = isLegend ? 'Errorless Legends Rewards' : `${rank} Rewards`;

            return (
              <section key={rank} className="space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
                  {isLegend ? (
                    <Sparkles className="h-6 w-6 text-yellow-500" />
                  ) : (
                    <Award className="h-6 w-6 text-gray-400" />
                  )}
                  <div>
                    <h2 className={cn(
                      "text-2xl font-bold",
                      isLegend ? "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500" : "text-white"
                    )}>
                      {sectionTitle}
                    </h2>
                    {isLegend && (
                      <Badge variant="secondary" className="mt-1 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                        Top 3 Only
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {rankRewards.map((reward, i) => (
                    <RewardCard 
                      key={reward._id} 
                      reward={reward} 
                      index={i} 
                      isExclusive={isLegend} 
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

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
