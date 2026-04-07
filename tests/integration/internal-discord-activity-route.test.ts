import { beforeEach, describe, expect, it, vi } from 'vitest'
import crypto from 'crypto'

function createLoggerMock() {
  return {
    default: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
  }
}

function createRateLimitMock(success = true) {
  return {
    checkRateLimit: vi.fn().mockResolvedValue({
      success,
      limit: 120,
      remaining: success ? 119 : 0,
      reset: Math.ceil(Date.now() / 1000) + 60,
    }),
    getRateLimitRule: vi.fn().mockReturnValue({
      prefix: 'rl:test',
      limit: 120,
      windowSeconds: 60,
    }),
    buildRateLimitHeaders: vi.fn().mockReturnValue({
      'X-RateLimit-Limit': '120',
      'X-RateLimit-Remaining': success ? '119' : '0',
      'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + 60),
      'Retry-After': '60',
    }),
  }
}

function buildInternalHeaders(params: {
  method: string
  path: string
  body: string
  timestamp?: number
  nonce?: string
  token?: string
  secret?: string
  signatureOverride?: string
}) {
  const timestamp = params.timestamp ?? Math.floor(Date.now() / 1000)
  const nonce = params.nonce ?? `nonce-${Math.random().toString(36).slice(2)}`
  const token = params.token ?? 'internal-service-token'
  const secret = params.secret ?? 'internal-signing-secret'

  const bodyHash = crypto.createHash('sha256').update(params.body).digest('hex')
  const canonical = [String(timestamp), nonce, params.method.toUpperCase(), params.path, bodyHash].join('.')
  const signature =
    params.signatureOverride || crypto.createHmac('sha256', secret).update(canonical).digest('hex')

  return {
    'x-internal-service-token': token,
    'x-internal-timestamp': String(timestamp),
    'x-internal-nonce': nonce,
    'x-internal-signature': signature,
    'x-internal-service-name': 'discord-worker',
    'x-correlation-id': 'corr-activity-test',
  }
}

describe('internal discord activity ingest route', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth: vi.fn().mockResolvedValue(null) }))

    process.env.INTERNAL_SERVICE_TOKEN = 'internal-service-token'
    process.env.INTERNAL_SIGNING_SECRET = 'internal-signing-secret'
    process.env.INTERNAL_REQUEST_MAX_AGE_SECONDS = '300'
    process.env.DISCORD_ACTIVITY_POINTS_ENABLED = 'true'
  })

  it('rejects requests with invalid signature', async () => {
    vi.doMock('@/lib/logger', createLoggerMock)
    vi.doMock('@/lib/rate-limit', () => createRateLimitMock(true))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/lib/services/discordActivityIngestionService', () => ({
      ingestDiscordActivityEvent: vi.fn(),
    }))

    const { POST } = await import('@/app/api/internal/discord-activity/ingest/route')

    const body = JSON.stringify({
      sourceEventId: 'evt-1',
      discordId: 'discord-1',
      activityType: 'message_post',
      units: 1,
    })

    const path = '/api/internal/discord-activity/ingest'
    const headers = buildInternalHeaders({
      method: 'POST',
      path,
      body,
      signatureOverride: '00'.repeat(32),
    })

    const response = await POST(
      new Request(`http://localhost${path}`, {
        method: 'POST',
        body,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      }),
      {} as never
    )

    expect(response.status).toBe(401)
  })

  it('returns 429 when ingestion endpoint is rate limited', async () => {
    const rateLimitMock = createRateLimitMock(false)

    vi.doMock('@/lib/logger', createLoggerMock)
    vi.doMock('@/lib/rate-limit', () => rateLimitMock)
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/lib/services/discordActivityIngestionService', () => ({
      ingestDiscordActivityEvent: vi.fn(),
    }))

    const { POST } = await import('@/app/api/internal/discord-activity/ingest/route')

    const body = JSON.stringify({
      sourceEventId: 'evt-1',
      discordId: 'discord-1',
      activityType: 'message_post',
      units: 1,
    })

    const path = '/api/internal/discord-activity/ingest'
    const headers = buildInternalHeaders({ method: 'POST', path, body })

    const response = await POST(
      new Request(`http://localhost${path}`, {
        method: 'POST',
        body,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      }),
      {} as never
    )

    expect(response.status).toBe(429)
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Too many requests. Please try again later.',
    })
  })

  it('ingests event successfully on valid authenticated request', async () => {
    const ingestDiscordActivityEvent = vi.fn().mockResolvedValue({
      sourceEventId: 'evt-1',
      status: 'applied',
      pointsRequested: 2,
      pointsAwarded: 2,
      duplicate: false,
      userId: 'user-1',
      rankChanged: false,
      rankBefore: 'Rookie',
      rankAfter: 'Rookie',
      reason: null,
    })

    vi.doMock('@/lib/logger', createLoggerMock)
    vi.doMock('@/lib/rate-limit', () => createRateLimitMock(true))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/lib/services/discordActivityIngestionService', () => ({
      ingestDiscordActivityEvent,
    }))

    const { POST } = await import('@/app/api/internal/discord-activity/ingest/route')

    const body = JSON.stringify({
      sourceEventId: 'evt-1',
      discordId: 'discord-1',
      activityType: 'message_post',
      units: 1,
    })

    const path = '/api/internal/discord-activity/ingest'
    const headers = buildInternalHeaders({ method: 'POST', path, body })

    const response = await POST(
      new Request(`http://localhost${path}`, {
        method: 'POST',
        body,
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      }),
      {} as never
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.data.status).toBe('applied')
    expect(ingestDiscordActivityEvent).toHaveBeenCalledOnce()
  })
})
