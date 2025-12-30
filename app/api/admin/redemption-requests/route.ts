import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/mongodb';
import RedemptionRequest from '@/models/redemptionRequest';

export async function GET(req: Request) {
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has admin role
  if (!session.user.roles?.includes('admin')) {
    return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
  }

  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    // Build query
    const query = status ? { status } : {};

    // Fetch redemption requests sorted by newest first
    const redemptionRequests = await RedemptionRequest.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(redemptionRequests);
  } catch (error) {
    console.error('Error fetching redemption requests:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
