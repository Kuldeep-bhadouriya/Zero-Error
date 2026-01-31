'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Coins, Crown, Loader2, Rocket, AlertTriangle } from 'lucide-react';

import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RedemptionDialog } from '../RedemptionDialog';
import { RewardCard } from './RewardCard';
import { IReward } from '@/models/reward';

// Define the full Reward type as used in the frontend
interface Reward extends Omit<IReward, 'isModified' | 'increment' | 'get' | '$isNew' | 'errors' | 'schema' | 'db' | 'modelName' | 'collection'> {
  _id: string;
  isLocked?: boolean;
  lockedReason?: string;
  originalCost?: number;
  finalCost?: number;
}

export default function RewardsClient() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userCoins, setUserCoins] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rewardsResponse, dashboardResponse] = await Promise.all([
        fetch('/api/ze-club/rewards', { cache: 'no-store' }),
        fetch('/api/ze-club/user/dashboard', { cache: 'no-store' })
      ]);

      if (!rewardsResponse.ok) throw new Error('Failed to fetch rewards');
      
      const rewardsData = await rewardsResponse.json();
      console.log('📦 Fetched rewards with images:', rewardsData.map((r: any) => ({ name: r.name, hasImage: !!r.imageUrl, imageUrl: r.imageUrl })));
      setRewards(rewardsData);

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        const coins = dashboardData.zeCoins !== undefined ? dashboardData.zeCoins : (dashboardData.totalPoints || 0);
        setUserCoins(coins);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRedeem = (reward: Reward) => {
    if (reward.isLocked) {
      toast({
        title: 'Reward Locked',
        description: reward.lockedReason,
        variant: 'destructive',
      });
      return;
    }
    setSelectedReward(reward);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    fetchData(); // Refresh data to update stock and balance
    setDialogOpen(false);
    toast({
      title: "Redemption Successful! 🎉",
      description: "Check your email for confirmation.",
    });
  };

  // Filter rewards
  const { exclusiveRewards, regularRewards } = useMemo(() => {
    const exclusive = rewards.filter(r => r.exclusiveToTop3 || r.name.toLowerCase().includes('prize'));
    const regular = rewards.filter(r => !exclusive.includes(r));
    return { exclusiveRewards: exclusive, regularRewards: regular };
  }, [rewards]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
        <p className="animate-pulse">Loading Rewards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <GlassCard variant="intense" className="p-8 max-w-md border-red-500/30">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Failed to Load</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">Try Again</Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-white/5">
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
            Rewards Store
          </h1>
          <p className="text-gray-400 max-w-xl text-lg">
            Redeem your hard-earned ZE Coins for exclusive gear, tech, and perks.
          </p>
        </div>

        <GlassCard className="px-6 py-4 flex items-center gap-4 bg-purple-500/5 hover:bg-purple-500/10 transition-colors">
          <div className="p-3 rounded-full bg-yellow-500/10">
            <Coins className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <p className="text-xs text-uppercase tracking-wider text-gray-500 font-semibold">Current Balance</p>
            <p className="text-2xl font-bold text-white tabular-nums">{userCoins.toLocaleString()}</p>
          </div>
        </GlassCard>
      </div>

      {userCoins === 0 && (
         <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="p-1"
          >
           <GlassCard variant="subtle" gradient="blue" className="p-6 flex flex-col md:flex-row items-center gap-6">
              <div className="p-4 bg-blue-500/20 rounded-full">
                <Rocket className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Start Earning!</h3>
                <p className="text-gray-400">Complete missions and challenges to earn your first coins.</p>
              </div>
              <Button 
                variant="secondary" 
                className="md:ml-auto whitespace-nowrap"
                onClick={() => window.location.href = '/ze-club/missions'}
              >
                Go to Missions
              </Button>
           </GlassCard>
         </motion.div>
      )}

      {/* Exclusive Section */}
      {exclusiveRewards.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3">
             <Crown className="w-6 h-6 text-yellow-500" />
             <h2 className="text-2xl font-bold text-white">Exclusive Rewards</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exclusiveRewards.map((reward, index) => (
              <RewardCard
                key={reward._id}
                index={index}
                reward={reward}
                userCoins={userCoins}
                onRedeem={handleRedeem}
              />
            ))}
          </div>
        </section>
      )}

      {/* Regular Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white">All Rewards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {regularRewards.map((reward, index) => (
            <RewardCard
              key={reward._id}
              index={index}
              reward={reward}
              userCoins={userCoins}
              onRedeem={handleRedeem}
            />
          ))}
        </div>
      </section>

      <RedemptionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reward={selectedReward && {
          _id: selectedReward._id,
          name: selectedReward.name,
          cost: selectedReward.finalCost || selectedReward.cost
        }}
        userCoins={userCoins}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
