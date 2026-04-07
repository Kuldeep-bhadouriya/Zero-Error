import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import DiscordGuildConfig from '@/models/discordGuildConfig'
import DiscordSyncJob from '@/models/discordSyncJob'
import User from '@/models/user'
import { RANKS } from '@/lib/ranks'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './setup/mongodb'

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

describe('discord rank sync models DB integration', () => {
  beforeAll(async () => {
    await startTestDatabase()
  }, 120_000)

  afterEach(async () => {
    await clearTestDatabase()
  })

  afterAll(async () => {
    await stopTestDatabase()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps backward compatibility with existing discordId-only users', async () => {
    const user = await User.create({
      email: 'legacy-discord-id@test.com',
      discordId: '12345678901234567',
      zeCoins: 0,
      experience: 0,
      points: 0,
      rank: 'Rookie',
    })

    expect(user.discordId).toBe('12345678901234567')
    expect(user.discordSync?.linkStatus ?? 'unlinked').toBe('unlinked')
    expect(user.discordSync?.verified ?? false).toBe(false)
  })

  it('validates rank mappings using rank names from lib/ranks.ts', async () => {
    await expect(
      DiscordGuildConfig.create({
        guildId: 'guild-rank-validation',
        rankRoleMappings: [
          {
            rank: 'NotARank',
            roleId: 'role-invalid',
          },
        ],
      })
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('enforces one guild config per guildId', async () => {
    await DiscordGuildConfig.init()

    await DiscordGuildConfig.create({
      guildId: 'guild-unique-config',
      rankRoleMappings: [
        {
          rank: RANKS[0].name,
          roleId: 'role-rookie',
        },
      ],
    })

    await expect(
      DiscordGuildConfig.create({
        guildId: 'guild-unique-config',
        rankRoleMappings: [
          {
            rank: RANKS[1].name,
            roleId: 'role-contender',
          },
        ],
      })
    ).rejects.toMatchObject({ code: 11000 })
  })

  it('rejects duplicate rank mappings within a single guild config', async () => {
    await expect(
      DiscordGuildConfig.create({
        guildId: 'guild-duplicate-mappings',
        rankRoleMappings: [
          {
            rank: RANKS[0].name,
            roleId: 'role-a',
          },
          {
            rank: RANKS[0].name,
            roleId: 'role-b',
          },
        ],
      })
    ).rejects.toMatchObject({ name: 'ValidationError' })
  })

  it('enforces idempotency key uniqueness for sync jobs', async () => {
    await Promise.all([User.init(), DiscordSyncJob.init()])

    const user = await User.create({
      email: 'idempotency-user@test.com',
      discordId: 'discord-user-idempotency',
      zeCoins: 10,
      experience: 120,
      points: 120,
      rank: 'Contender',
    })

    await DiscordSyncJob.create({
      userId: user._id,
      guildId: 'guild-sync-jobs',
      discordId: user.discordId,
      targetRank: RANKS[1].name,
      targetRoleId: 'role-contender',
      status: 'pending',
      idempotencyKey: 'idem-key-1',
    })

    await expect(
      DiscordSyncJob.create({
        userId: user._id,
        guildId: 'guild-sync-jobs',
        discordId: user.discordId,
        targetRank: RANKS[1].name,
        targetRoleId: 'role-contender',
        status: 'pending',
        idempotencyKey: 'idem-key-1',
      })
    ).rejects.toMatchObject({ code: 11000 })
  })

  it('enforces single active pending/processing job per user and guild', async () => {
    await Promise.all([User.init(), DiscordSyncJob.init()])

    const user = await User.create({
      email: 'active-job-user@test.com',
      discordId: 'discord-user-active-job',
      zeCoins: 20,
      experience: 300,
      points: 300,
      rank: 'Gladiator',
    })

    await DiscordSyncJob.create({
      userId: user._id,
      guildId: 'guild-active-job',
      discordId: user.discordId,
      targetRank: RANKS[2].name,
      targetRoleId: 'role-gladiator',
      status: 'pending',
      idempotencyKey: 'active-idem-1',
    })

    await expect(
      DiscordSyncJob.create({
        userId: user._id,
        guildId: 'guild-active-job',
        discordId: user.discordId,
        targetRank: RANKS[3].name,
        targetRoleId: 'role-vanguard',
        status: 'processing',
        idempotencyKey: 'active-idem-2',
      })
    ).rejects.toMatchObject({ code: 11000 })

    await expect(
      DiscordSyncJob.create({
        userId: user._id,
        guildId: 'guild-active-job',
        discordId: user.discordId,
        targetRank: RANKS[3].name,
        targetRoleId: 'role-vanguard',
        status: 'completed',
        idempotencyKey: 'active-idem-3',
      })
    ).resolves.toBeTruthy()
  })
})
