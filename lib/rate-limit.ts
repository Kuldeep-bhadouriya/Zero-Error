import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type RateLimitCheckResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

type LocalBucket = {
  count: number
  resetAtMs: number
}

const localStore = new Map<string, LocalBucket>()

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? Redis.fromEnv()
    : null

const ratelimiters = new Map<string, Ratelimit>()

function getOrCreateRateLimiter(prefix: string, limit: number, windowSeconds: number) {
  const cacheKey = `${prefix}:${limit}:${windowSeconds}`
  const existing = ratelimiters.get(cacheKey)
  if (existing) {
    return existing
  }

  const created = new Ratelimit({
    redis: redis!,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    prefix,
  })

  ratelimiters.set(cacheKey, created)
  return created
}

function checkLocalRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitCheckResult {
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const existing = localStore.get(key)

  if (!existing || existing.resetAtMs <= now) {
    const resetAtMs = now + windowMs
    localStore.set(key, { count: 1, resetAtMs })
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - 1),
      reset: Math.ceil(resetAtMs / 1000),
    }
  }

  const nextCount = existing.count + 1
  existing.count = nextCount
  localStore.set(key, existing)

  return {
    success: nextCount <= limit,
    limit,
    remaining: Math.max(0, limit - nextCount),
    reset: Math.ceil(existing.resetAtMs / 1000),
  }
}

export async function checkRateLimit(params: {
  key: string
  prefix: string
  limit: number
  windowSeconds: number
}): Promise<RateLimitCheckResult> {
  const { key, prefix, limit, windowSeconds } = params

  if (!redis) {
    return checkLocalRateLimit(`${prefix}:${key}`, limit, windowSeconds)
  }

  const limiter = getOrCreateRateLimiter(prefix, limit, windowSeconds)
  const result = await limiter.limit(key)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim()
    if (firstIp) {
      return firstIp
    }
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return 'unknown'
}

export function buildRateLimitHeaders(result: RateLimitCheckResult): HeadersInit {
  const retryAfter = Math.max(0, result.reset - Math.ceil(Date.now() / 1000))

  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
    'Retry-After': String(retryAfter),
  }
}
