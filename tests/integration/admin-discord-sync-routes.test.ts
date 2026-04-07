import { beforeEach, describe, expect, it, vi } from 'vitest'

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

describe('admin discord sync routes', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.DISCORD_RECONCILE_ENABLED = 'true'
  })

  it('blocks failed jobs listing for non-admin users', async () => {
    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', roles: ['user'] } }),
    }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { GET } = await import('@/app/api/admin/discord-sync/jobs/failed/route')

    const response = await GET(
      new Request('http://localhost/api/admin/discord-sync/jobs/failed'),
      {} as never
    )

    expect(response.status).toBe(401)
  })

  it('lists failed and dead-letter jobs for admin users', async () => {
    const findJobs = vi.fn().mockReturnValue({
      sort: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              _id: { toString: () => 'job-1' },
              userId: { toString: () => 'user-1' },
              guildId: 'guild-1',
              discordId: 'discord-1',
              status: 'failed',
              source: 'rank_change',
              targetRank: 'Contender',
              targetRoleId: 'role-1',
              attemptCount: 2,
              maxAttempts: 5,
              lastError: 'Role not found',
              lastErrorCode: 'discord_api_10011',
              nextRetryAt: null,
              failedAt: new Date('2026-04-03T10:00:00.000Z'),
              updatedAt: new Date('2026-04-03T10:05:00.000Z'),
            },
          ]),
        }),
      }),
    })

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue({ user: { id: 'admin-1', roles: ['admin'] } }),
    }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/discordSyncJob', () => ({ default: { find: findJobs } }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { GET } = await import('@/app/api/admin/discord-sync/jobs/failed/route')

    const response = await GET(
      new Request('http://localhost/api/admin/discord-sync/jobs/failed?limit=20'),
      {} as never
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.total).toBe(1)
    expect(payload.jobs[0]).toMatchObject({
      id: 'job-1',
      status: 'failed',
      guildId: 'guild-1',
    })
    expect(findJobs).toHaveBeenCalledWith({
      status: { $in: ['failed', 'dead_letter'] },
    })
  })

  it('retries failed job for admin users', async () => {
    const findOneAndUpdate = vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        status: 'pending',
      }),
    })

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue({ user: { id: 'admin-1', roles: ['admin'] } }),
    }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/discordSyncJob', () => ({ default: { findOneAndUpdate } }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { POST } = await import('@/app/api/admin/discord-sync/jobs/[jobId]/retry/route')

    const response = await POST(
      new Request('http://localhost/api/admin/discord-sync/jobs/507f1f77bcf86cd799439011/retry', {
        method: 'POST',
      }),
      { params: Promise.resolve({ jobId: '507f1f77bcf86cd799439011' }) } as never
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: {
        jobId: '507f1f77bcf86cd799439011',
        status: 'pending',
      },
    })
  })

  it('triggers admin reconcile dry-run successfully', async () => {
    const executeDiscordReconcile = vi.fn().mockResolvedValue({
      dryRun: true,
      guildId: 'guild-1',
      scopedUserId: null,
      eligibleCount: 5,
      mappedUsers: 4,
      queuedJobs: 0,
      skippedActiveJob: 1,
      skippedMissingMapping: 1,
    })

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue({ user: { id: 'admin-1', roles: ['admin'] } }),
    }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/lib/services/discordReconcileService', () => ({ executeDiscordReconcile }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { POST } = await import('@/app/api/admin/discord-sync/reconcile/route')

    const response = await POST(
      new Request('http://localhost/api/admin/discord-sync/reconcile', {
        method: 'POST',
        body: JSON.stringify({ guildId: 'guild-1', dryRun: true }),
      }),
      {} as never
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.data).toMatchObject({
      dryRun: true,
      guildId: 'guild-1',
      eligibleCount: 5,
      queuedJobs: 0,
    })
  })

  it('returns 503 when reconcile is disabled by feature flag', async () => {
    process.env.DISCORD_RECONCILE_ENABLED = 'false'

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue({ user: { id: 'admin-1', roles: ['admin'] } }),
    }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { POST } = await import('@/app/api/admin/discord-sync/reconcile/route')

    const response = await POST(
      new Request('http://localhost/api/admin/discord-sync/reconcile', {
        method: 'POST',
        body: JSON.stringify({ guildId: 'guild-1', dryRun: true }),
      }),
      {} as never
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Reconciliation is disabled by feature flag',
    })
  })
})
