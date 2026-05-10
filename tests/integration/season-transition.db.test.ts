import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import Mission from '@/models/mission'
import MissionSubmission from '@/models/missionSubmission'
import RedemptionRequest from '@/models/redemptionRequest'
import Reward from '@/models/reward'
import Season from '@/models/season'
import SeasonArchive from '@/models/seasonArchive'
import User from '@/models/user'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './setup/mongodb'

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

describe('season transition DB integration', () => {
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

  it('archives leaderboard state, refunds pending redemptions, resets users and clears runtime collections', async () => {
    const { endSeason } = await import('@/lib/ze-club/seasonTransition')

    await Promise.all([
      Season.init(),
      User.init(),
      Mission.init(),
      RedemptionRequest.init(),
      Reward.init(),
      SeasonArchive.init(),
    ])

    const season = await Season.create({
      seasonNumber: 10,
      name: 'Season 10',
      status: 'active',
      startDate: new Date(Date.now() - 7 * 24 * 3600_000),
      scheduledEndDate: new Date(Date.now() + 24 * 3600_000),
      createdBy: new mongoose.Types.ObjectId(),
    })

    const [u1, u2, u3] = await User.create([
      {
        email: 'legend@test.com',
        zeTag: 'legend',
        zeClubId: 'legend-1',
        zeCoins: 100,
        experience: 1000,
        points: 1000,
        rank: 'Errorless Legend',
        rankIcon: '/images/ranks/errorless-legend.png',
      },
      {
        email: 'vanguard@test.com',
        zeTag: 'vanguard',
        zeClubId: 'vanguard-1',
        zeCoins: 80,
        experience: 600,
        points: 600,
        rank: 'Vanguard',
        rankIcon: '/images/ranks/vanguard.png',
      },
      {
        email: 'rookie@test.com',
        zeTag: 'rookie',
        zeClubId: 'rookie-1',
        zeCoins: 30,
        experience: 0,
        points: 0,
        rank: 'Rookie',
        rankIcon: '/images/ranks/rookie.png',
      },
    ])

    const [m1, m2] = await Mission.create([
      {
        name: 'Mission A',
        description: 'A',
        points: 100,
        category: 'General',
        instructions: 'Do A',
        active: true,
        currentCompletions: 5,
      },
      {
        name: 'Mission B',
        description: 'B',
        points: 50,
        category: 'General',
        instructions: 'Do B',
        active: true,
        currentCompletions: 3,
      },
    ])

    await MissionSubmission.create([
      {
        user: u1._id,
        mission: m1._id,
        proof: 'https://example.com/a1.png',
        status: 'approved',
      },
      {
        user: u1._id,
        mission: m2._id,
        proof: 'https://example.com/a2.png',
        status: 'approved',
      },
      {
        user: u2._id,
        mission: m1._id,
        proof: 'https://example.com/b1.png',
        status: 'approved',
      },
      {
        user: u2._id,
        mission: m2._id,
        proof: 'https://example.com/b2.png',
        status: 'pending',
      },
    ])

    const [rPending, rProcessing] = await Reward.create([
      {
        name: 'Pending Reward',
        description: 'P',
        cost: 40,
        stock: 2,
        requiredRank: 'Rookie',
        discountable: true,
        exclusiveToTop3: false,
      },
      {
        name: 'Processing Reward',
        description: 'Q',
        cost: 30,
        stock: 1,
        requiredRank: 'Rookie',
        discountable: true,
        exclusiveToTop3: false,
      },
    ])

    await RedemptionRequest.create([
      {
        userId: u1._id,
        userName: 'Legend',
        userEmail: 'legend@test.com',
        rewardId: rPending._id,
        rewardName: rPending.name,
        rewardCost: 40,
        contactName: 'Legend',
        contactEmail: 'legend@test.com',
        contactPhone: '9999999999',
        address: 'A',
        status: 'pending',
      },
      {
        userId: u2._id,
        userName: 'Vanguard',
        userEmail: 'vanguard@test.com',
        rewardId: rProcessing._id,
        rewardName: rProcessing.name,
        rewardCost: 30,
        contactName: 'Vanguard',
        contactEmail: 'vanguard@test.com',
        contactPhone: '9999999998',
        address: 'B',
        status: 'processing',
      },
      {
        userId: u2._id,
        userName: 'Vanguard',
        userEmail: 'vanguard@test.com',
        rewardId: rProcessing._id,
        rewardName: rProcessing.name,
        rewardCost: 30,
        contactName: 'Vanguard',
        contactEmail: 'vanguard@test.com',
        contactPhone: '9999999998',
        address: 'B',
        status: 'completed',
      },
    ])

    const result = await endSeason(
      season._id.toString(),
      new mongoose.Types.ObjectId().toString(),
      'manual_early'
    )

    expect(result.success).toBe(true)
    expect(result.pendingSubmissionsRejected).toBe(1)
    expect(result.pendingRedemptionsCancelled).toBe(2)
    expect(result.totalArchived).toBe(3)

    const completedSeason = (await Season.findById(season._id).lean()) as any
    expect(completedSeason.status).toBe('completed')
    expect(completedSeason.totalParticipants).toBe(2)

    const archives = (await SeasonArchive.find({ seasonNumber: 10 })
      .sort({ leaderboardPosition: 1 })
      .lean()) as any[]

    expect(archives).toHaveLength(3)
    expect(archives[0].zeTag).toBe('legend')
    expect(archives[0].leaderboardPosition).toBe(1)
    expect(archives[0].isSeasonWinner).toBe(true)
    expect(archives[0].isTopThree).toBe(true)
    expect(archives[0].finalZeCoins).toBe(140)
    expect(archives[0].totalMissionsCompleted).toBe(2)

    expect(archives[1].zeTag).toBe('vanguard')
    expect(archives[1].finalZeCoins).toBe(110)
    expect(archives[1].totalMissionsCompleted).toBe(1)
    expect(archives[1].totalRedemptions).toBe(1)

    const resetUsers = (await User.find({}).lean()) as any[]
    for (const user of resetUsers) {
      expect(user.experience).toBe(0)
      expect(user.zeCoins).toBe(0)
      expect(user.rank).toBe('Rookie')
    }

    const resetMissions = (await Mission.find({}).lean()) as any[]
    expect(resetMissions.every((m) => m.currentCompletions === 0)).toBe(true)

    expect(await MissionSubmission.countDocuments({})).toBe(0)
    expect(await RedemptionRequest.countDocuments({})).toBe(0)
  })
})
