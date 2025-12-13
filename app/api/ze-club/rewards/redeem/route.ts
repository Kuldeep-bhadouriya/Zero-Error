import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user';
import Reward from '@/models/reward';

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

    if (user.points < reward.cost) {
      return NextResponse.json({ message: 'Insufficient points' }, { status: 400 });
    }

    user.points -= reward.cost;
    reward.stock -= 1;

    await Promise.all([user.save(), reward.save()]);
    
    // For now, we just log the redemption
    console.log(`User ${user.id} redeemed reward ${reward.id} for ${reward.cost} points.`);

    return NextResponse.json({ message: 'Reward redeemed successfully' });
  } catch (error) {
    console.error('Error redeeming reward:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
