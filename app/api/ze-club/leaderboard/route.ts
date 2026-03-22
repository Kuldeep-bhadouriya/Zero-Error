import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user';
import Season, { type ISeason } from '@/models/season';
import MissionSubmission from '@/models/missionSubmission';
import { Types } from 'mongoose';
import { customAlphabet } from 'nanoid';
import { getRankForExperience } from '@/lib/ranks';
import { gzipSync } from 'zlib';
import { withErrorHandling, withRequestLogging } from '@/lib/api/middleware';
import {
  createNoStoreHeaders,
  createPublicCacheHeaders,
  createWeakEtag,
  isCacheDebugEnabled,
  isFreshRequest,
  resolvePublicCacheTtl,
} from '@/lib/http-cache';
import logger from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ZE_TAG_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

const zeSuffix = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 8);
const zeFallbackSuffix = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 12);
const LEADERBOARD_CACHE_TTL_SECONDS = resolvePublicCacheTtl('ZE_CLUB_LEADERBOARD_CACHE_TTL_SECONDS', 60);
const ENABLE_SUBMISSION_RECOMPUTE = process.env.ZE_CLUB_LEADERBOARD_RECOMPUTE_FROM_SUBMISSIONS !== 'false';
const ENABLE_NORMALIZE_WRITEBACK = process.env.ZE_CLUB_LEADERBOARD_PERSIST_NORMALIZED_FIELDS === 'true';

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

