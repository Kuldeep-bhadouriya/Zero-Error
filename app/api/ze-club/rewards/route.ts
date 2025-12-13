import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Reward from '@/models/reward';

export async function GET() {
  await dbConnect();

  try {
    const rewards = await Reward.find({ stock: { $gt: 0 } }).sort({ cost: 1 });
    return NextResponse.json(rewards);
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
