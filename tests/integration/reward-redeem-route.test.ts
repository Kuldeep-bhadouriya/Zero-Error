import { beforeEach, describe, expect, it, vi } from 'vitest'

function createLoggerMock() {
  return {
    default: {
      info: vi.fn(),
      error: vi.fn(),
    },
  }
}

describe('reward redeem route', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns 401 when user is unauthenticated', async () => {
    const auth = vi.fn().mockResolvedValue(null)

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/season', () => ({ default: { findOne: vi.fn() } }))
    vi.doMock('@/models/user', () => ({ default: { findById: vi.fn(), findOne: vi.fn(), countDocuments: vi.fn() } }))
    vi.doMock('@/models/reward', () => ({ default: { findById: vi.fn() } }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { POST } = await import('@/app/api/ze-club/rewards/redeem/route')

    const response = await POST(
      new Request('http://localhost/api/ze-club/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({ rewardId: '507f1f77bcf86cd799439011' }),
      })
    )

    expect(response.status).toBe(401)
  })

  it('returns 403 when there is no active season', async () => {
    const auth = vi.fn().mockResolvedValue({ user: { id: 'u-1', email: 'u@test.com' } })
    const findOneSeason = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/season', () => ({ default: { findOne: findOneSeason } }))
    vi.doMock('@/models/user', () => ({ default: { findById: vi.fn(), findOne: vi.fn(), countDocuments: vi.fn() } }))
    vi.doMock('@/models/reward', () => ({ default: { findById: vi.fn() } }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { POST } = await import('@/app/api/ze-club/rewards/redeem/route')

    const response = await POST(
      new Request('http://localhost/api/ze-club/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({ rewardId: '507f1f77bcf86cd799439011' }),
      })
    )

    expect(response.status).toBe(403)
  })

  it('returns 403 when user rank is below required rank', async () => {
    const auth = vi.fn().mockResolvedValue({ user: { id: 'u-1', email: 'u@test.com' } })
    const findOneSeason = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: 's-1' }) })

    const user = {
      id: 'u-1',
      rank: 'Rookie',
      experience: 10,
      zeCoins: 500,
      save: vi.fn(),
    }

    const reward = {
      id: 'r-1',
      requiredRank: 'Vanguard',
      stock: 10,
      cost: 100,
      discountable: true,
      save: vi.fn(),
    }

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/season', () => ({ default: { findOne: findOneSeason } }))
    vi.doMock('@/models/user', () => ({
      default: {
        findById: vi.fn().mockResolvedValue(user),
        findOne: vi.fn().mockResolvedValue(user),
        countDocuments: vi.fn().mockResolvedValue(0),
      },
    }))
    vi.doMock('@/models/reward', () => ({ default: { findById: vi.fn().mockResolvedValue(reward) } }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { POST } = await import('@/app/api/ze-club/rewards/redeem/route')

    const response = await POST(
      new Request('http://localhost/api/ze-club/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({ rewardId: '507f1f77bcf86cd799439011' }),
      })
    )

    expect(response.status).toBe(403)
    expect(user.save).not.toHaveBeenCalled()
  })

  it('applies vanguard discount and redeems successfully', async () => {
    const auth = vi.fn().mockResolvedValue({ user: { id: 'u-2', email: 'u2@test.com' } })
    const findOneSeason = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: 's-1' }) })

    const user = {
      id: 'u-2',
      rank: 'Vanguard',
      experience: 600,
      zeCoins: 100,
      points: 600,
      save: vi.fn().mockResolvedValue(undefined),
    }

    const reward = {
      id: 'r-2',
      requiredRank: 'Rookie',
      stock: 5,
      cost: 100,
      discountable: true,
      save: vi.fn().mockResolvedValue(undefined),
    }

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/season', () => ({ default: { findOne: findOneSeason } }))
    vi.doMock('@/models/user', () => ({
      default: {
        findById: vi.fn().mockResolvedValue(user),
        findOne: vi.fn().mockResolvedValue(user),
        countDocuments: vi.fn().mockResolvedValue(0),
      },
    }))
    vi.doMock('@/models/reward', () => ({ default: { findById: vi.fn().mockResolvedValue(reward) } }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { POST } = await import('@/app/api/ze-club/rewards/redeem/route')

    const response = await POST(
      new Request('http://localhost/api/ze-club/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({ rewardId: '507f1f77bcf86cd799439011' }),
      })
    )

    expect(response.status).toBe(200)
    expect(user.zeCoins).toBe(10)
    expect(reward.stock).toBe(4)
    expect(user.save).toHaveBeenCalledOnce()
    expect(reward.save).toHaveBeenCalledOnce()
  })
})
