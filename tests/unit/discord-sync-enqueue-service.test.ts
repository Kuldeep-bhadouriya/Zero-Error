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

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => 'user-1' },
    rank: 'Contender',
    discordId: 'discord-1',
    discordSync: {
      linkStatus: 'linked_verified',
      verified: true,
      guildId: 'guild-1',
    },
    ...overrides,
  }
}

describe('discordSyncEnqueueService', () => {
  const envBackup = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env = { ...envBackup }
    process.env.DISCORD_SYNC_ENABLED = 'true'
    process.env.DISCORD_SYNC_DRY_RUN = 'false'
  })

  it('skips when rank did not change', async () => {
    const findGuildConfigs = vi.fn()

    vi.doMock('@/models/discordGuildConfig', () => ({
      default: { find: findGuildConfigs },
    }))
    vi.doMock('@/models/discordSyncJob', () => ({
      default: { findOne: vi.fn(), create: vi.fn() },
    }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { enqueueDiscordSyncJobsForRankChange } = await import(
      '@/lib/services/discordSyncEnqueueService'
    )

    const result = await enqueueDiscordSyncJobsForRankChange({
      user: makeUser(),
      previousRank: 'Contender',
      sourceEventId: 'mission-approve:sub-1',
    })

    expect(result.enqueuedCount).toBe(0)
    expect(result.skippedReasons).toContain('rank_unchanged')
    expect(findGuildConfigs).not.toHaveBeenCalled()
  })

  it('skips enqueue when global sync flag is disabled', async () => {
    process.env.DISCORD_SYNC_ENABLED = 'false'

    const findGuildConfigs = vi.fn()
    const createJob = vi.fn()

    vi.doMock('@/models/discordGuildConfig', () => ({
      default: { find: findGuildConfigs },
    }))
    vi.doMock('@/models/discordSyncJob', () => ({
      default: { findOne: vi.fn(), create: createJob },
    }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { enqueueDiscordSyncJobsForRankChange } = await import(
      '@/lib/services/discordSyncEnqueueService'
    )

    const result = await enqueueDiscordSyncJobsForRankChange({
      user: makeUser({ rank: 'Contender' }),
      previousRank: 'Rookie',
      sourceEventId: 'mission-approve:sub-1',
    })

    expect(result.enqueuedCount).toBe(0)
    expect(result.skippedReasons).toContain('sync_disabled_by_flag')
    expect(findGuildConfigs).not.toHaveBeenCalled()
    expect(createJob).not.toHaveBeenCalled()
  })

  it('skips enqueue when dry-run flag is enabled', async () => {
    process.env.DISCORD_SYNC_DRY_RUN = 'true'

    const findGuildConfigs = vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        {
          guildId: 'guild-1',
          rankRoleMappings: [
            { rank: 'Contender', roleId: 'role-contender', enabled: true },
          ],
        },
      ]),
    })

    const createJob = vi.fn()

    vi.doMock('@/models/discordGuildConfig', () => ({
      default: { find: findGuildConfigs },
    }))
    vi.doMock('@/models/discordSyncJob', () => ({
      default: { findOne: vi.fn().mockResolvedValue(null), create: createJob },
    }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { enqueueDiscordSyncJobsForRankChange } = await import(
      '@/lib/services/discordSyncEnqueueService'
    )

    const result = await enqueueDiscordSyncJobsForRankChange({
      user: makeUser({ rank: 'Contender' }),
      previousRank: 'Rookie',
      sourceEventId: 'mission-approve:sub-1',
    })

    expect(result.enqueuedCount).toBe(0)
    expect(result.skippedReasons).toContain('dry_run_enabled:guild-1')
    expect(createJob).not.toHaveBeenCalled()
  })

  it('skips when user is not verified linked', async () => {
    const findGuildConfigs = vi.fn()

    vi.doMock('@/models/discordGuildConfig', () => ({
      default: { find: findGuildConfigs },
    }))
    vi.doMock('@/models/discordSyncJob', () => ({
      default: { findOne: vi.fn(), create: vi.fn() },
    }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { enqueueDiscordSyncJobsForRankChange } = await import(
      '@/lib/services/discordSyncEnqueueService'
    )

    const result = await enqueueDiscordSyncJobsForRankChange({
      user: makeUser({
        discordSync: {
          linkStatus: 'linked_unverified',
          verified: false,
          guildId: 'guild-1',
        },
      }),
      previousRank: 'Rookie',
      sourceEventId: 'mission-approve:sub-1',
    })

    expect(result.enqueuedCount).toBe(0)
    expect(result.skippedReasons).toContain('user_not_verified_or_not_linked')
    expect(findGuildConfigs).not.toHaveBeenCalled()
  })

  it('enqueues a pending sync job when rank changed and mapping exists', async () => {
    const findGuildConfigs = vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        {
          guildId: 'guild-1',
          rankRoleMappings: [
            { rank: 'Contender', roleId: 'role-contender', enabled: true },
          ],
        },
      ]),
    })

    const createJob = vi.fn().mockResolvedValue({ _id: { toString: () => 'job-1' } })

    vi.doMock('@/models/discordGuildConfig', () => ({
      default: { find: findGuildConfigs },
    }))
    vi.doMock('@/models/discordSyncJob', () => ({
      default: { findOne: vi.fn().mockResolvedValue(null), create: createJob },
    }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { enqueueDiscordSyncJobsForRankChange } = await import(
      '@/lib/services/discordSyncEnqueueService'
    )

    const result = await enqueueDiscordSyncJobsForRankChange({
      user: makeUser({ rank: 'Contender' }),
      previousRank: 'Rookie',
      sourceEventId: 'mission-approve:sub-1',
    })

    expect(result.enqueuedCount).toBe(1)
    expect(createJob).toHaveBeenCalledOnce()
  })

  it('updates an active pending job instead of creating a new one', async () => {
    const findGuildConfigs = vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        {
          guildId: 'guild-1',
          rankRoleMappings: [{ rank: 'Vanguard', roleId: 'role-vanguard', enabled: true }],
        },
      ]),
    })

    const saveActiveJob = vi.fn().mockResolvedValue(undefined)
    const activeJob = {
      _id: { toString: () => 'job-active' },
      targetRank: 'Contender',
      targetRoleId: 'role-contender',
      discordId: 'discord-1',
      source: 'rank_change',
      correlationId: undefined,
      save: saveActiveJob,
    }

    const createJob = vi.fn()

    vi.doMock('@/models/discordGuildConfig', () => ({
      default: { find: findGuildConfigs },
    }))
    vi.doMock('@/models/discordSyncJob', () => ({
      default: {
        findOne: vi.fn().mockResolvedValue(activeJob),
        create: createJob,
      },
    }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { enqueueDiscordSyncJobsForRankChange } = await import(
      '@/lib/services/discordSyncEnqueueService'
    )

    const result = await enqueueDiscordSyncJobsForRankChange({
      user: makeUser({ rank: 'Vanguard' }),
      previousRank: 'Contender',
      sourceEventId: 'mission-approve:sub-99',
    })

    expect(result.updatedActiveCount).toBe(1)
    expect(saveActiveJob).toHaveBeenCalledOnce()
    expect(createJob).not.toHaveBeenCalled()
  })

  it('skips duplicate idempotency key collisions without throwing', async () => {
    const findGuildConfigs = vi.fn().mockReturnValue({
      lean: vi.fn().mockResolvedValue([
        {
          guildId: 'guild-1',
          rankRoleMappings: [{ rank: 'Contender', roleId: 'role-contender', enabled: true }],
        },
      ]),
    })

    const duplicateError = Object.assign(new Error('duplicate'), { code: 11000 })
    const createJob = vi.fn().mockRejectedValue(duplicateError)

    vi.doMock('@/models/discordGuildConfig', () => ({
      default: { find: findGuildConfigs },
    }))
    vi.doMock('@/models/discordSyncJob', () => ({
      default: { findOne: vi.fn().mockResolvedValue(null), create: createJob },
    }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { enqueueDiscordSyncJobsForRankChange } = await import(
      '@/lib/services/discordSyncEnqueueService'
    )

    const result = await enqueueDiscordSyncJobsForRankChange({
      user: makeUser({ rank: 'Contender' }),
      previousRank: 'Rookie',
      sourceEventId: 'mission-approve:sub-1',
    })

    expect(result.enqueuedCount).toBe(0)
    expect(result.skippedReasons.some((reason) => reason.startsWith('duplicate_idempotency:'))).toBe(true)
  })
})
