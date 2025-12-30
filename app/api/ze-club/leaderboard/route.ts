import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user';

export async function GET() {
  await dbConnect();

  try {
    const users = await User.find({}, 'zeTag points experience zeCoins rank rankIcon profilePhotoUrl image')
      .sort({ experience: -1 }) // Sort by experience for ranking
      .limit(100)
      .lean();

    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1,
      userRank: user.rank, // Rename to avoid confusion with leaderboard position
      rankIcon: user.rankIcon || '/images/ranks/rookie.svg',
      profilePhoto: user.profilePhotoUrl || user.image || null,
      zeTag: user.zeTag || 'UnknownUser',
      experience: user.experience || user.points, // Use experience for display
      zeCoins: user.zeCoins || user.points, // Show ZE Coins separately
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
