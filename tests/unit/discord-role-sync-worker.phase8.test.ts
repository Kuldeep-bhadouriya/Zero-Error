import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorkerConfig } from '@/bot/src/config'
import { DiscordRoleSyncWorker } from '@/bot/src/discordRoleSyncWorker'
import type { ClaimedSyncJob } from '@/bot/src/types'

const loginMock = vi.fn().mockResolvedValue('token')
const onceMock = vi.fn((event: string, callback: () => void) => {
  if (event === 'ready') {
    callback()
  }
})
const destroyMock = vi.fn()
const fetchGuildMock = vi.fn()
const clientErrorOnMock = vi.fn()
const restOnMock = vi.fn()
const { MockDiscordApiError } = vi.hoisted(() => {
  class LocalMockDiscordApiError extends Error {
    code: number

    constructor(message: string, code: number) {
      super(message)
      this.code = code
    }
  }

  return { MockDiscordApiError: LocalMockDiscordApiError }
})

vi.mock('discord.js', () => {
  return {
    Client: class {
      public guilds = { fetch: fetchGuildMock }
      public rest = { on: restOnMock }
      public user = { tag: 'test#0001' }
      public on = clientErrorOnMock
      public once = onceMock
      public login = loginMock
      public destroy = destroyMock
      public isReady = () => true
    },
    DiscordAPIError: MockDiscordApiError,
    GatewayIntentBits: { Guilds: 1, GuildMembers: 2 },
    RESTEvents: { RateLimited: 'rateLimited' },
  }
})

function makeConfig(overrides: Partial<WorkerConfig> = {}): WorkerConfig {
  return {
    discordBotToken: 'token',
    internalApiBaseUrl: 'http://localhost:3000',
    internalServiceToken: 'svc-token',
    internalSigningSecret: 'signing-secret',
    syncEnabled: true,
    syncDryRun: false,
    workerId: 'worker-1',
    serviceName: 'discord-sync-worker',
    guildId: 'guild-1',
    claimBatchSize: 1,
    pollIntervalMs: 1,
    actionDelayMs: 0,
    retryBaseSeconds: 30,
    retryMaxSeconds: 300,
    claimErrorBackoffMs: 5,
    reconcileEnabled: false,
    reconcileIntervalMs: 300000,
    reconcileDryRun: false,
    reconcileScanLimit: 500,
    logLevel: 'info',
    ...overrides,
  }
}

function makeJob(overrides: Partial<ClaimedSyncJob> = {}): ClaimedSyncJob {
  return {
    id: 'job-1',
    userId: 'user-1',
    guildId: 'guild-1',
    discordId: 'discord-1',
    targetRank: 'Contender',
    targetRoleId: 'role-contender',
    source: 'rank_change',
    attemptCount: 1,
    maxAttempts: 5,
    idempotencyKey: 'idem-1',
    correlationId: 'corr-job-1',
    rankRoleIds: ['role-rookie', 'role-contender'],
    ...overrides,
  }
}

function makeLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }
}

describe('discord role sync worker phase 8 hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not mutate Discord roles when global dry-run is enabled', async () => {
    const addRoleMock = vi.fn().mockResolvedValue(undefined)
    const removeRolesMock = vi.fn().mockResolvedValue(undefined)
    const fetchMemberMock = vi.fn().mockResolvedValue({
      roles: {
        cache: new Map<string, { id: string }>([['role-rookie', { id: 'role-rookie' }]]),
        add: addRoleMock,
        remove: removeRolesMock,
      },
    })

    fetchGuildMock.mockResolvedValue({ members: { fetch: fetchMemberMock } })

    const apiClient = {
      claimJobs: vi.fn(),
      completeJob: vi.fn().mockResolvedValue(undefined),
      failJob: vi.fn().mockResolvedValue(undefined),
      scanReconcileCandidates: vi.fn(),
      executeReconcile: vi.fn(),
    }

    const logger = makeLogger()
    const worker = new DiscordRoleSyncWorker(makeConfig({ syncDryRun: true }), apiClient as any, logger as any)

    await worker.start({ startLoop: false })
    await (worker as unknown as { processJob: (job: ClaimedSyncJob) => Promise<void> }).processJob(
      makeJob()
    )

    expect(removeRolesMock).not.toHaveBeenCalled()
    expect(addRoleMock).not.toHaveBeenCalled()
    expect(apiClient.completeJob).toHaveBeenCalledOnce()
  })

  it('marks member-not-found failures as dead-letter candidates', async () => {
    fetchGuildMock.mockResolvedValue({
      members: {
        fetch: vi.fn().mockRejectedValue(new MockDiscordApiError('Unknown Member', 10007)),
      },
    })

    const apiClient = {
      claimJobs: vi.fn(),
      completeJob: vi.fn(),
      failJob: vi.fn().mockResolvedValue(undefined),
      scanReconcileCandidates: vi.fn(),
      executeReconcile: vi.fn(),
    }

    const logger = makeLogger()
    const worker = new DiscordRoleSyncWorker(makeConfig(), apiClient as any, logger as any)

    await worker.start({ startLoop: false })
    await (worker as unknown as { processJob: (job: ClaimedSyncJob) => Promise<void> }).processJob(
      makeJob()
    )

    expect(apiClient.failJob).toHaveBeenCalledOnce()
    expect(apiClient.failJob).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          deadLetter: true,
          errorCode: 'discord_api_10007',
        }),
      })
    )
  })

  it('runs staging-like targeted reconciliation and enqueues corrective action for drift', async () => {
    fetchGuildMock.mockResolvedValue({
      members: {
        fetch: vi.fn().mockResolvedValue({
          roles: {
            cache: new Map<string, { id: string }>([['role-rookie', { id: 'role-rookie' }]]),
          },
        }),
      },
    })

    const apiClient = {
      claimJobs: vi.fn(),
      completeJob: vi.fn(),
      failJob: vi.fn(),
      scanReconcileCandidates: vi.fn().mockResolvedValue({
        guildId: 'guild-1',
        scopedUserId: 'user-1',
        scannedUsers: 1,
        skippedMissingMapping: 0,
        candidates: [
          {
            userId: 'user-1',
            discordId: 'discord-1',
            guildId: 'guild-1',
            expectedRank: 'Contender',
            expectedRoleId: 'role-contender',
            rankRoleIds: ['role-rookie', 'role-contender'],
          },
        ],
      }),
      executeReconcile: vi.fn().mockResolvedValue({
        mode: 'targeted',
        dryRun: false,
        guildId: 'guild-1',
        scopedUserId: 'user-1',
        eligibleCount: 1,
        mappedUsers: 1,
        queuedJobs: 1,
        skippedActiveJob: 0,
        skippedMissingMapping: 0,
      }),
    }

    const logger = makeLogger()
    const worker = new DiscordRoleSyncWorker(makeConfig(), apiClient as any, logger as any)

    await worker.start({ startLoop: false })
    const metrics = await worker.runReconciliationCycle({
      mode: 'targeted',
      dryRun: false,
      targetUserId: 'user-1',
      correlationId: 'corr-reconcile-targeted',
    })

    expect(metrics).toMatchObject({
      mode: 'targeted',
      scannedUsers: 1,
      mismatchesFound: 1,
      correctedCount: 1,
      failedCount: 0,
    })
    expect(apiClient.executeReconcile).toHaveBeenCalledWith(
      expect.objectContaining({
        guildId: 'guild-1',
        userId: 'user-1',
        dryRun: false,
        mode: 'targeted',
      })
    )
  })
})
