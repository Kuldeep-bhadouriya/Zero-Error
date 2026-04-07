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
    'x-correlation-id': 'corr-test-1',
  }
}

function createRateLimitMock() {
  return {
    checkRateLimit: vi.fn().mockResolvedValue({
      success: true,
      limit: 120,
      remaining: 119,
      reset: Math.ceil(Date.now() / 1000) + 60,
    }),
    getRateLimitRule: vi.fn().mockReturnValue({
      prefix: 'rl:test',
      limit: 120,
      windowSeconds: 60,
    }),
    buildRateLimitHeaders: vi.fn().mockReturnValue({
      'X-RateLimit-Limit': '120',
      'X-RateLimit-Remaining': '119',
      'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + 60),
      'Retry-After': '60',
    }),
  }
}

describe('internal discord sync routes', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()

    process.env.INTERNAL_SERVICE_TOKEN = 'internal-service-token'
    process.env.INTERNAL_SIGNING_SECRET = 'internal-signing-secret'
    process.env.INTERNAL_REQUEST_MAX_AGE_SECONDS = '300'
  })

  it('rejects unauthorized request without service headers', async () => {
    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth: vi.fn().mockResolvedValue(null) }))
    vi.doMock('@/lib/logger', createLoggerMock)
    vi.doMock('@/lib/rate-limit', () => createRateLimitMock())
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/discordSyncJob', () => ({ default: { findOneAndUpdate: vi.fn() } }))

    const { POST } = await import('@/app/api/internal/discord-sync/jobs/claim/route')

    const body = JSON.stringify({ workerId: 'worker-1', limit: 1 })
    const response = await POST(
      new Request('http://localhost/api/internal/discord-sync/jobs/claim', {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/json' },
      }),
      {} as never
    )

    expect(response.status).toBe(401)
  })

  it('rejects claim request when signature is invalid', async () => {
    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth: vi.fn().mockResolvedValue(null) }))
    vi.doMock('@/lib/logger', createLoggerMock)
    vi.doMock('@/lib/rate-limit', () => createRateLimitMock())
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/discordSyncJob', () => ({ default: { findOneAndUpdate: vi.fn() } }))

    const { POST } = await import('@/app/api/internal/discord-sync/jobs/claim/route')

    const body = JSON.stringify({ workerId: 'worker-1', limit: 1 })
    const headers = buildInternalHeaders({
      method: 'POST',
      path: '/api/internal/discord-sync/jobs/claim',
      body,
      signatureOverride: '00'.repeat(32),
    })

    const response = await POST(
      new Request('http://localhost/api/internal/discord-sync/jobs/claim', {
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

  it('rejects claim request with expired timestamp', async () => {
    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth: vi.fn().mockResolvedValue(null) }))
    vi.doMock('@/lib/logger', createLoggerMock)
    vi.doMock('@/lib/rate-limit', () => createRateLimitMock())
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/discordSyncJob', () => ({ default: { findOneAndUpdate: vi.fn() } }))

    const { POST } = await import('@/app/api/internal/discord-sync/jobs/claim/route')

    const body = JSON.stringify({ workerId: 'worker-1', limit: 1 })
    const headers = buildInternalHeaders({
      method: 'POST',
      path: '/api/internal/discord-sync/jobs/claim',
      body,
      timestamp: Math.floor(Date.now() / 1000) - 1000,
    })

    const response = await POST(
      new Request('http://localhost/api/internal/discord-sync/jobs/claim', {
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
    await expect(response.json()).resolves.toMatchObject({
      error: 'Request timestamp expired',
      success: false,
    })
  })

  it('claims jobs successfully with valid service signature', async () => {
    const findOneAndUpdate = vi
      .fn()
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue({
          _id: 'job-1',
          userId: 'user-1',
          guildId: 'guild-1',
          discordId: 'discord-1',
          targetRank: 'Rookie',
          targetRoleId: 'role-1',
          source: 'rank_change',
          attemptCount: 1,
          maxAttempts: 5,
          idempotencyKey: 'idem-1',
          claimedAt: new Date(),
          correlationId: 'corr-test-1',
        }),
      })
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue(null),
      })

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth: vi.fn().mockResolvedValue(null) }))
    vi.doMock('@/lib/logger', createLoggerMock)
    vi.doMock('@/lib/rate-limit', () => createRateLimitMock())
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/discordGuildConfig', () => ({
      default: {
        find: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              guildId: 'guild-1',
              rankRoleMappings: [{ rank: 'Rookie', roleId: 'role-1', enabled: true }],
            },
          ]),
        }),
      },
    }))
    vi.doMock('@/models/discordSyncJob', () => ({ default: { findOneAndUpdate } }))

    const { POST } = await import('@/app/api/internal/discord-sync/jobs/claim/route')

    const body = JSON.stringify({ workerId: 'worker-1', limit: 1 })
    const headers = buildInternalHeaders({
      method: 'POST',
      path: '/api/internal/discord-sync/jobs/claim',
      body,
    })

    const response = await POST(
      new Request('http://localhost/api/internal/discord-sync/jobs/claim', {
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
    expect(payload.data.claimedCount).toBe(1)
  })

  it('marks processing job complete on success path', async () => {
    const findOneAndUpdate = vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        status: 'completed',
        completedAt: new Date(),
      }),
    })

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth: vi.fn().mockResolvedValue(null) }))
    vi.doMock('@/lib/logger', createLoggerMock)
    vi.doMock('@/lib/rate-limit', () => createRateLimitMock())
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/discordSyncJob', () => ({ default: { findOneAndUpdate } }))

    const { POST } = await import('@/app/api/internal/discord-sync/jobs/[jobId]/complete/route')

    const body = JSON.stringify({ note: 'Role sync applied' })
    const path = '/api/internal/discord-sync/jobs/507f1f77bcf86cd799439011/complete'
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
      { params: Promise.resolve({ jobId: '507f1f77bcf86cd799439011' }) } as never
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.data.status).toBe('completed')
  })

  it('marks processing job fail on success path', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const findOne = vi.fn().mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      status: 'processing',
      attemptCount: 1,
      maxAttempts: 5,
      save,
    })

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth: vi.fn().mockResolvedValue(null) }))
    vi.doMock('@/lib/logger', createLoggerMock)
    vi.doMock('@/lib/rate-limit', () => createRateLimitMock())
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/discordSyncJob', () => ({ default: { findOne } }))

    const { POST } = await import('@/app/api/internal/discord-sync/jobs/[jobId]/fail/route')

    const body = JSON.stringify({ error: 'discord-member-not-found', retryDelaySeconds: 120 })
    const path = '/api/internal/discord-sync/jobs/507f1f77bcf86cd799439011/fail'
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
      { params: Promise.resolve({ jobId: '507f1f77bcf86cd799439011' }) } as never
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.data.status).toBe('failed')
    expect(save).toHaveBeenCalledOnce()
  })

  it('executes reconcile endpoint success path in dry-run mode', async () => {
    const guildFindOne = vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        guildId: 'guild-1',
        rankRoleMappings: [
          { rank: 'Rookie', roleId: 'role-1', enabled: true },
          { rank: 'Contender', roleId: 'role-2', enabled: true },
        ],
      }),
    })

    const userFind = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue([
          { _id: 'u1', discordId: 'd1', rank: 'Rookie' },
          { _id: 'u2', discordId: 'd2', rank: 'Contender' },
        ]),
      }),
    })

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth: vi.fn().mockResolvedValue(null) }))
    vi.doMock('@/lib/logger', createLoggerMock)
    vi.doMock('@/lib/rate-limit', () => createRateLimitMock())
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/discordGuildConfig', () => ({ default: { findOne: guildFindOne } }))
    vi.doMock('@/models/user', () => ({ default: { find: userFind } }))
    vi.doMock('@/models/discordSyncJob', () => ({ default: { exists: vi.fn(), create: vi.fn() } }))

    const { POST } = await import('@/app/api/internal/discord-sync/reconcile/route')

    const body = JSON.stringify({ guildId: 'guild-1', dryRun: true })
    const path = '/api/internal/discord-sync/reconcile'
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
    expect(payload.data.dryRun).toBe(true)
    expect(payload.data.eligibleCount).toBe(2)
    expect(payload.data.mappedUsers).toBe(2)
  })
})
