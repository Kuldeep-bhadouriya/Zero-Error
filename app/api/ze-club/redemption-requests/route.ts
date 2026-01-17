import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user';
import Reward from '@/models/reward';
import RedemptionRequest from '@/models/redemptionRequest';

const RANK_VALUES: Record<string, number> = {
  'Rookie': 0,
  'Contender': 1,
  'Gladiator': 2,
  'Vanguard': 3,
  'Errorless Legend': 4
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();

  try {
    const { rewardId, contactName, contactEmail, contactPhone, address, additionalNotes } = await req.json();

    // Validate required fields
    if (!rewardId || !contactName || !contactEmail || !contactPhone || !address) {
      return NextResponse.json({ 
        message: 'Missing required fields' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      return NextResponse.json({ 
        message: 'Invalid email format' 
      }, { status: 400 });
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(contactPhone.replace(/\s/g, ''))) {
      return NextResponse.json({ 
        message: 'Invalid phone number format' 
      }, { status: 400 });
    }

    const [user, reward] = await Promise.all([
      User.findById(session.user.id),
      Reward.findById(rewardId),
    ]);

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (!reward) {
      return NextResponse.json({ message: 'Reward not found' }, { status: 404 });
    }

    if (reward.stock <= 0) {
      return NextResponse.json({ message: 'Reward is out of stock' }, { status: 400 });
    }

    // Check rank requirement - Higher ranks CAN redeem lower rank rewards
    const userRankValue = RANK_VALUES[user.rank] || 0;
    const requiredRankValue = RANK_VALUES[reward.requiredRank || 'Rookie'] || 0;
    
    if (userRankValue < requiredRankValue) {
      return NextResponse.json({ 
        message: `Rank requirement not met. Requires ${reward.requiredRank} rank or higher.`,
        requiredRank: reward.requiredRank,
        userRank: user.rank
      }, { status: 403 });
    }

    // Check Top 3 requirement for exclusive rewards
    if (reward.exclusiveToTop3) {
      if (user.rank !== 'Errorless Legend') {
        return NextResponse.json({ 
          message: 'This reward is exclusive to Errorless Legends only.',
        }, { status: 403 });
      }
      
      // Check if user is in Top 3
      const betterPlayersCount = await User.countDocuments({ experience: { $gt: user.experience } });
      if (betterPlayersCount >= 3) {
        return NextResponse.json({ 
          message: 'This reward is exclusive to Top 3 Errorless Legends only.',
        }, { status: 403 });
      }
    }

    // Check if user has enough ZE Coins (with discount applied if eligible)
    let finalCost = reward.cost;
    if (userRankValue >= RANK_VALUES['Vanguard'] && reward.discountable) {
      finalCost = Math.floor(reward.cost * 0.9);
    }
    
    if (user.zeCoins < finalCost) {
      return NextResponse.json({ 
        message: 'Insufficient ZE Coins', 
        required: finalCost,
        current: user.zeCoins
      }, { status: 400 });
    }

    // Create redemption request
    const redemptionRequest = new RedemptionRequest({
      userId: user._id,
      userName: user.name || user.email || 'Unknown User',
      userEmail: user.email,
      rewardId: reward._id,
      rewardName: reward.name,
      rewardCost: finalCost,
      contactName,
      contactEmail,
      contactPhone,
      address,
      additionalNotes,
      status: 'pending',
    });

    // Deduct ZE Coins from user and decrease stock
    user.zeCoins -= finalCost;
    user.points = user.experience; // Keep points in sync
    reward.stock -= 1;

    // Save all changes
    await Promise.all([
      redemptionRequest.save(),
      user.save(),
      reward.save(),
    ]);

    console.log(`Redemption request created: User ${user.id} redeemed ${reward.name} for ${finalCost} coins (original: ${reward.cost})`);

    return NextResponse.json({ 
      message: 'Redemption request submitted successfully',
      requestId: redemptionRequest._id 
    });

  } catch (error) {
    console.error('Error creating redemption request:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
