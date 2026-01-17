import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import Reward from '@/models/reward';
import User from '@/models/user';

const RANK_VALUES: Record<string, number> = {
  'Rookie': 0,
  'Contender': 1,
  'Gladiator': 2,
  'Vanguard': 3,
  'Errorless Legend': 4
};

export async function GET() {
  await dbConnect();

  try {
    const session = await auth();
    let user = null;
    let userRankValue = -1;
    let isTop3 = false;

    if (session?.user?.email) {
      user = await User.findOne({ email: session.user.email });
      if (user) {
        userRankValue = RANK_VALUES[user.rank] || 0;
        
        // Check if user is in Top 3 based on experience
        const betterPlayersCount = await User.countDocuments({ experience: { $gt: user.experience } });
        isTop3 = betterPlayersCount < 3;
      }
    }

    const rewards = await Reward.find({ stock: { $gt: 0 } }).sort({ cost: 1 });

    const processedRewards = rewards.map(reward => {
      const rewardRankValue = RANK_VALUES[reward.requiredRank || 'Rookie'] || 0;
      let isLocked = false;
      let lockedReason = '';
      let finalCost = reward.cost;

      // Check Authentication first
      if (!user) {
        isLocked = true;
        lockedReason = 'Sign in to claim';
      }
      // Check Rank Requirement - Higher ranks CAN redeem lower rank rewards
      else if (userRankValue < rewardRankValue) {
        isLocked = true;
        lockedReason = `Requires ${reward.requiredRank} rank or higher`;
      }
      // Check Top 3 Requirement for exclusive rewards
      else if (reward.exclusiveToTop3) {
        if (user?.rank !== 'Errorless Legend') {
          isLocked = true;
          lockedReason = 'Exclusive to Errorless Legends only';
        } else if (!isTop3) {
          isLocked = true;
          lockedReason = 'Exclusive to Top 3 Errorless Legends';
        }
      }

      // Apply Discount for Vanguard+
      if (user && userRankValue >= RANK_VALUES['Vanguard'] && reward.discountable) {
        finalCost = Math.floor(reward.cost * 0.9);
      }

      return {
        ...reward.toObject(),
        isLocked,
        lockedReason,
        originalCost: reward.cost,
        finalCost,
        userEligible: !isLocked // Helper for frontend
      };
    });

    return NextResponse.json(processedRewards);
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
