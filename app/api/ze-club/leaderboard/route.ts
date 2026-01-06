import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user';
import { customAlphabet } from 'nanoid';

const ZE_TAG_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

const RANKS = [
  { name: 'Rookie', points: 0, icon: '/images/ranks/rookie.png' },
  { name: 'Contender', points: 100, icon: '/images/ranks/contender.png' },
  { name: 'Gladiator', points: 250, icon: '/images/ranks/gladiator.png' },
  { name: 'Vanguard', points: 500, icon: '/images/ranks/vanguard.png' },
  { name: 'Errorless Legend', points: 1000, icon: '/images/ranks/errorless-legend.png' },
] as const;

function getRankForExperience(experience: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (experience >= RANKS[i].points) return RANKS[i];
  }
  return RANKS[0];
}

const zeSuffix = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);

async function generateUniqueZeTag() {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = `ze_${zeSuffix()}`;
    const exists = await User.exists({ zeTag: candidate });
    if (!exists) return candidate;
  }
  // Extremely unlikely fallback
  return `ze_${customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12)()}`;
}

export async function GET() {
  await dbConnect();

  try {
    // Fetch users with email to validate they're real users
    const users = await User.find(
      { email: { $exists: true, $ne: null } }, // Only fetch users with valid email
      'zeTag points experience zeCoins rank rankIcon profilePhotoUrl image email'
    )
      .limit(200)
      .lean();

    // Normalize first (so sorting works even if experience is missing).
    const normalized = await Promise.all(
      users.map(async (user) => {
        const rawPoints = typeof user.points === 'number' ? user.points : 0;
        const rawExperience = typeof user.experience === 'number' ? user.experience : rawPoints;
        const experience = rawExperience;

        const zeTagIsValid = typeof user.zeTag === 'string' && ZE_TAG_REGEX.test(user.zeTag);
        const zeTag = zeTagIsValid ? user.zeTag : await generateUniqueZeTag();

        const rankData = getRankForExperience(experience);
        const userRank = typeof user.rank === 'string' && user.rank.length > 0 ? user.rank : rankData.name;
        const rankIcon = typeof user.rankIcon === 'string' && user.rankIcon.length > 0 ? user.rankIcon : rankData.icon;

        const needsUpdate =
          !zeTagIsValid ||
          typeof user.experience !== 'number' ||
          typeof user.points !== 'number' ||
          user.points !== experience ||
          typeof user.rank !== 'string' ||
          user.rank.length === 0 ||
          typeof user.rankIcon !== 'string' ||
          user.rankIcon.length === 0;

        return {
          user,
          experience,
          points: experience, // display points = experience (ranking points)
          zeCoins: typeof user.zeCoins === 'number' ? user.zeCoins : rawPoints,
          zeTag,
          userRank,
          rankIcon,
          profilePhoto: user.profilePhotoUrl || user.image || null,
          needsUpdate,
        };
      })
    );

    // Persist sane defaults for users missing required fields.
    const ops = normalized
      .filter((n) => n.needsUpdate)
      .map((n) => ({
        updateOne: {
          filter: { _id: n.user._id },
          update: {
            $set: {
              zeTag: n.zeTag,
              experience: n.experience,
              points: n.experience,
              rank: n.userRank,
              rankIcon: n.rankIcon,
              zeCoins: n.zeCoins,
            },
          },
        },
      }));

    if (ops.length > 0) {
      await User.bulkWrite(ops, { ordered: false });
    }

    // Sort by normalized experience (descending) for ranking.
    const leaderboard = normalized
      .sort((a, b) => b.experience - a.experience)
      .slice(0, 100)
      .map((n, index) => ({
        _id: n.user._id,
        rank: index + 1,
        userRank: n.userRank,
        rankIcon: n.rankIcon,
        profilePhoto: n.profilePhoto,
        zeTag: n.zeTag,
        points: n.points,
        experience: n.experience,
        zeCoins: n.zeCoins,
      }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
