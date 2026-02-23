import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { errorResponse } from '@/lib/api-response';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user';
import Reward from '@/models/reward';
import Season from '@/models/season';
import logger from '@/lib/logger';
import { z } from 'zod';
import { badRequestFromZod, objectIdSchema } from '@/lib/validation';

const redeemBodySchema = z.object({
  rewardId: objectIdSchema,
});

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
    return errorResponse('Unauthorized', 401);
  }

  await dbConnect();

  // Check if there is an active season
  const activeSeason = await Season.findOne({ status: 'active' }).lean();
  if (!activeSeason) {
    return NextResponse.json(
      { message: 'No active season. Reward redemptions are only available during an active season.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const parsed = redeemBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Invalid request payload', ...badRequestFromZod(parsed.error) }, { status: 400 });
    }

    const { rewardId } = parsed.data;

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
    
    logger.info({ route: '/api/ze-club/rewards/redeem', userId: user.id, rewardId: reward.id, finalCost }, 'Reward redeemed');

    return NextResponse.json({ message: 'Reward redeemed successfully' });
  } catch (error) {
    logger.error({ route: '/api/ze-club/rewards/redeem', err: error }, 'Error redeeming reward');
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
