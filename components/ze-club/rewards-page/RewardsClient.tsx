'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Coins, Crown, Loader2, Rocket, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RedemptionDialog } from '../RedemptionDialog';
import { RewardCard } from './RewardCard';
import { IReward } from '@/models/reward';
import logger from '@/lib/browser-logger'
import { useZeClubStore } from '@/lib/stores/zeClubStore';
import ZEClubPageHeader from '../ZEClubPageHeader';

// Define the full Reward type as used in the frontend
interface Reward extends Omit<IReward, 'isModified' | 'increment' | 'get' | '$isNew' | 'errors' | 'schema' | 'db' | 'modelName' | 'collection'> {
  _id: string;
  isLocked?: boolean;
  lockedReason?: string;
  originalCost?: number;
  finalCost?: number;
}

interface DashboardData {
  zeCoins?: number;
  totalPoints?: number;
  zeTag?: string;
}

const REWARDS_QUERY_KEY = ['ze-club', 'rewards'] as const;
const DASHBOARD_QUERY_KEY = ['ze-club', 'dashboard'] as const;

function getCoins(data?: DashboardData) {
  if (!data) {
    return 0;
  }

  return data.zeCoins !== undefined ? data.zeCoins : (data.totalPoints || 0);
}

async function fetchRewards() {
  const response = await fetch('/api/ze-club/rewards', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to fetch rewards');
  }

  const rewardsData = (await response.json()) as Reward[];
  logger.info('📦 Fetched rewards with images:', rewardsData.map((reward) => ({
    name: reward.name,
    hasImage: !!reward.imageUrl,
    imageUrl: reward.imageUrl,
  })));

  return rewardsData;
}

async function fetchDashboard() {
  const response = await fetch('/api/ze-club/user/dashboard', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to fetch user dashboard');
  }

  return (await response.json()) as DashboardData;
}

export default function RewardsClient() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const { toast } = useToast();
  const zeCoins = useZeClubStore((state) => state.zeCoins);
  const hydrateFromDashboard = useZeClubStore((state) => state.hydrateFromDashboard);

  const {
    data: rewards = [],
    isLoading: rewardsLoading,
    error: rewardsError,
  } = useQuery({
    queryKey: REWARDS_QUERY_KEY,
    queryFn: fetchRewards,
  });

  const { data: dashboardData } = useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: fetchDashboard,
    retry: 1,
  });

  useEffect(() => {
    if (dashboardData) {
      hydrateFromDashboard(dashboardData);
    }
  }, [dashboardData, hydrateFromDashboard]);

  const userCoins = dashboardData ? getCoins(dashboardData) : zeCoins;

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

  if (rewardsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
        <p className="animate-pulse">Loading Rewards...</p>
      </div>
    );
  }

  if (rewardsError) {
    const message = rewardsError instanceof Error ? rewardsError.message : 'An unknown error occurred';

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <GlassCard variant="intense" className="p-8 max-w-md border-red-500/30">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Failed to Load</h3>
          <p className="text-gray-400 mb-6">{message}</p>
          <Button onClick={() => window.location.reload()} variant="outline">Try Again</Button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      
      <ZEClubPageHeader
        eyebrow="ZE Club Rewards"
        title="Rewards Store"
        subtitle="Redeem your hard-earned ZE Coins for exclusive gear, tech, and perks."
        action={
          <GlassCard className="px-6 py-4 flex items-center gap-4 bg-purple-500/5 hover:bg-purple-500/10 transition-colors">
            <div className="p-3 rounded-full bg-yellow-500/10">
              <Coins className="h-6 w-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-uppercase tracking-wider text-gray-500 font-semibold">Current Balance</p>
              <p className="text-2xl font-bold text-white tabular-nums">{userCoins.toLocaleString()}</p>
            </div>
          </GlassCard>
        }
      />

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
