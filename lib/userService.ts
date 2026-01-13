import User from '@/models/user';

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Get a value from cache if it exists and hasn't expired
 */
function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  const now = Date.now();
  if (now - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Set a value in cache with current timestamp
 */
function setInCache<T>(key: string, data: T): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Get total count of users with email (cached for 5 minutes)
 * Used for rank calculations across the platform
 */
export async function getTotalUserCount(): Promise<number> {
  const cacheKey = 'user:count:total';
  
  // Try to get from cache first
  const cached = getFromCache<number>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // If not in cache, query database
  const count = await User.countDocuments({ 
    email: { $exists: true, $ne: null } 
  });

  // Store in cache
  setInCache(cacheKey, count);

  return count;
}

/**
 * Get count of users by rank (cached for 5 minutes)
 * Useful for calculating percentile ranks
 */
export async function getUserCountByRank(rank: string): Promise<number> {
  const cacheKey = `user:count:rank:${rank}`;
  
  // Try to get from cache first
  const cached = getFromCache<number>(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // If not in cache, query database
  const count = await User.countDocuments({ 
    email: { $exists: true, $ne: null },
    rank 
  });

  // Store in cache
  setInCache(cacheKey, count);

  return count;
}

/**
 * Clear all user-related caches
 * Call this when user data changes significantly (e.g., after bulk updates)
 */
export function clearUserCache(): void {
  const keysToDelete: string[] = [];
  
  cache.forEach((_, key) => {
    if (key.startsWith('user:')) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => cache.delete(key));
}

/**
 * Get cache statistics (useful for monitoring)
 */
export function getCacheStats() {
  const now = Date.now();
  const stats = {
    totalEntries: cache.size,
    validEntries: 0,
    expiredEntries: 0,
  };

  cache.forEach((entry) => {
    if (now - entry.timestamp > CACHE_TTL) {
      stats.expiredEntries++;
    } else {
      stats.validEntries++;
    }
  });

  return stats;
}
