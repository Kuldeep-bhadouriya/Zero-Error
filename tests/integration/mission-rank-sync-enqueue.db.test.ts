import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import DiscordGuildConfig from '@/models/discordGuildConfig'
import DiscordSyncJob from '@/models/discordSyncJob'
import Mission from '@/models/mission'
import MissionSubmission from '@/models/missionSubmission'
import User from '@/models/user'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './setup/mongodb'

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/userService', () => ({
  clearUserCache: vi.fn().mockResolvedValue(undefined),
}))

describe('mission rank-change Discord sync enqueue DB integration', () => {
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

  it('enqueues sync job after approval when rank changes for verified linked user', async () => {
    const { verifyMissionSubmission } = await import('@/lib/services/missionService')

    await Promise.all([DiscordGuildConfig.init(), DiscordSyncJob.init()])

    await DiscordGuildConfig.create({
      guildId: 'guild-1',
      enabled: true,
      rankRoleMappings: [
        { rank: 'Contender', roleId: 'role-contender', enabled: true },
        { rank: 'Rookie', roleId: 'role-rookie', enabled: true },
      ],
    })

    const user = await User.create({
      email: 'rank-change-approve@test.com',
      discordId: 'discord-user-1',
      zeCoins: 0,
      experience: 60,
      points: 60,
      rank: 'Rookie',
      discordSync: {
        guildId: 'guild-1',
        linkStatus: 'linked_verified',
        verified: true,
        lastSyncStatus: 'idle',
      },
    })

    const mission = await Mission.create({
      name: 'Rank Push Mission',
      description: 'Cross the contender threshold',
      points: 50,
      category: 'QA',
      instructions: 'Do work',
      active: true,
      currentCompletions: 0,
    })

    const submission = await MissionSubmission.create({
      user: user._id,
      mission: mission._id,
      proof: 'https://example.com/rank-change.png',
      status: 'pending',
    })

    const result = await verifyMissionSubmission({
      submissionId: submission._id.toString(),
      status: 'approved',
      adminUserId: new mongoose.Types.ObjectId().toString(),
    })

    expect(result.status).toBe(200)

    const jobs = (await DiscordSyncJob.find({ userId: user._id, guildId: 'guild-1' }).lean()) as any[]
    expect(jobs).toHaveLength(1)
    expect(jobs[0].status).toBe('pending')
    expect(jobs[0].source).toBe('rank_change')
    expect(jobs[0].targetRank).toBe('Contender')
    expect(jobs[0].targetRoleId).toBe('role-contender')
    expect(jobs[0].idempotencyKey).toContain('rank-change:')
  })

  it('does not enqueue sync job when rank does not change', async () => {
    const { verifyMissionSubmission } = await import('@/lib/services/missionService')

    await Promise.all([DiscordGuildConfig.init(), DiscordSyncJob.init()])

    await DiscordGuildConfig.create({
      guildId: 'guild-1',
      enabled: true,
      rankRoleMappings: [{ rank: 'Contender', roleId: 'role-contender', enabled: true }],
    })

    const user = await User.create({
      email: 'rank-unchanged@test.com',
      discordId: 'discord-user-2',
      zeCoins: 10,
      experience: 120,
      points: 120,
      rank: 'Contender',
      discordSync: {
        guildId: 'guild-1',
        linkStatus: 'linked_verified',
        verified: true,
        lastSyncStatus: 'idle',
      },
    })

    const mission = await Mission.create({
      name: 'Small Mission',
      description: 'No rank jump',
      points: 10,
      category: 'General',
      instructions: 'Complete',
      active: true,
      currentCompletions: 0,
    })

    const submission = await MissionSubmission.create({
      user: user._id,
      mission: mission._id,
      proof: 'https://example.com/no-rank-change.png',
      status: 'pending',
    })

    const result = await verifyMissionSubmission({
      submissionId: submission._id.toString(),
      status: 'approved',
      adminUserId: new mongoose.Types.ObjectId().toString(),
    })

    expect(result.status).toBe(200)
    expect(await DiscordSyncJob.countDocuments({ userId: user._id })).toBe(0)
  })

  it('enqueues sync job after revert when rank changes downward for verified linked user', async () => {
    const { revertMissionSubmission } = await import('@/lib/services/missionService')

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
      email: 'rank-change-revert@test.com',
      discordId: 'discord-user-3',
      zeCoins: 200,
      experience: 120,
      points: 120,
      rank: 'Contender',
      discordSync: {
        guildId: 'guild-1',
        linkStatus: 'linked_verified',
        verified: true,
        lastSyncStatus: 'idle',
      },
    })

    const mission = await Mission.create({
      name: 'Revert Mission',
      description: 'Will be reverted',
      points: 40,
      category: 'General',
      instructions: 'Complete',
      active: true,
      currentCompletions: 1,
    })

    const submission = await MissionSubmission.create({
      user: user._id,
      mission: mission._id,
      proof: 'https://example.com/revert-rank.png',
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: new mongoose.Types.ObjectId(),
    })

    const result = await revertMissionSubmission({
      submissionId: submission._id.toString(),
      adminUserId: new mongoose.Types.ObjectId().toString(),
      revertReason: 'Invalid evidence',
    })

    expect(result.status).toBe(200)

    const jobs = (await DiscordSyncJob.find({ userId: user._id, guildId: 'guild-1' }).lean()) as any[]
    expect(jobs).toHaveLength(1)
    expect(jobs[0].targetRank).toBe('Rookie')
    expect(jobs[0].targetRoleId).toBe('role-rookie')
    expect(jobs[0].status).toBe('pending')
  })
})
