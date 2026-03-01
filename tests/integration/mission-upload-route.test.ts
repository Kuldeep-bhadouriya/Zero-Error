import { beforeEach, describe, expect, it, vi } from 'vitest'

function createLoggerMock() {
  return {
    default: {
      info: vi.fn(),
      error: vi.fn(),
    },
  }
}

describe('mission upload route', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns 401 when unauthenticated', async () => {
    const auth = vi.fn().mockResolvedValue(null)

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/season', () => ({ default: { findOne: vi.fn() } }))
    vi.doMock('@/models/user', () => ({ default: { findOne: vi.fn() } }))
    vi.doMock('@/models/mission', () => ({ default: { findById: vi.fn() } }))
    vi.doMock('@/models/missionSubmission', () => ({ default: vi.fn() }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { POST } = await import('@/app/api/ze-club/missions/upload/route')

    const response = await POST(
      new Request('http://localhost/api/ze-club/missions/upload', {
        method: 'POST',
        body: JSON.stringify({
          missionId: '507f1f77bcf86cd799439011',
          fileUrl: 'https://example.com/proof.png',
        }),
      }) as never
    )

    expect(response.status).toBe(401)
  })

  it('returns 403 when no active season exists', async () => {
    const auth = vi.fn().mockResolvedValue({ user: { email: 'user@test.com' } })
    const findOneSeason = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) })

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/season', () => ({ default: { findOne: findOneSeason } }))
    vi.doMock('@/models/user', () => ({ default: { findOne: vi.fn() } }))
    vi.doMock('@/models/mission', () => ({ default: { findById: vi.fn() } }))
    vi.doMock('@/models/missionSubmission', () => ({ default: vi.fn() }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { POST } = await import('@/app/api/ze-club/missions/upload/route')

    const response = await POST(
      new Request('http://localhost/api/ze-club/missions/upload', {
        method: 'POST',
        body: JSON.stringify({
          missionId: '507f1f77bcf86cd799439011',
          fileUrl: 'https://example.com/proof.png',
        }),
      }) as never
    )

    expect(response.status).toBe(403)
  })

  it('blocks duplicate weekly submissions for same week', async () => {
    const auth = vi.fn().mockResolvedValue({ user: { email: 'user@test.com' } })
    const findOneSeason = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: 's-1' }) })
    const findUser = vi.fn().mockResolvedValue({ _id: 'u-1' })
    const findMission = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ isWeeklyMission: true }) })

    const missionSubmissionConstructor = vi.fn()
    ;(missionSubmissionConstructor as unknown as { findOne: unknown }).findOne = vi
      .fn()
      .mockResolvedValue({ _id: 'existing-submission', status: 'pending' })

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/season', () => ({ default: { findOne: findOneSeason } }))
    vi.doMock('@/models/user', () => ({ default: { findOne: findUser } }))
    vi.doMock('@/models/mission', () => ({ default: { findById: findMission } }))
    vi.doMock('@/models/missionSubmission', () => ({ default: missionSubmissionConstructor }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { POST } = await import('@/app/api/ze-club/missions/upload/route')

    const response = await POST(
      new Request('http://localhost/api/ze-club/missions/upload', {
        method: 'POST',
        body: JSON.stringify({
          missionId: '507f1f77bcf86cd799439011',
          fileUrl: 'https://example.com/proof.png',
        }),
      }) as never
    )

    expect(response.status).toBe(400)
    expect(missionSubmissionConstructor).not.toHaveBeenCalled()
  })

  it('creates a pending submission when mission is valid and unique', async () => {
    const auth = vi.fn().mockResolvedValue({ user: { email: 'user@test.com' } })
    const findOneSeason = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: 's-1' }) })
    const findUser = vi.fn().mockResolvedValue({ _id: 'u-1' })
    const findMission = vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue({ isWeeklyMission: false }) })

    const save = vi.fn().mockResolvedValue(undefined)
    const missionSubmissionConstructor = vi
      .fn()
      .mockImplementation(function MissionSubmission(this: Record<string, unknown>, payload: Record<string, unknown>) {
        Object.assign(this, payload)
        this.save = save
      })
    ;(missionSubmissionConstructor as unknown as { findOne: unknown }).findOne = vi.fn().mockResolvedValue(null)

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/season', () => ({ default: { findOne: findOneSeason } }))
    vi.doMock('@/models/user', () => ({ default: { findOne: findUser } }))
    vi.doMock('@/models/mission', () => ({ default: { findById: findMission } }))
    vi.doMock('@/models/missionSubmission', () => ({ default: missionSubmissionConstructor }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { POST } = await import('@/app/api/ze-club/missions/upload/route')

    const response = await POST(
      new Request('http://localhost/api/ze-club/missions/upload', {
        method: 'POST',
        body: JSON.stringify({
          missionId: '507f1f77bcf86cd799439011',
          fileUrl: 'https://example.com/proof.png',
        }),
      }) as never
    )

    expect(response.status).toBe(200)
    expect(missionSubmissionConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        user: 'u-1',
        mission: '507f1f77bcf86cd799439011',
        proof: 'https://example.com/proof.png',
        status: 'pending',
      })
    )
    expect(save).toHaveBeenCalledOnce()
  })
})
