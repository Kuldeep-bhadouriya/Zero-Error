import 'server-only';
import { Redis } from '@upstash/redis';
import { revalidateTag, unstable_cache } from 'next/cache';
import dbConnect from '@/lib/mongodb';
import User from '@/models/user';

const CACHE_TTL_SECONDS = 5 * 60;
const USER_CACHE_TAG = 'user:counts';

type CountCachePayload = {
  value: number;
  cachedAt: number;
};

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null;

function totalCountCacheKey() {
  return 'user:count:total';
}

function rankCountCacheKey(rank: string) {
  return `user:count:rank:${rank}`;
}

async function readCountFromRedis(key: string): Promise<number | null> {
  if (!redis) return null;

  try {
    const payload = await redis.get<CountCachePayload>(key);
    if (!payload || typeof payload.value !== 'number') return null;
    return payload.value;
  } catch {
    return null;
  }
}

async function writeCountToRedis(key: string, value: number): Promise<void> {
  if (!redis) return;

  const payload: CountCachePayload = {
    value,
    cachedAt: Date.now(),
  };

  try {
    await redis.set(key, payload, { ex: CACHE_TTL_SECONDS });
  } catch {
    // Redis is an optimization layer; ignore transient failures.
  }
}

const getTotalUserCountFromDb = unstable_cache(
  async () => {
    await dbConnect();
    return User.countDocuments({
      email: { $exists: true, $ne: null },
    });
  },
  ['user-count-total'],
  {
    revalidate: CACHE_TTL_SECONDS,
    tags: [USER_CACHE_TAG, totalCountCacheKey()],
  }
);

function getUserCountByRankFromDb(rank: string) {
  return unstable_cache(
    async () => {
      await dbConnect();
      return User.countDocuments({
        email: { $exists: true, $ne: null },
        rank,
      });
    },
    ['user-count-rank', rank],
    {
      revalidate: CACHE_TTL_SECONDS,
      tags: [USER_CACHE_TAG, rankCountCacheKey(rank)],
    }
  )();
}

/**
 * Get total count of users with email (cached for 5 minutes)
 * Used for rank calculations across the platform
 */
export async function getTotalUserCount(): Promise<number> {
  const cacheKey = totalCountCacheKey();
  const cached = await readCountFromRedis(cacheKey);
  if (cached !== null) return cached;

  const count = await getTotalUserCountFromDb();
  await writeCountToRedis(cacheKey, count);
  return count;
}

/**
 * Get count of users by rank (cached for 5 minutes)
 * Useful for calculating percentile ranks
 */
export async function getUserCountByRank(rank: string): Promise<number> {
  const cacheKey = rankCountCacheKey(rank);
  const cached = await readCountFromRedis(cacheKey);
  if (cached !== null) return cached;

  const count = await getUserCountByRankFromDb(rank);
  await writeCountToRedis(cacheKey, count);
  return count;
}

/**
 * Clear all user-related caches
 * Call this when user data changes significantly (e.g., after bulk updates)
 */
export async function clearUserCache(): Promise<void> {
  revalidateTag(USER_CACHE_TAG, 'max');

  if (!redis) return;

  try {
    const keys = await redis.keys('user:count:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Cache invalidation should not block writes.
  }
}

/**
 * Get cache statistics (useful for monitoring)
 */
export async function getCacheStats() {
  if (!redis) {
    return {
      backend: 'none',
      totalEntries: 0,
      keyPattern: 'user:count:*',
    };
  }

  try {
    const keys = await redis.keys('user:count:*');
    return {
      backend: 'upstash-redis',
      totalEntries: keys.length,
      keyPattern: 'user:count:*',
    };
  } catch {
    return {
      backend: 'upstash-redis',
      totalEntries: 0,
      keyPattern: 'user:count:*',
      unavailable: true,
    };
  }
}
