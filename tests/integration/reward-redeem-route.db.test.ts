import mongoose from 'mongoose'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import Reward from '@/models/reward'
import Season from '@/models/season'
import User from '@/models/user'
import { clearTestDatabase, startTestDatabase, stopTestDatabase } from './setup/mongodb'

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}))

describe('reward redeem route DB integration', () => {
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
    vi.resetModules()
  })

  async function loadRouteWithSession(session: unknown) {
    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue(session),
    }))

    return import('@/app/api/ze-club/rewards/redeem/route')
  }

  it('redeems reward and persists discounted balance + stock', async () => {
    const user = await User.create({
      email: 'vanguard-user@test.com',
      zeCoins: 120,
      experience: 620,
      points: 620,
      rank: 'Vanguard',
    })

    await Season.create({
      seasonNumber: 99,
      name: 'Season 99',
      status: 'active',
      startDate: new Date(Date.now() - 3600_000),
      scheduledEndDate: new Date(Date.now() + 3600_000),
      createdBy: new mongoose.Types.ObjectId(),
    })

    const reward = await Reward.create({
      name: 'Headset',
      description: 'Gaming headset',
      cost: 100,
      stock: 3,
      requiredRank: 'Rookie',
      discountable: true,
      exclusiveToTop3: false,
    })

    const { POST } = await loadRouteWithSession({
      user: {
        id: user._id.toString(),
        email: user.email,
      },
    })

    const response = await POST(
      new Request('http://localhost/api/ze-club/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({ rewardId: reward._id.toString() }),
      })
    )

    expect(response.status).toBe(200)

    const updatedUser = (await User.findById(user._id).lean()) as any
    const updatedReward = (await Reward.findById(reward._id).lean()) as any

    expect(updatedUser?.zeCoins).toBe(30)
    expect(updatedUser?.experience).toBe(620)
    expect(updatedUser?.points).toBe(620)
    expect(updatedReward?.stock).toBe(2)
  })

  it('returns 400 and does not mutate when coins are insufficient', async () => {
    const user = await User.create({
      email: 'insufficient-user@test.com',
      zeCoins: 30,
      experience: 50,
      points: 50,
      rank: 'Rookie',
    })

    await Season.create({
      seasonNumber: 100,
      name: 'Season 100',
      status: 'active',
      startDate: new Date(Date.now() - 3600_000),
      scheduledEndDate: new Date(Date.now() + 3600_000),
      createdBy: new mongoose.Types.ObjectId(),
    })

    const reward = await Reward.create({
      name: 'Mouse',
      description: 'Pro mouse',
      cost: 80,
      stock: 2,
      requiredRank: 'Rookie',
      discountable: true,
      exclusiveToTop3: false,
    })

    const { POST } = await loadRouteWithSession({
      user: {
        id: user._id.toString(),
        email: user.email,
      },
    })

    const response = await POST(
      new Request('http://localhost/api/ze-club/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({ rewardId: reward._id.toString() }),
      })
    )

    expect(response.status).toBe(400)

    const unchangedUser = (await User.findById(user._id).lean()) as any
    const unchangedReward = (await Reward.findById(reward._id).lean()) as any

    expect(unchangedUser?.zeCoins).toBe(30)
    expect(unchangedReward?.stock).toBe(2)
  })
})
