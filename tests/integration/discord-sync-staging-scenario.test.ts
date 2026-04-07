import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import DiscordGuildConfig from '@/models/discordGuildConfig'
import DiscordSyncJob from '@/models/discordSyncJob'
import Mission from '@/models/mission'
import MissionSubmission from '@/models/missionSubmission'
import User from '@/models/user'
import { verifyMissionSubmission } from '@/lib/services/missionService'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './setup/mongodb'

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

vi.mock('discord.js', () => {
  class DiscordApiError extends Error {
    code: number
    constructor(message: string, code: number) {
      super(message)
      this.code = code
    }
  }

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
    DiscordAPIError: DiscordApiError,
    GatewayIntentBits: { Guilds: 1, GuildMembers: 2 },
    RESTEvents: { RateLimited: 'rateLimited' },
  }
})

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/userService', () => ({
  clearUserCache: vi.fn().mockResolvedValue(undefined),
}))

describe('discord sync staging scenario', () => {
  beforeAll(async () => {
    await startTestDatabase()
  }, 120_000)

  afterEach(async () => {
    await clearTestDatabase()
    vi.clearAllMocks()
  })

  afterAll(async () => {
    await stopTestDatabase()
  })

  beforeEach(() => {
    process.env.DISCORD_SYNC_ENABLED = 'true'
    process.env.DISCORD_SYNC_DRY_RUN = 'false'
  })

  it('covers link, rank-change enqueue, and role update flow', async () => {
    await Promise.all([DiscordGuildConfig.init(), DiscordSyncJob.init()])

    await DiscordGuildConfig.create({
      guildId: 'guild-1',
      enabled: true,
      rankRoleMappings: [
        { rank: 'Rookie', roleId: 'role-rookie', enabled: true },
        { rank: 'Contender', roleId: 'role-contender', enabled: true },
      ],
    })

    const user = await User.create({
      email: 'staging-flow@test.com',
      rank: 'Rookie',
      points: 60,
      experience: 60,
      zeCoins: 0,
      discordSync: {
        linkStatus: 'unlinked',
        verified: false,
        lastSyncStatus: 'idle',
      },
    })

    // Simulate successful Discord link before rank progression.
    user.discordId = 'discord-1'
    user.discordUsername = 'staging-user'
    user.discordSync = {
      guildId: 'guild-1',
      linkStatus: 'linked_verified',
      verified: true,
      lastSyncStatus: 'idle',
    } as any
    await user.save()

    const mission = await Mission.create({
      name: 'Staging Rank Push',
      description: 'Increase points over contender threshold',
      points: 50,
      category: 'General',
      instructions: 'Complete task',
      active: true,
      currentCompletions: 0,
    })

    const submission = await MissionSubmission.create({
      user: user._id,
      mission: mission._id,
      proof: 'https://example.com/staging-proof.png',
      status: 'pending',
    })

    const verificationResult = await verifyMissionSubmission({
      submissionId: submission._id.toString(),
      status: 'approved',
      adminUserId: user._id.toString(),
    })

    expect(verificationResult.status).toBe(200)

    const queuedJobsRaw = await DiscordSyncJob.find({ userId: user._id, status: 'pending' }).lean()
    const queuedJobs = queuedJobsRaw as unknown as Array<{
      _id: { toString(): string }
      userId: { toString(): string }
      guildId: string
      discordId: string
      targetRank: string
      targetRoleId: string
      source: string
      attemptCount: number
      maxAttempts: number
      idempotencyKey: string
      correlationId?: string
    }>
    expect(queuedJobs).toHaveLength(1)
    expect(queuedJobs[0].targetRank).toBe('Contender')
    expect(queuedJobs[0].targetRoleId).toBe('role-contender')

    const removeRolesMock = vi.fn().mockResolvedValue(undefined)
    const addRoleMock = vi.fn().mockResolvedValue(undefined)

    fetchGuildMock.mockResolvedValue({
      members: {
        fetch: vi.fn().mockResolvedValue({
          roles: {
            cache: new Map<string, { id: string }>([['role-rookie', { id: 'role-rookie' }]]),
            remove: removeRolesMock,
            add: addRoleMock,
          },
        }),
      },
    })

    const { DiscordRoleSyncWorker } = await import('@/bot/src/discordRoleSyncWorker')

    const apiClient = {
      claimJobs: vi.fn(),
      completeJob: vi.fn().mockResolvedValue(undefined),
      failJob: vi.fn().mockResolvedValue(undefined),
      scanReconcileCandidates: vi.fn(),
      executeReconcile: vi.fn(),
    }

    const worker = new DiscordRoleSyncWorker(
      {
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
        reconcileScanLimit: 100,
        logLevel: 'info',
      },
      apiClient as any,
      {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
      } as any
    )

    await worker.start({ startLoop: false })
    await (worker as unknown as {
      processJob: (job: {
        id: string
        userId: string
        guildId: string
        discordId: string
        targetRank: string
        targetRoleId: string
        source: string
        attemptCount: number
        maxAttempts: number
        idempotencyKey: string
        correlationId?: string
        rankRoleIds?: string[]
      }) => Promise<void>
    }).processJob({
      id: queuedJobs[0]._id.toString(),
      userId: queuedJobs[0].userId.toString(),
      guildId: queuedJobs[0].guildId,
      discordId: queuedJobs[0].discordId,
      targetRank: queuedJobs[0].targetRank,
      targetRoleId: queuedJobs[0].targetRoleId,
      source: queuedJobs[0].source,
      attemptCount: queuedJobs[0].attemptCount,
      maxAttempts: queuedJobs[0].maxAttempts,
      idempotencyKey: queuedJobs[0].idempotencyKey,
      correlationId: queuedJobs[0].correlationId,
      rankRoleIds: ['role-rookie', 'role-contender'],
    })

    expect(removeRolesMock).toHaveBeenCalledOnce()
    expect(addRoleMock).toHaveBeenCalledOnce()
    expect(apiClient.completeJob).toHaveBeenCalledOnce()
  })
})
