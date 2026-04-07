import { beforeEach, describe, expect, it, vi } from 'vitest'

function createLoggerMock() {
  return {
    default: {
      info: vi.fn(),
      debug: vi.fn(),
      error: vi.fn(),
    },
  }
}

describe('public API cache routes', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    delete process.env.PUBLIC_API_CACHE_DISABLED
    delete process.env.PUBLIC_API_CACHE_TTL_SECONDS
    delete process.env.ANNOUNCEMENTS_ACTIVE_CACHE_TTL_SECONDS
    delete process.env.EVENTS_LIST_CACHE_TTL_SECONDS
    delete process.env.EVENTS_CURRENT_CACHE_TTL_SECONDS
    delete process.env.ZE_CLUB_LEADERBOARD_CACHE_TTL_SECONDS
    delete process.env.ZE_CLUB_LEADERBOARD_RECOMPUTE_FROM_SUBMISSIONS
    delete process.env.ZE_CLUB_LEADERBOARD_PERSIST_NORMALIZED_FIELDS
    process.env.PUBLIC_API_CACHE_DEBUG = 'true'
  })

  it('applies cache headers and validators for active announcements', async () => {
    process.env.ANNOUNCEMENTS_ACTIVE_CACHE_TTL_SECONDS = '42'

    const announcementRows = [
      {
        _id: 'a-1',
        title: 'Update',
        updatedAt: new Date('2026-03-22T00:00:00.000Z'),
      },
    ]

    const chain = {
      sort: vi.fn(),
      skip: vi.fn(),
      limit: vi.fn(),
      lean: vi.fn().mockResolvedValue(announcementRows),
    }
    chain.sort.mockReturnValue(chain)
    chain.skip.mockReturnValue(chain)
    chain.limit.mockReturnValue(chain)

    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/announcement', () => ({
      default: {
        find: vi.fn().mockReturnValue(chain),
        countDocuments: vi.fn().mockResolvedValue(1),
      },
    }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { GET } = await import('@/app/api/announcements/active/route')

    const first = await GET(new Request('http://localhost/api/announcements/active?page=1'))
    expect(first.status).toBe(200)
    expect(first.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=42, stale-while-revalidate=42'
    )
    expect(first.headers.get('ETag')).toBeTruthy()
    expect(first.headers.get('Last-Modified')).toBeTruthy()
    expect(first.headers.get('X-ZE-Cache-Status')).toBe('MISS')

    const firstBody = await first.json()
    expect(firstBody).toEqual({
      announcements: [
        {
          ...announcementRows[0],
          updatedAt: '2026-03-22T00:00:00.000Z',
        },
      ],
      pagination: {
        page: 1,
        limit: 3,
        total: 1,
        totalPages: 1,
        hasMore: false,
      },
    })

    const etag = first.headers.get('ETag')
    const second = await GET(
      new Request('http://localhost/api/announcements/active?page=1', {
        headers: {
          'if-none-match': etag || '',
        },
      })
    )

    expect(second.status).toBe(304)
    expect(second.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=42, stale-while-revalidate=42'
    )
    expect(second.headers.get('X-ZE-Cache-Status')).toBe('HIT')
  })

  it('applies moderate cache headers for events listing', async () => {
    process.env.EVENTS_LIST_CACHE_TTL_SECONDS = '240'

    const eventRows = [
      {
        _id: 'e-1',
        title: 'Tournament',
        eventDate: new Date('2026-04-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-21T00:00:00.000Z'),
      },
    ]

    const queryChain = {
      select: vi.fn(),
      sort: vi.fn(),
      limit: vi.fn(),
      lean: vi.fn().mockResolvedValue(eventRows),
    }
    queryChain.select.mockReturnValue(queryChain)
    queryChain.sort.mockReturnValue(queryChain)
    queryChain.limit.mockReturnValue(queryChain)

    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/event', () => ({
      default: {
        find: vi.fn().mockReturnValue(queryChain),
      },
    }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { GET } = await import('@/app/api/events/route')
    const response = await GET(new Request('http://localhost/api/events?eventType=upcoming'))

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=240, stale-while-revalidate=60'
    )
    expect(response.headers.get('ETag')).toBeTruthy()
    expect(response.headers.get('Last-Modified')).toBeTruthy()
    expect(response.headers.get('X-ZE-Cache-Status')).toBe('MISS')

    const body = await response.json()
    expect(body).toEqual({
      success: true,
      events: [
        {
          ...eventRows[0],
          eventDate: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-03-21T00:00:00.000Z',
        },
      ],
      count: 1,
    })
  })

  it('returns 304 for events listing when ETag matches', async () => {
    process.env.EVENTS_LIST_CACHE_TTL_SECONDS = '240'

    const eventRows = [
      {
        _id: 'e-304',
        title: 'Tournament 304',
        eventDate: new Date('2026-04-01T00:00:00.000Z'),
        updatedAt: new Date('2026-03-21T00:00:00.000Z'),
      },
    ]

    const queryChain = {
      select: vi.fn(),
      sort: vi.fn(),
      limit: vi.fn(),
      lean: vi.fn().mockResolvedValue(eventRows),
    }
    queryChain.select.mockReturnValue(queryChain)
    queryChain.sort.mockReturnValue(queryChain)
    queryChain.limit.mockReturnValue(queryChain)

    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/event', () => ({
      default: {
        find: vi.fn().mockReturnValue(queryChain),
      },
    }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { GET } = await import('@/app/api/events/route')

    const first = await GET(new Request('http://localhost/api/events'))
    const etag = first.headers.get('ETag')
    expect(etag).toBeTruthy()

    const second = await GET(
      new Request('http://localhost/api/events', {
        headers: {
          'if-none-match': etag || '',
        },
      })
    )

    expect(second.status).toBe(304)
    expect(second.headers.get('X-ZE-Cache-Status')).toBe('HIT')
    expect(second.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=240, stale-while-revalidate=60'
    )
  })

  it('applies short cache headers for current events and supports Last-Modified revalidation', async () => {
    process.env.EVENTS_CURRENT_CACHE_TTL_SECONDS = '30'

    const eventRows = [
      {
        _id: 'e-current-1',
        title: 'Current Event Live',
        eventDate: new Date('2026-03-22T12:00:00.000Z'),
        updatedAt: new Date('2026-03-22T11:55:00.000Z'),
      },
    ]

    const queryChain = {
      select: vi.fn(),
      sort: vi.fn(),
      limit: vi.fn(),
      lean: vi.fn().mockResolvedValue(eventRows),
    }
    queryChain.select.mockReturnValue(queryChain)
    queryChain.sort.mockReturnValue(queryChain)
    queryChain.limit.mockReturnValue(queryChain)

    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/event', () => ({
      default: {
        find: vi.fn().mockReturnValue(queryChain),
      },
    }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { GET } = await import('@/app/api/events/current/route')
    const first = await GET(new Request('http://localhost/api/events/current'))

    expect(first.status).toBe(200)
    expect(first.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=30, stale-while-revalidate=30'
    )
    expect(first.headers.get('X-ZE-Cache-Status')).toBe('MISS')
    expect(first.headers.get('Last-Modified')).toBeTruthy()

    const body = await first.json()
    expect(body).toEqual({
      success: true,
      events: [
        {
          ...eventRows[0],
          eventDate: '2026-03-22T12:00:00.000Z',
          updatedAt: '2026-03-22T11:55:00.000Z',
        },
      ],
      count: 1,
    })

    const lastModified = first.headers.get('Last-Modified')
    const second = await GET(
      new Request('http://localhost/api/events/current', {
        headers: {
          'if-modified-since': lastModified || '',
        },
      })
    )

    expect(second.status).toBe(304)
    expect(second.headers.get('X-ZE-Cache-Status')).toBe('HIT')
    expect(second.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=30, stale-while-revalidate=30'
    )
  })

  it('can disable current-events cache quickly via env', async () => {
    process.env.PUBLIC_API_CACHE_DISABLED = 'true'

    const eventRows = [
      {
        _id: 'e-2',
        title: 'Current Event',
        eventDate: new Date('2026-03-22T12:00:00.000Z'),
      },
    ]

    const queryChain = {
      select: vi.fn(),
      sort: vi.fn(),
      limit: vi.fn(),
      lean: vi.fn().mockResolvedValue(eventRows),
    }
    queryChain.select.mockReturnValue(queryChain)
    queryChain.sort.mockReturnValue(queryChain)
    queryChain.limit.mockReturnValue(queryChain)

    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/event', () => ({
      default: {
        find: vi.fn().mockReturnValue(queryChain),
      },
    }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { GET } = await import('@/app/api/events/current/route')
    const response = await GET(new Request('http://localhost/api/events/current'))

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store, no-cache, must-revalidate')
    expect(response.headers.get('Pragma')).toBe('no-cache')
    expect(response.headers.get('Expires')).toBe('0')
    expect(response.headers.get('X-ZE-Cache-Status')).toBe('BYPASS')

    const body = await response.json()
    expect(body).toEqual({
      success: true,
      events: [
        {
          ...eventRows[0],
          eventDate: '2026-03-22T12:00:00.000Z',
        },
      ],
      count: 1,
    })
  })

  it('applies cache headers and supports 304 for ZE Club leaderboard', async () => {
    process.env.ZE_CLUB_LEADERBOARD_CACHE_TTL_SECONDS = '75'
    process.env.ZE_CLUB_LEADERBOARD_RECOMPUTE_FROM_SUBMISSIONS = 'false'

    const users = [
      {
        _id: '507f1f77bcf86cd799439011',
        zeTag: 'ze_alpha',
        points: 120,
        experience: 120,
        zeCoins: 25,
        rank: 'Rookie',
        rankIcon: '/images/ranks/rookie.png',
        profilePhotoUrl: null,
        image: null,
      },
      {
        _id: '507f1f77bcf86cd799439012',
        zeTag: 'ze_bravo',
        points: 300,
        experience: 300,
        zeCoins: 75,
        rank: 'Pro',
        rankIcon: '/images/ranks/pro.png',
        profilePhotoUrl: 'https://cdn.example/avatar.png',
        image: null,
      },
    ]

    const seasonChain = {
      select: vi.fn(),
      lean: vi.fn().mockResolvedValue({
        seasonNumber: 7,
        name: 'Season 7',
        updatedAt: new Date('2026-03-22T00:00:00.000Z'),
      }),
    }
    seasonChain.select.mockReturnValue(seasonChain)

    const userQueryChain = {
      lean: vi.fn().mockResolvedValue(users),
    }

    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue(null),
    }))
    vi.doMock('@/models/season', () => ({
      default: {
        findOne: vi.fn().mockReturnValue(seasonChain),
      },
    }))
    vi.doMock('@/models/user', () => ({
      default: {
        find: vi.fn().mockReturnValue(userQueryChain),
        bulkWrite: vi.fn().mockResolvedValue(undefined),
      },
    }))
    vi.doMock('@/models/missionSubmission', () => ({
      default: {
        aggregate: vi.fn().mockResolvedValue([]),
      },
    }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { GET } = await import('@/app/api/ze-club/leaderboard/route')

    const first = await GET(new Request('http://localhost/api/ze-club/leaderboard?limit=2'), undefined)
    expect(first.status).toBe(200)
    expect(first.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=75, stale-while-revalidate=60'
    )
    expect(first.headers.get('ETag')).toBeTruthy()
    expect(first.headers.get('Last-Modified')).toBeTruthy()
    expect(first.headers.get('X-ZE-Cache-Status')).toBe('MISS')

    const body = await first.json()
    expect(body).toEqual({
      leaderboard: [
        {
          _id: '507f1f77bcf86cd799439012',
          rank: 1,
          userRank: 'Pro',
          profilePhoto: 'https://cdn.example/avatar.png',
          zeTag: 'ze_bravo',
          points: 300,
        },
        {
          _id: '507f1f77bcf86cd799439011',
          rank: 2,
          userRank: 'Rookie',
          profilePhoto: null,
          zeTag: 'ze_alpha',
          points: 120,
        },
      ],
      pagination: {
        limit: 2,
        hasMore: false,
        nextCursor: null,
      },
      season: {
        seasonNumber: 7,
        name: 'Season 7',
      },
    })

    const etag = first.headers.get('ETag')
    const second = await GET(
      new Request('http://localhost/api/ze-club/leaderboard?limit=2', {
        headers: {
          'if-none-match': etag || '',
        },
      }),
      undefined
    )

    expect(second.status).toBe(304)
    expect(second.headers.get('Cache-Control')).toBe(
      'public, max-age=0, s-maxage=75, stale-while-revalidate=60'
    )
    expect(second.headers.get('X-ZE-Cache-Status')).toBe('HIT')
  })

  it('keeps ZE Club dashboard private with no-store headers', async () => {
    const userQueryChain = {
      lean: vi.fn().mockResolvedValue({
        points: 10,
        zeCoins: 4,
        experience: 10,
        rank: 'Rookie',
        badge: '🥉',
        progress: 12,
        zeTag: 'ze_test',
        rankIcon: '/images/ranks/rookie.png',
        progressToNextRank: 5,
        nextRankPoints: 500,
        currentRankPoints: 10,
        discordId: 'discord-user-1',
        discordUsername: 'ze_discord',
        discordGlobalName: 'ZE Discord',
        discordAvatar: 'https://cdn.discordapp.com/avatars/discord-user-1/avatar.png',
        discordSync: {
          linkStatus: 'linked_verified',
          verified: true,
          lastSyncedAt: new Date('2026-04-01T12:00:00.000Z'),
          lastSyncStatus: 'succeeded',
          lastSyncError: null,
          lastSyncErrorAt: null,
        },
      }),
    }

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue({
        user: {
          email: 'test@example.com',
        },
      }),
    }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/lib/ze-club/seasonTransition', () => ({
      checkAndAutoEndSeason: vi.fn().mockResolvedValue(undefined),
      getCurrentSeason: vi.fn().mockResolvedValue({ seasonNumber: 3, name: 'Season 3' }),
    }))
    vi.doMock('@/models/user', () => ({
      default: {
        findOne: vi.fn().mockReturnValue(userQueryChain),
        countDocuments: vi.fn().mockResolvedValue(2),
      },
    }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { GET } = await import('@/app/api/ze-club/user/dashboard/route')
    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store, no-cache, must-revalidate')
    expect(response.headers.get('Pragma')).toBe('no-cache')
    expect(response.headers.get('Expires')).toBe('0')

    const body = await response.json()
    expect(body).toEqual({
      totalPoints: 10,
      zeCoins: 4,
      experience: 10,
      rank: 'Rookie',
      leaderboardRank: 3,
      badge: '🥉',
      progress: 12,
      zeTag: 'ze_test',
      rankIcon: '/images/ranks/rookie.png',
      progressToNextRank: 5,
      nextRankPoints: 500,
      currentRankPoints: 10,
      season: {
        seasonNumber: 3,
        name: 'Season 3',
      },
      discord: {
        linked: true,
        verified: true,
        eligibleForRoleSync: true,
        profile: {
          username: 'ze_discord',
          globalName: 'ZE Discord',
          avatar: 'https://cdn.discordapp.com/avatars/discord-user-1/avatar.png',
        },
        sync: {
          linkStatus: 'linked_verified',
          lastSyncedAt: '2026-04-01T12:00:00.000Z',
          lastSyncStatus: 'succeeded',
          lastSyncError: null,
          lastSyncErrorAt: null,
        },
      },
    })
  })
})

