import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user';

export async function GET() {
  await dbConnect();

  try {
    const users = await User.find({}, 'name points rank rankIcon profilePhotoUrl image')
      .sort({ points: -1 })
      .limit(100)
      .lean();

    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1,
      userRank: user.rank, // Rename to avoid confusion with leaderboard position
      rankIcon: user.rankIcon || '/images/ranks/rookie.svg',
      profilePhoto: user.profilePhotoUrl || user.image || null,
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
