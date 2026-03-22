import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('auth route exports', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('keeps NextAuth handler exports unchanged', async () => {
    const handlers = {
      GET: vi.fn(),
      POST: vi.fn(),
    }
    const auth = vi.fn()
    const signIn = vi.fn()
    const signOut = vi.fn()

    vi.doMock('next-auth', () => ({
      default: vi.fn(() => ({
        handlers,
        auth,
        signIn,
        signOut,
      })),
    }))
    vi.doMock('next-auth/providers/discord', () => ({
      default: vi.fn(() => ({ id: 'discord' })),
    }))
    vi.doMock('next-auth/providers/google', () => ({
      default: vi.fn(() => ({ id: 'google' })),
    }))
    vi.doMock('@auth/mongodb-adapter', () => ({
      MongoDBAdapter: vi.fn(() => ({
        createUser: vi.fn(),
      })),
    }))
    vi.doMock('@/lib/mongodb', () => ({
      clientPromise: Promise.resolve({}),
      default: vi.fn(),
    }))
    vi.doMock('@/models/user', () => ({
      default: {
        exists: vi.fn(),
        findOne: vi.fn(),
        findById: vi.fn(),
      },
    }))
    vi.doMock('@/lib/ranks', () => ({
      getRankForExperience: vi.fn(() => ({ name: 'Rookie', icon: '/images/ranks/rookie.png' })),
    }))
    vi.doMock('@/lib/userService', () => ({
      clearUserCache: vi.fn(),
    }))

    const route = await import('@/app/api/auth/[...nextauth]/route')

    expect(route.GET).toBe(handlers.GET)
    expect(route.POST).toBe(handlers.POST)
    expect(route.auth).toBe(auth)
    expect(route.signIn).toBe(signIn)
    expect(route.signOut).toBe(signOut)
  })
})