describe('admin submissions cache safety', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('keeps unauthorized admin submissions response non-cacheable', async () => {
    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue(null),
    }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { GET } = await import('@/app/api/admin/submissions/route')
    const response = await GET(new Request('http://localhost/api/admin/submissions'))

    expect(response.status).toBe(401)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store, no-cache, must-revalidate')
    expect(response.headers.get('Pragma')).toBe('no-cache')
    expect(response.headers.get('Expires')).toBe('0')

    const body = await response.json()
    expect(body).toEqual({
      error: 'Unauthorized',
      success: false,
    })
  })

  it('keeps successful admin submissions response non-cacheable', async () => {
    const chain = {
      populate: vi.fn(),
      sort: vi.fn().mockResolvedValue([{ _id: 'sub-1' }]),
    }
    chain.populate.mockReturnValue(chain)

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue({ user: { roles: ['admin'] } }),
    }))
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/missionSubmission', () => ({
      default: {
        find: vi.fn().mockReturnValue(chain),
      },
    }))
    vi.doMock('@/models/mission', () => ({ default: { modelName: 'Mission' } }))
    vi.doMock('@/models/user', () => ({ default: { modelName: 'User' } }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { GET } = await import('@/app/api/admin/submissions/route')
    const response = await GET(new Request('http://localhost/api/admin/submissions?status=all'))

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe('private, no-store, no-cache, must-revalidate')
    expect(response.headers.get('Pragma')).toBe('no-cache')
    expect(response.headers.get('Expires')).toBe('0')
    await expect(response.json()).resolves.toEqual([{ _id: 'sub-1' }])
  })
})
