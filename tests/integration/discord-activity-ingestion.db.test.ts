import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import DiscordActivityLedger from '@/models/discordActivityLedger'
import DiscordGuildConfig from '@/models/discordGuildConfig'
import DiscordSyncJob from '@/models/discordSyncJob'
import User from '@/models/user'
import { ingestDiscordActivityEvent } from '@/lib/services/discordActivityIngestionService'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './setup/mongodb'

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

describe('discord activity ingestion DB integration', () => {
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
    process.env.DISCORD_ACTIVITY_POINTS_ENABLED = 'true'
    process.env.DISCORD_SYNC_ENABLED = 'true'
    process.env.DISCORD_SYNC_DRY_RUN = 'false'
  })

  it('keeps feature disabled by default when flag is not enabled', async () => {
    delete process.env.DISCORD_ACTIVITY_POINTS_ENABLED

    await User.create({
      email: 'activity-disabled@test.com',
      rank: 'Rookie',
      experience: 10,
      points: 10,
      discordId: 'discord-disabled-1',
      discordSync: {
        guildId: 'guild-1',
        linkStatus: 'linked_verified',
        verified: true,
      },
    })

    const result = await ingestDiscordActivityEvent({
      sourceEventId: 'activity-disabled-event-1',
      discordId: 'discord-disabled-1',
      guildId: 'guild-1',
      activityType: 'message_post',
      units: 2,
      occurredAt: new Date('2026-04-07T10:00:00.000Z'),
      correlationId: 'corr-disabled',
    })

    expect(result.status).toBe('skipped_disabled')
    expect(result.pointsAwarded).toBe(0)

    const user = (await User.findOne({ discordId: 'discord-disabled-1' }).lean()) as {
      experience?: number
    } | null
    expect(user?.experience).toBe(10)

    const ledger = (await DiscordActivityLedger.findOne({
      sourceEventId: 'activity-disabled-event-1',
    }).lean()) as { status?: string } | null
    expect(ledger?.status).toBe('skipped_disabled')
  })

  it('applies points, progresses rank, and enqueues rank sync job', async () => {
    await Promise.all([DiscordGuildConfig.init(), DiscordSyncJob.init(), DiscordActivityLedger.init()])

    await DiscordGuildConfig.create({
      guildId: 'guild-1',
      enabled: true,
      rankRoleMappings: [
        { rank: 'Rookie', roleId: 'role-rookie', enabled: true },
        { rank: 'Contender', roleId: 'role-contender', enabled: true },
      ],
    })

    const user = await User.create({
      email: 'activity-rank-up@test.com',
      rank: 'Rookie',
      experience: 98,
      points: 98,
      zeCoins: 0,
      discordId: 'discord-rankup-1',
      discordSync: {
        guildId: 'guild-1',
        linkStatus: 'linked_verified',
        verified: true,
      },
    })

    const result = await ingestDiscordActivityEvent({
      sourceEventId: 'activity-rankup-event-1',
      discordId: 'discord-rankup-1',
      guildId: 'guild-1',
      activityType: 'message_post',
      units: 2,
      occurredAt: new Date('2026-04-07T11:00:00.000Z'),
      correlationId: 'corr-rankup',
    })

    expect(result.status).toBe('applied')
    expect(result.pointsAwarded).toBe(4)
    expect(result.rankChanged).toBe(true)
    expect(result.rankBefore).toBe('Rookie')
    expect(result.rankAfter).toBe('Contender')

    const updatedUser = (await User.findById(user._id).lean()) as {
      experience?: number
      points?: number
      rank?: string
    } | null
    expect(updatedUser?.experience).toBe(102)
    expect(updatedUser?.points).toBe(102)
    expect(updatedUser?.rank).toBe('Contender')

    const queuedJob = (await DiscordSyncJob.findOne({ userId: user._id, status: 'pending' }).lean()) as {
      targetRank?: string
    } | null
    expect(queuedJob).toBeTruthy()
    expect(queuedJob?.targetRank).toBe('Contender')

    const ledger = (await DiscordActivityLedger.findOne({
      sourceEventId: 'activity-rankup-event-1',
    }).lean()) as { status?: string; pointsAwarded?: number } | null
    expect(ledger?.status).toBe('applied')
    expect(ledger?.pointsAwarded).toBe(4)
  })

  it('enforces cooldown and duplicate suppression', async () => {
    await User.create({
      email: 'activity-abuse@test.com',
      rank: 'Rookie',
      experience: 0,
      points: 0,
      discordId: 'discord-abuse-1',
      discordSync: {
        guildId: 'guild-1',
        linkStatus: 'linked_verified',
        verified: true,
      },
    })

    const first = await ingestDiscordActivityEvent({
      sourceEventId: 'activity-abuse-event-1',
      discordId: 'discord-abuse-1',
      guildId: 'guild-1',
      activityType: 'message_post',
      units: 1,
      occurredAt: new Date('2026-04-07T12:00:00.000Z'),
      correlationId: 'corr-abuse',
    })

    expect(first.status).toBe('applied')
    expect(first.pointsAwarded).toBe(2)

    const cooldownHit = await ingestDiscordActivityEvent({
      sourceEventId: 'activity-abuse-event-2',
      discordId: 'discord-abuse-1',
      guildId: 'guild-1',
      activityType: 'message_post',
      units: 1,
      occurredAt: new Date('2026-04-07T12:00:20.000Z'),
      correlationId: 'corr-abuse',
    })

    expect(cooldownHit.status).toBe('skipped_cooldown')
    expect(cooldownHit.pointsAwarded).toBe(0)

    const duplicate = await ingestDiscordActivityEvent({
      sourceEventId: 'activity-abuse-event-1',
      discordId: 'discord-abuse-1',
      guildId: 'guild-1',
      activityType: 'message_post',
      units: 1,
      occurredAt: new Date('2026-04-07T12:02:00.000Z'),
      correlationId: 'corr-abuse',
    })

    expect(duplicate.status).toBe('duplicate')
    expect(duplicate.duplicate).toBe(true)

    const user = (await User.findOne({ discordId: 'discord-abuse-1' }).lean()) as {
      experience?: number
    } | null
    expect(user?.experience).toBe(2)
  })

  it('enforces daily cap using awarded points and records cap skips', async () => {
    await User.create({
      email: 'activity-cap@test.com',
      rank: 'Rookie',
      experience: 0,
      points: 0,
      discordId: 'discord-cap-1',
      discordSync: {
        guildId: 'guild-1',
        linkStatus: 'linked_verified',
        verified: true,
      },
    })

    const first = await ingestDiscordActivityEvent({
      sourceEventId: 'activity-cap-event-1',
      discordId: 'discord-cap-1',
      guildId: 'guild-1',
      activityType: 'helpful_reply',
      units: 30,
      occurredAt: new Date('2026-04-07T13:00:00.000Z'),
      correlationId: 'corr-cap',
    })

    expect(first.status).toBe('applied')
    expect(first.pointsAwarded).toBe(60)

    const capped = await ingestDiscordActivityEvent({
      sourceEventId: 'activity-cap-event-2',
      discordId: 'discord-cap-1',
      guildId: 'guild-1',
      activityType: 'helpful_reply',
      units: 1,
      occurredAt: new Date('2026-04-07T13:05:00.000Z'),
      correlationId: 'corr-cap',
    })

    expect(capped.status).toBe('skipped_cap')
    expect(capped.pointsAwarded).toBe(0)

    const user = (await User.findOne({ discordId: 'discord-cap-1' }).lean()) as {
      experience?: number
    } | null
    expect(user?.experience).toBe(60)

    const cappedLedger = (await DiscordActivityLedger.findOne({
      sourceEventId: 'activity-cap-event-2',
    }).lean()) as { status?: string } | null
    expect(cappedLedger?.status).toBe('skipped_cap')
  })
})
