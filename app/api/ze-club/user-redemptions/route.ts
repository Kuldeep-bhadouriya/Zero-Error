import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { errorResponse } from '@/lib/api-response';
import dbConnect from '@/lib/mongodb';
import RedemptionRequest from '@/models/redemptionRequest';
import User from '@/models/user';
import logger from '@/lib/logger'

export async function GET() {
  await dbConnect();

  try {
    const session = await auth();

    if (!session?.user?.email) {
      return errorResponse('Unauthorized', 401);
    }

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Fetch all redemption requests for this user
    const redemptions = await RedemptionRequest.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(redemptions);
  } catch (error) {
    logger.error('Error fetching user redemptions:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
