import { beforeEach, describe, expect, it, vi } from 'vitest'

function createLoggerMock() {
  return {
    default: {
      info: vi.fn(),
      error: vi.fn(),
    },
  }
}

describe('admin submission routes', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns 401 for verify when session is missing', async () => {
    const auth = vi.fn().mockResolvedValue(null)
    const verifyMissionSubmission = vi.fn()

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth }))
    vi.doMock('@/lib/services/missionService', () => ({ verifyMissionSubmission }))
    vi.doMock('next/cache', () => ({ revalidatePath: vi.fn() }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { PATCH } = await import('@/app/api/admin/submissions/verify/route')

    const response = await PATCH(
      new Request('http://localhost/api/admin/submissions/verify', {
        method: 'PATCH',
        body: JSON.stringify({ submissionId: 'sub-1', status: 'approved' }),
      }),
      {} as never
    )

    expect(response.status).toBe(401)
    expect(verifyMissionSubmission).not.toHaveBeenCalled()
  })

  it('returns 400 for verify when status is invalid', async () => {
    const auth = vi.fn().mockResolvedValue({
      user: { id: 'admin-1', roles: ['admin'] },
    })
    const verifyMissionSubmission = vi.fn()

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth }))
    vi.doMock('@/lib/services/missionService', () => ({ verifyMissionSubmission }))
    vi.doMock('next/cache', () => ({ revalidatePath: vi.fn() }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { PATCH } = await import('@/app/api/admin/submissions/verify/route')

    const response = await PATCH(
      new Request('http://localhost/api/admin/submissions/verify', {
        method: 'PATCH',
        body: JSON.stringify({ submissionId: 'sub-1', status: 'invalid-status' }),
      }),
      {} as never
    )

    expect(response.status).toBe(400)
    expect(verifyMissionSubmission).not.toHaveBeenCalled()
  })

  it('verifies submission for admin and revalidates leaderboard', async () => {
    const auth = vi.fn().mockResolvedValue({
      user: { id: 'admin-99', roles: ['admin'] },
    })

    const verifyMissionSubmission = vi.fn().mockResolvedValue({
      status: 200,
      data: { message: 'verified' },
    })

    const revalidatePath = vi.fn()

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth }))
    vi.doMock('@/lib/services/missionService', () => ({ verifyMissionSubmission }))
    vi.doMock('next/cache', () => ({ revalidatePath }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { PATCH } = await import('@/app/api/admin/submissions/verify/route')

    const response = await PATCH(
      new Request('http://localhost/api/admin/submissions/verify', {
        method: 'PATCH',
        body: JSON.stringify({ submissionId: 'sub-1', status: 'approved' }),
      }),
      {} as never
    )

    expect(response.status).toBe(200)
    expect(verifyMissionSubmission).toHaveBeenCalledWith({
      submissionId: 'sub-1',
      status: 'approved',
      adminUserId: 'admin-99',
      rejectReason: undefined,
    })
    expect(revalidatePath).toHaveBeenCalledWith('/ze-club/leaderboard')
  })

  it('returns 401 for revert when user is not admin', async () => {
    const auth = vi.fn().mockResolvedValue({ user: { id: 'u-1', roles: ['member'] } })
    const revertMissionSubmission = vi.fn()

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth }))
    vi.doMock('@/lib/services/missionService', () => ({ revertMissionSubmission }))
    vi.doMock('next/cache', () => ({ revalidatePath: vi.fn() }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { POST } = await import('@/app/api/admin/submissions/revert/route')

    const response = await POST(
      new Request('http://localhost/api/admin/submissions/revert', {
        method: 'POST',
        body: JSON.stringify({ submissionId: 'sub-1', revertReason: 'mistake' }),
      }),
      {} as never
    )

    expect(response.status).toBe(401)
    expect(revertMissionSubmission).not.toHaveBeenCalled()
  })

  it('reverts submission for admin', async () => {
    const auth = vi.fn().mockResolvedValue({ user: { id: 'admin-2', roles: ['admin'] } })
    const revertMissionSubmission = vi.fn().mockResolvedValue({
      status: 200,
      data: { message: 'reverted' },
    })
    const revalidatePath = vi.fn()

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth }))
    vi.doMock('@/lib/services/missionService', () => ({ revertMissionSubmission }))
    vi.doMock('next/cache', () => ({ revalidatePath }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { POST } = await import('@/app/api/admin/submissions/revert/route')

    const response = await POST(
      new Request('http://localhost/api/admin/submissions/revert', {
        method: 'POST',
        body: JSON.stringify({ submissionId: 'sub-22', revertReason: 'bad proof' }),
      }),
      {} as never
    )

    expect(response.status).toBe(200)
    expect(revertMissionSubmission).toHaveBeenCalledWith({
      submissionId: 'sub-22',
      revertReason: 'bad proof',
      adminUserId: 'admin-2',
    })
    expect(revalidatePath).toHaveBeenCalledWith('/ze-club/leaderboard')
  })
})
