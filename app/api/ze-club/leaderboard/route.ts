import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user';
import Season, { type ISeason } from '@/models/season';
import { Types } from 'mongoose';
import { customAlphabet } from 'nanoid';
import { getRankForExperience } from '@/lib/ranks';
import { gzipSync } from 'zlib';
import { withErrorHandling, withRequestLogging } from '@/lib/api/middleware';

const ZE_TAG_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

const zeSuffix = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);
const zeFallbackSuffix = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);

type LeaderboardUser = {
  _id: Types.ObjectId;
  zeTag?: string;
  points?: number;
  experience?: number;
  zeCoins?: number;
  rank?: string;
  rankIcon?: string;
  profilePhotoUrl?: string;
  image?: string;
};

type LeaderboardCursor = {
  experience: number;
  id: string;
  rankStart: number;
};

function decodeCursor(rawCursor: string | null): LeaderboardCursor | null {
  if (!rawCursor) return null;

  try {
    const parsed = JSON.parse(Buffer.from(rawCursor, 'base64url').toString('utf8')) as Partial<LeaderboardCursor>;
    if (
      typeof parsed.experience !== 'number' ||
      typeof parsed.id !== 'string' ||
      !Types.ObjectId.isValid(parsed.id) ||
      typeof parsed.rankStart !== 'number' ||
      parsed.rankStart < 1
    ) {
      return null;
    }
    return {
      experience: parsed.experience,
      id: parsed.id,
      rankStart: parsed.rankStart,
    };
  } catch {
    return null;
  }
}

function encodeCursor(cursor: LeaderboardCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
}

function maybeCompressedJson(request: Request, payload: unknown) {
  const body = JSON.stringify(payload);
  const acceptEncoding = request.headers.get('accept-encoding') || '';

  if (acceptEncoding.includes('gzip')) {
    return new NextResponse(gzipSync(body), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Encoding': 'gzip',
        Vary: 'Accept-Encoding',
      },
    });
  }

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Vary: 'Accept-Encoding',
    },
  });
}

async function allocateUniqueZeTags(count: number, reservedTags: Set<string>) {
  if (count <= 0) return [];

  const generated: string[] = [];
  const taken = new Set(reservedTags);

  for (let round = 0; round < 12 && generated.length < count; round++) {
    const needed = count - generated.length;
    const batchSize = Math.max(needed * 4, 16);
    const candidates: string[] = [];
    const candidateSet = new Set<string>();

    while (candidates.length < batchSize) {
      const candidate = `ze_${zeSuffix()}`;
      if (taken.has(candidate) || candidateSet.has(candidate)) continue;
      candidateSet.add(candidate);
      candidates.push(candidate);
    }

    const existing = await User.distinct('zeTag', { zeTag: { $in: candidates } });
    const existingSet = new Set(existing.filter((tag): tag is string => typeof tag === 'string'));

    for (const candidate of candidates) {
      if (generated.length >= count) break;
      if (existingSet.has(candidate)) continue;
      taken.add(candidate);
      generated.push(candidate);
    }
  }

  while (generated.length < count) {
    const fallback = `ze_${zeFallbackSuffix()}`;
    if (taken.has(fallback)) continue;
    taken.add(fallback);
    generated.push(fallback);
  }

  return generated;
}

export const GET = withRequestLogging(
  '/api/ze-club/leaderboard',
  withErrorHandling('/api/ze-club/leaderboard', async (request: Request) => {
  await dbConnect();

    const { searchParams } = new URL(request.url);
    const parsedLimit = Number(searchParams.get('limit'));
    const pageSize = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(Math.floor(parsedLimit), 1), 50)
      : 20;
    const cursor = decodeCursor(searchParams.get('cursor'));

    // Get current season info
    const activeSeason = await Season.findOne({ status: 'active' })
      .select('seasonNumber name')
      .lean() as ISeason | null

    const cursorMatch = cursor
      ? {
          $or: [
            { experience: { $lt: cursor.experience } },
            { experience: cursor.experience, _id: { $gt: new Types.ObjectId(cursor.id) } },
          ],
        }
      : null;

    // Aggregate query keeps selection/sorting/limit in a single server-side pipeline.
    const users = await User.aggregate<LeaderboardUser>([
      {
        $match: {
          email: { $exists: true, $ne: null },
        },
      },
      ...(cursorMatch ? [{ $match: cursorMatch }] : []),
      {
        $sort: { experience: -1, _id: 1 },
      },
      {
        $limit: pageSize + 1,
      },
      {
        $project: {
          zeTag: 1,
          points: 1,
          experience: 1,
          zeCoins: 1,
          rank: 1,
          rankIcon: 1,
          profilePhotoUrl: 1,
          image: 1,
        },
      },
    ]);

    const reservedTags = new Set(
      users
        .map((user) => user.zeTag)
        .filter((tag): tag is string => typeof tag === 'string' && ZE_TAG_REGEX.test(tag))
    );

    const missingZeTagCount = users.reduce((count, user) => {
      const zeTagIsValid = typeof user.zeTag === 'string' && ZE_TAG_REGEX.test(user.zeTag);
      return zeTagIsValid ? count : count + 1;
    }, 0);

    const allocatedZeTags = await allocateUniqueZeTags(missingZeTagCount, reservedTags);
    let allocatedIndex = 0;
    const rankStart = cursor?.rankStart ?? 1;

    // Normalize first (so sorting works even if experience is missing).
    const normalized = users.map((user) => {
      const rawPoints = typeof user.points === 'number' ? user.points : 0;
      const rawExperience = typeof user.experience === 'number' ? user.experience : rawPoints;
      const experience = rawExperience;

      const zeTagIsValid = typeof user.zeTag === 'string' && ZE_TAG_REGEX.test(user.zeTag);
      const zeTag = zeTagIsValid
        ? user.zeTag
        : allocatedZeTags[allocatedIndex++] ?? `ze_${zeFallbackSuffix()}`;

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
    });

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

    const hasMore = normalized.length > pageSize;
    const pageItems = hasMore ? normalized.slice(0, pageSize) : normalized;

    const leaderboard = pageItems.map((n, index) => ({
      _id: String(n.user._id),
      rank: rankStart + index,
      userRank: n.userRank,
      profilePhoto: n.profilePhoto,
      zeTag: n.zeTag,
      points: n.points,
    }));

    const last = pageItems[pageItems.length - 1];
    const nextCursor = hasMore && last
      ? encodeCursor({
          experience: last.experience,
          id: String(last.user._id),
          rankStart: rankStart + pageItems.length,
        })
      : null;

    return maybeCompressedJson(request, {
      leaderboard,
      pagination: {
        limit: pageSize,
        hasMore,
        nextCursor,
      },
      season: activeSeason ? {
        seasonNumber: activeSeason.seasonNumber,
        name: activeSeason.name,
      } : null,
    });
  })
)
