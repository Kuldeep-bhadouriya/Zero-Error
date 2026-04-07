import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import DiscordGuildConfig from '@/models/discordGuildConfig'
import DiscordSyncJob from '@/models/discordSyncJob'
import User from '@/models/user'
import {
  executeDiscordReconcile,
  listDiscordReconcileCandidates,
} from '@/lib/services/discordReconcileService'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './setup/mongodb'

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

describe('discord reconcile service DB integration', () => {
  beforeAll(async () => {
    await startTestDatabase()
  }, 120_000)

  afterEach(async () => {
    await clearTestDatabase()
  })

  afterAll(async () => {
    await stopTestDatabase()
  })

  it('lists reconcile candidates with expected role mappings', async () => {
    await Promise.all([DiscordGuildConfig.init(), DiscordSyncJob.init()])

    await DiscordGuildConfig.create({
      guildId: 'guild-1',
      enabled: true,
      rankRoleMappings: [
        { rank: 'Rookie', roleId: 'role-rookie', enabled: true },
        { rank: 'Contender', roleId: 'role-contender', enabled: true },
      ],
    })

    const eligibleUser = await User.create({
      email: 'reconcile-candidate@test.com',
      rank: 'Contender',
      discordId: 'discord-1',
      discordSync: {
        guildId: 'guild-1',
        linkStatus: 'linked_verified',
        verified: true,
      },
    })

    await User.create({
      email: 'reconcile-not-linked@test.com',
      rank: 'Rookie',
      discordSync: {
        guildId: 'guild-1',
        linkStatus: 'unlinked',
        verified: false,
      },
    })

    const result = await listDiscordReconcileCandidates({ guildId: 'guild-1' })

    expect(result.scannedUsers).toBe(1)
    expect(result.candidates).toHaveLength(1)
    expect(result.candidates[0]).toMatchObject({
      userId: eligibleUser._id.toString(),
      discordId: 'discord-1',
      expectedRank: 'Contender',
      expectedRoleId: 'role-contender',
    })
    expect(result.candidates[0].rankRoleIds).toEqual(['role-rookie', 'role-contender'])
  })

  it('queues correction jobs and avoids duplicates when an active job exists', async () => {
    await Promise.all([DiscordGuildConfig.init(), DiscordSyncJob.init()])

    await DiscordGuildConfig.create({
      guildId: 'guild-1',
      enabled: true,
      rankRoleMappings: [{ rank: 'Rookie', roleId: 'role-rookie', enabled: true }],
    })

    const user = await User.create({
      email: 'reconcile-enqueue@test.com',
      rank: 'Rookie',
      discordId: 'discord-2',
      discordSync: {
        guildId: 'guild-1',
        linkStatus: 'linked_verified',
        verified: true,
      },
    })

    const firstRun = await executeDiscordReconcile({
      guildId: 'guild-1',
      userId: user._id.toString(),
      dryRun: false,
      mode: 'targeted',
      correlationId: 'corr-first',
    })

    expect(firstRun.mode).toBe('targeted')
    expect(firstRun.queuedJobs).toBe(1)

    const secondRun = await executeDiscordReconcile({
      guildId: 'guild-1',
      userId: user._id.toString(),
      dryRun: false,
      mode: 'targeted',
      correlationId: 'corr-second',
    })

    expect(secondRun.queuedJobs).toBe(0)
    expect(secondRun.skippedActiveJob).toBe(1)

    const jobs = await DiscordSyncJob.find({ userId: user._id, guildId: 'guild-1' }).lean()
    expect(jobs).toHaveLength(1)
    expect(jobs[0].status).toBe('pending')
    expect(jobs[0].source).toBe('reconcile')
  })
})
