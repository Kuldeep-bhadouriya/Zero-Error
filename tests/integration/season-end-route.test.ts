import { beforeEach, describe, expect, it, vi } from 'vitest'

function createLoggerMock() {
  return {
    default: {
      info: vi.fn(),
      error: vi.fn(),
    },
  }
}

describe('admin season end route', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('POST returns 401 when user is not admin', async () => {
    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue({ user: { id: 'u-1', roles: ['member'] } }),
    }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/lib/ze-club/seasonTransition', () => ({ endSeason: vi.fn() }))
    vi.doMock('@/models/season', () => ({ default: { findById: vi.fn() } }))
    vi.doMock('@/models/missionSubmission', () => ({ default: { countDocuments: vi.fn() } }))
    vi.doMock('@/models/redemptionRequest', () => ({ default: { countDocuments: vi.fn() } }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { POST } = await import('@/app/api/admin/seasons/[id]/end/route')

    const response = await POST(
      new Request('http://localhost/api/admin/seasons/s-1/end', { method: 'POST' }) as never,
      { params: Promise.resolve({ id: 's-1' }) }
    )

    expect(response.status).toBe(401)
  })

  it('POST returns 400 if season is not active', async () => {
    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue({ user: { id: 'admin-1', roles: ['admin'] } }),
    }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/lib/ze-club/seasonTransition', () => ({ endSeason: vi.fn() }))
    vi.doMock('@/models/season', () => ({
      default: {
        findById: vi.fn().mockResolvedValue({ status: 'completed' }),
      },
    }))
    vi.doMock('@/models/missionSubmission', () => ({ default: { countDocuments: vi.fn() } }))
    vi.doMock('@/models/redemptionRequest', () => ({ default: { countDocuments: vi.fn() } }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { POST } = await import('@/app/api/admin/seasons/[id]/end/route')

    const response = await POST(
      new Request('http://localhost/api/admin/seasons/s-2/end', { method: 'POST' }) as never,
      { params: Promise.resolve({ id: 's-2' }) }
    )

    expect(response.status).toBe(400)
  })

  it('POST ends active season successfully', async () => {
    const endSeason = vi.fn().mockResolvedValue({
      seasonNumber: 5,
      archiveId: 'a-1',
    })

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue({ user: { id: 'admin-2', roles: ['admin'] } }),
    }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/lib/ze-club/seasonTransition', () => ({ endSeason }))
    vi.doMock('@/models/season', () => ({
      default: {
        findById: vi.fn().mockResolvedValue({
          status: 'active',
          scheduledEndDate: new Date(Date.now() + 60_000),
        }),
      },
    }))
    vi.doMock('@/models/missionSubmission', () => ({ default: { countDocuments: vi.fn() } }))
    vi.doMock('@/models/redemptionRequest', () => ({ default: { countDocuments: vi.fn() } }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { POST } = await import('@/app/api/admin/seasons/[id]/end/route')

    const response = await POST(
      new Request('http://localhost/api/admin/seasons/s-3/end', { method: 'POST' }) as never,
      { params: Promise.resolve({ id: 's-3' }) }
    )

    expect(response.status).toBe(200)
    expect(endSeason).toHaveBeenCalledWith('s-3', 'admin-2', 'manual_early')
  })

  it('GET returns 401 when unauthorized', async () => {
    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue(null),
    }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/lib/ze-club/seasonTransition', () => ({ endSeason: vi.fn() }))
    vi.doMock('@/models/season', () => ({ default: { findById: vi.fn() } }))
    vi.doMock('@/models/missionSubmission', () => ({ default: { countDocuments: vi.fn() } }))
    vi.doMock('@/models/redemptionRequest', () => ({ default: { countDocuments: vi.fn() } }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { GET } = await import('@/app/api/admin/seasons/[id]/end/route')

    const response = await GET(
      new Request('http://localhost/api/admin/seasons/s-4/end', { method: 'GET' }) as never,
      { params: Promise.resolve({ id: 's-4' }) }
    )

    expect(response.status).toBe(401)
  })

  it('GET returns pending summary for active season', async () => {
    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue({ user: { id: 'admin-3', roles: ['admin'] } }),
    }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/lib/ze-club/seasonTransition', () => ({ endSeason: vi.fn() }))
    vi.doMock('@/models/season', () => ({
      default: {
        findById: vi.fn().mockResolvedValue({
          status: 'active',
          name: 'Season 9',
          seasonNumber: 9,
        }),
      },
    }))
    vi.doMock('@/models/missionSubmission', () => ({
      default: { countDocuments: vi.fn().mockResolvedValue(7) },
    }))
    vi.doMock('@/models/redemptionRequest', () => ({
      default: { countDocuments: vi.fn().mockResolvedValue(4) },
    }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { GET } = await import('@/app/api/admin/seasons/[id]/end/route')

    const response = await GET(
      new Request('http://localhost/api/admin/seasons/s-5/end', { method: 'GET' }) as never,
      { params: Promise.resolve({ id: 's-5' }) }
    )

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body).toEqual({
      pendingSubmissions: 7,
      pendingRedemptions: 4,
      seasonName: 'Season 9',
      seasonNumber: 9,
    })
  })
})