type SubmissionPointsAggRow = {
  _id: Types.ObjectId;
  totalPoints: number;
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

function maybeCompressedJson(request: Request, payload: unknown, responseHeaders?: HeadersInit, status = 200) {
  const body = JSON.stringify(payload);
  const acceptEncoding = request.headers.get('accept-encoding') || '';
  const headers = new Headers(responseHeaders);
  const existingVary = headers.get('Vary');
  const varyParts = new Set((existingVary || '').split(',').map((part) => part.trim()).filter(Boolean));
  varyParts.add('Accept-Encoding');
  headers.set('Vary', Array.from(varyParts).join(', '));

  if (acceptEncoding.includes('gzip')) {
    return new NextResponse(gzipSync(body), {
      status,
      headers: {
        ...Object.fromEntries(headers.entries()),
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Encoding': 'gzip',
      },
    });
  }

  return new NextResponse(body, {
    status,
    headers: {
      ...Object.fromEntries(headers.entries()),
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

async function getSubmissionPointsMap(enabled: boolean) {
  if (!enabled) {
    return new Map<string, number>();
  }

  const submissionPointsAgg = await MissionSubmission.aggregate<SubmissionPointsAggRow>([
    { $match: { status: 'approved' } },
    {
      $group: {
        _id: {
          user: '$user',
          mission: '$mission',
        },
        submissionCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'missions',
        localField: '_id.mission',
        foreignField: '_id',
        as: 'missionData',
        pipeline: [{ $project: { points: 1 } }],
      },
    },
    { $unwind: { path: '$missionData', preserveNullAndEmptyArrays: false } },
    {
      $group: {
        _id: '$_id.user',
        totalPoints: {
          $sum: {
            $multiply: ['$submissionCount', '$missionData.points'],
          },
        },
      },
    },
  ]);

  return new Map(submissionPointsAgg.map((row) => [row._id.toString(), row.totalPoints]));
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

    const cacheDebug = isCacheDebugEnabled();

    const { searchParams } = new URL(request.url);
    const rawLimit = searchParams.get('limit');
    const parsedLimit = rawLimit === null ? NaN : Number(rawLimit);
    const pageSize = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(Math.floor(parsedLimit), 1), 50)
      : 20;
    const cursor = decodeCursor(searchParams.get('cursor'));

    // Get current season info
    const activeSeason = await Season.findOne({ status: 'active' })
      .select('seasonNumber name updatedAt')
      .lean() as ISeason | null

    const submissionPointsMap = await getSubmissionPointsMap(ENABLE_SUBMISSION_RECOMPUTE);

    // Fetch all users, then rank by normalized experience.
    // This avoids stale DB `experience` values excluding users before correction.
    const users = await User.find(
      {},
      {
        zeTag: 1,
        points: 1,
        experience: 1,
        zeCoins: 1,
        rank: 1,
        rankIcon: 1,
        profilePhotoUrl: 1,
        image: 1,
      }
    ).lean<LeaderboardUser[]>();

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
      // Source-of-truth: sum of points from every approved mission submission.
      // This corrects cases where `experience` / `points` in the DB were set to a
      // stale / lower value (e.g. ZE_lythic: 34 missions × 10 pts = 340 but DB
      // had both fields at 300 after a legacy normalisation pass).
      const submissionBased = submissionPointsMap.get(String(user._id)) ?? 0;
      const experience = Math.max(rawExperience, rawPoints, submissionBased);

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
        user.experience !== experience ||   // catches stale / lower stored value
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
    if (ENABLE_NORMALIZE_WRITEBACK) {
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
    } else if (cacheDebug) {
      logger.debug(
        {
          route: '/api/ze-club/leaderboard',
          writeback: 'disabled',
        },
        'Skipping leaderboard normalization write-back due to env guard'
      );
    }

    // Sort by effective experience after normalization, then apply cursor + page window.
    const rankedUsers = normalized
      .sort((a, b) => {
        if (b.experience !== a.experience) return b.experience - a.experience;
        return String(a.user._id).localeCompare(String(b.user._id));
      });

    const cursorFiltered = cursor
      ? rankedUsers.filter(
          (n) =>
            n.experience < cursor.experience ||
            (n.experience === cursor.experience &&
              String(n.user._id).localeCompare(cursor.id) > 0)
        )
      : rankedUsers;

    const pageWindow = cursorFiltered.slice(0, pageSize + 1);
    const hasMore = pageWindow.length > pageSize;
    const pageItems = hasMore ? pageWindow.slice(0, pageSize) : pageWindow;

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

    const payload = {
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
    };

    if (LEADERBOARD_CACHE_TTL_SECONDS <= 0) {
      if (cacheDebug) {
        logger.debug(
          { route: '/api/ze-club/leaderboard', cacheStatus: 'BYPASS', ttl: 0 },
          'Leaderboard public cache disabled'
        );
      }

      return maybeCompressedJson(
        request,
        payload,
        createNoStoreHeaders(cacheDebug ? 'BYPASS' : undefined)
      );
    }

    const etag = createWeakEtag(payload);
    const lastModified = activeSeason?.updatedAt ? new Date(activeSeason.updatedAt) : new Date();

    if (isFreshRequest(request, etag, lastModified)) {
      if (cacheDebug) {
        logger.debug(
          {
            route: '/api/ze-club/leaderboard',
            cacheStatus: 'HIT',
            ttl: LEADERBOARD_CACHE_TTL_SECONDS,
          },
          'Returning 304 from conditional leaderboard cache check'
        );
      }

      return new NextResponse(null, {
        status: 304,
        headers: createPublicCacheHeaders({
          ttlSeconds: LEADERBOARD_CACHE_TTL_SECONDS,
          etag,
          lastModified,
          cacheStatus: 'HIT',
          includeDebugHeaders: cacheDebug,
        }),
      });
    }

    if (cacheDebug) {
      logger.debug(
        {
          route: '/api/ze-club/leaderboard',
          cacheStatus: 'MISS',
          ttl: LEADERBOARD_CACHE_TTL_SECONDS,
        },
        'Returning cached leaderboard response with validators'
      );
    }

    return maybeCompressedJson(
      request,
      payload,
      createPublicCacheHeaders({
        ttlSeconds: LEADERBOARD_CACHE_TTL_SECONDS,
        etag,
        lastModified,
        cacheStatus: 'MISS',
        includeDebugHeaders: cacheDebug,
      })
    );
  })
)
