import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import Mission from '@/models/mission'
import MissionSubmission from '@/models/missionSubmission'
import User from '@/models/user'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './setup/mongodb'

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

describe('mission submission uniqueness contention DB integration', () => {
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

  it('enforces weekly uniqueness per weekYear under concurrent inserts', async () => {
    const user = await User.create({
      email: 'weekly-concurrent@test.com',
      zeCoins: 0,
      experience: 10,
      points: 10,
      rank: 'Rookie',
    })

    const mission = await Mission.create({
      name: 'Weekly Concurrent Mission',
      description: 'Weekly concurrency',
      points: 50,
      category: 'General',
      instructions: 'Submit weekly proof',
      active: true,
      isWeeklyMission: true,
      weeklyDay: 1,
    })

    const weekYear = '2026-W10'

    const results = await Promise.allSettled([
      MissionSubmission.create({
        user: user._id,
        mission: mission._id,
        proof: 'https://example.com/weekly-1.png',
        status: 'pending',
        weekYear,
        weekStartDate: new Date('2026-03-02T00:00:00.000Z'),
      }),
      MissionSubmission.create({
        user: user._id,
        mission: mission._id,
        proof: 'https://example.com/weekly-2.png',
        status: 'pending',
        weekYear,
        weekStartDate: new Date('2026-03-02T00:00:00.000Z'),
      }),
    ])

    const fulfilled = results.filter((r) => r.status === 'fulfilled')
    const rejected = results.filter((r) => r.status === 'rejected')

    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)

    const reason = (rejected[0] as PromiseRejectedResult).reason as any
    expect([11000, 11001]).toContain(reason?.code)

    const total = await MissionSubmission.countDocuments({
      user: user._id,
      mission: mission._id,
      weekYear,
      status: { $in: ['pending', 'approved'] },
    })

    expect(total).toBe(1)
  })
})
