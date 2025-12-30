import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user';
import Reward from '@/models/reward';
import RedemptionRequest from '@/models/redemptionRequest';

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

    // Check if user has enough ZE Coins
    if (user.zeCoins < reward.cost) {
      return NextResponse.json({ 
        message: 'Insufficient ZE Coins', 
        required: reward.cost,
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
      rewardCost: reward.cost,
      contactName,
      contactEmail,
      contactPhone,
      address,
      additionalNotes,
      status: 'pending',
    });

    // Deduct ZE Coins from user and decrease stock
    user.zeCoins -= reward.cost;
    user.points = user.experience; // Keep points in sync
    reward.stock -= 1;

    // Save all changes
    await Promise.all([
      redemptionRequest.save(),
      user.save(),
      reward.save(),
    ]);

    console.log(`Redemption request created: User ${user.id} redeemed ${reward.name} for ${reward.cost} coins`);

    return NextResponse.json({ 
      message: 'Redemption request submitted successfully',
      requestId: redemptionRequest._id 
    });

  } catch (error) {
    console.error('Error creating redemption request:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
