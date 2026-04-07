import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export type RateLimitRule = {
  prefix: string
  limit: number
  windowSeconds: number
}

export const RATE_LIMIT_RULES = {
  apiDefault: {
    prefix: 'rl:api:default',
    limit: 120,
    windowSeconds: 60,
  },
  apiAuth: {
    prefix: 'rl:api:auth',
    limit: 20,
    windowSeconds: 600,
  },
  apiContact: {
    prefix: 'rl:api:contact',
    limit: 5,
    windowSeconds: 600,
  },
  contactIp: {
    prefix: 'rl:contact:ip',
    limit: 3,
    windowSeconds: 600,
  },
  contactEmail: {
    prefix: 'rl:contact:email',
    limit: 2,
    windowSeconds: 3600,
  },
  apiDiscordLinkStart: {
    prefix: 'rl:api:user:discord:link:start',
    limit: 10,
    windowSeconds: 600,
  },
  apiDiscordLinkCallback: {
    prefix: 'rl:api:user:discord:link:callback',
    limit: 20,
    windowSeconds: 600,
  },
  apiDiscordUnlink: {
    prefix: 'rl:api:user:discord:unlink',
    limit: 10,
    windowSeconds: 600,
  },
  apiDiscordStatus: {
    prefix: 'rl:api:user:discord:status',
    limit: 60,
    windowSeconds: 60,
  },
  apiInternalDiscordSyncClaim: {
    prefix: 'rl:api:internal:discord-sync:claim',
    limit: 120,
    windowSeconds: 60,
  },
  apiInternalDiscordSyncComplete: {
    prefix: 'rl:api:internal:discord-sync:complete',
    limit: 120,
    windowSeconds: 60,
  },
  apiInternalDiscordSyncFail: {
    prefix: 'rl:api:internal:discord-sync:fail',
    limit: 120,
    windowSeconds: 60,
  },
  apiInternalDiscordSyncReconcile: {
    prefix: 'rl:api:internal:discord-sync:reconcile',
    limit: 30,
    windowSeconds: 60,
  },
} as const satisfies Record<string, RateLimitRule>

export type RateLimitRuleName = keyof typeof RATE_LIMIT_RULES

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

type RateLimitIdentityInput = {
  request?: Request
  userId?: string | null
  fallbackKey?: string
}

function normalizeKeyPart(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9:._-]/g, '_')
  return normalized.slice(0, 200) || 'unknown'
}

export function getRateLimitRule(name: RateLimitRuleName): RateLimitRule {
  return RATE_LIMIT_RULES[name]
}

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
  key?: string
  request?: Request
  userId?: string | null
  fallbackKey?: string
  prefix: string
  limit: number
  windowSeconds: number
}): Promise<RateLimitCheckResult> {
  const { key, request, userId, fallbackKey, prefix, limit, windowSeconds } = params
  const effectiveKey = key
    ? normalizeKeyPart(key)
    : buildRateLimitIdentity({ request, userId, fallbackKey })

  if (!redis) {
    return checkLocalRateLimit(`${prefix}:${effectiveKey}`, limit, windowSeconds)
  }

  const limiter = getOrCreateRateLimiter(prefix, limit, windowSeconds)
  const result = await limiter.limit(effectiveKey)

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  }
}

export function buildRateLimitIdentity(input: RateLimitIdentityInput = {}): string {
  const { request, userId, fallbackKey } = input

  if (userId && userId.trim().length > 0) {
    return `user:${normalizeKeyPart(userId)}`
  }

  if (request) {
    const ip = getClientIp(request)
    if (ip !== 'unknown') {
      return `ip:${normalizeKeyPart(ip)}`
    }

    const host = request.headers.get('host') || 'no-host'
    const userAgent = request.headers.get('user-agent') || 'no-user-agent'
    return `anon:${normalizeKeyPart(`${host}:${userAgent}`)}`
  }

  if (fallbackKey && fallbackKey.trim().length > 0) {
    return `fallback:${normalizeKeyPart(fallbackKey)}`
  }

  return 'anonymous:unknown'
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
