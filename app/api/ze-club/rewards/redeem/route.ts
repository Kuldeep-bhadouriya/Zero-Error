import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user';
import Reward from '@/models/reward';

const RANK_VALUES: Record<string, number> = {
  Rookie: 0,
  Contender: 1,
  Gladiator: 2,
  Vanguard: 3,
  'Errorless Legend': 4,
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const { rewardId } = await req.json();

    if (!rewardId) {
      return NextResponse.json({ message: 'Reward ID is required' }, { status: 400 });
    }

    const rewardPromise = Reward.findById(rewardId);

    // Be resilient to different next-auth session shapes
    const userPromise = session.user.id
      ? User.findById(session.user.id)
      : session.user.email
        ? User.findOne({ email: session.user.email })
        : Promise.resolve(null);

    const [user, reward] = await Promise.all([userPromise, rewardPromise]);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (!reward) {
      return NextResponse.json({ message: 'Reward not found' }, { status: 404 });
    }

    if (reward.stock <= 0) {
      return NextResponse.json({ message: 'Reward is out of stock' }, { status: 400 });
    }

    // Enforce rank + Top-3 eligibility (same rules as GET /api/ze-club/rewards)
    const userRankValue = RANK_VALUES[user.rank] ?? 0;
    const rewardRankValue = RANK_VALUES[reward.requiredRank || 'Rookie'] ?? 0;

    if (userRankValue < rewardRankValue) {
      return NextResponse.json(
        { message: `Requires ${reward.requiredRank} rank` },
        { status: 403 }
      );
    }

    if (reward.exclusiveToTop3) {
      const betterPlayersCount = await User.countDocuments({ experience: { $gt: user.experience } });
      const isTop3 = betterPlayersCount < 3;
      if (!isTop3) {
        return NextResponse.json(
          { message: 'Exclusive to Top 3 Errorless Legends' },
          { status: 403 }
        );
      }
      if (user.rank !== 'Errorless Legend') {
        return NextResponse.json(
          { message: 'Exclusive to Errorless Legends' },
          { status: 403 }
        );
      }
    }

    // Apply Vanguard+ 10% discount for discountable rewards
    const isVanguardPlus = userRankValue >= (RANK_VALUES.Vanguard ?? 3);
    const finalCost = isVanguardPlus && reward.discountable ? Math.floor(reward.cost * 0.9) : reward.cost;

    // Check if user has enough ZE Coins (not experience!)
    if (user.zeCoins < finalCost) {
      return NextResponse.json({ 
        message: 'Insufficient ZE Coins', 
        required: finalCost,
        current: user.zeCoins
      }, { status: 400 });
    }

    // Deduct ZE Coins only (experience remains unchanged - rank protected!)
    user.zeCoins -= finalCost;
    // Keep points in sync with experience (not zeCoins)
    user.points = user.experience;
    reward.stock -= 1;

    await Promise.all([user.save(), reward.save()]);
    
    // For now, we just log the redemption
    console.log(`User ${user.id} redeemed reward ${reward.id} for ${finalCost} ZE Coins.`);

    return NextResponse.json({ message: 'Reward redeemed successfully' });
  } catch (error) {
    console.error('Error redeeming reward:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
