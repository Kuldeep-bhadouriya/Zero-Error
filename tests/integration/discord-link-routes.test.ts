import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDiscordLinkState } from '@/lib/discord-link'

function createLoggerMock() {
  return {
    default: {
      info: vi.fn(),
      error: vi.fn(),
    },
  }
}

function createRateLimitMock(success = true) {
  return {
    checkRateLimit: vi.fn().mockResolvedValue({
      success,
      limit: 10,
      remaining: success ? 9 : 0,
      reset: Math.ceil(Date.now() / 1000) + 60,
    }),
    getRateLimitRule: vi.fn().mockReturnValue({
      prefix: 'rl:test',
      limit: 10,
      windowSeconds: 60,
    }),
    buildRateLimitHeaders: vi.fn().mockReturnValue({
      'X-RateLimit-Limit': '10',
      'X-RateLimit-Remaining': success ? '9' : '0',
      'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + 60),
      'Retry-After': '60',
    }),
  }
}

describe('discord link routes', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
    process.env.DISCORD_CLIENT_ID = 'discord-client-id'
    process.env.DISCORD_CLIENT_SECRET = 'discord-client-secret'
    process.env.NEXTAUTH_SECRET = 'nextauth-secret'
  })

  it('returns 401 for link/start when session is missing', async () => {
    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({ auth: vi.fn().mockResolvedValue(null) }))
    vi.doMock('@/lib/logger', createLoggerMock)
    vi.doMock('@/lib/rate-limit', () => createRateLimitMock(true))

    const { POST } = await import('@/app/api/user/discord/link/start/route')

    const response = await POST(
      new Request('http://localhost/api/user/discord/link/start', {
        method: 'POST',
        body: JSON.stringify({ redirectTo: '/ze-club' }),
      }),
      {} as never
    )

    expect(response.status).toBe(401)
  })

  it('returns OAuth authorization URL for link/start with authenticated user', async () => {
    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', roles: ['user'] } }),
    }))
    vi.doMock('@/lib/logger', createLoggerMock)
    vi.doMock('@/lib/rate-limit', () => createRateLimitMock(true))

    const { POST } = await import('@/app/api/user/discord/link/start/route')

    const response = await POST(
      new Request('http://localhost/api/user/discord/link/start', {
        method: 'POST',
        body: JSON.stringify({ redirectTo: '/ze-club' }),
      }),
      {} as never
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.authorizationUrl).toContain('https://discord.com/oauth2/authorize')
    expect(payload.authorizationUrl).toContain('client_id=discord-client-id')
    expect(payload.authorizationUrl).toContain('redirect_uri=')
    expect(payload.authorizationUrl).toContain('state=')
  })

  it('links account successfully on callback for authenticated user', async () => {
    const save = vi.fn().mockResolvedValue(undefined)
    const userDoc = {
      _id: 'mongo-user-1',
      discordId: undefined,
      discordUsername: undefined,
      discordGlobalName: undefined,
      discordAvatar: undefined,
      discordSync: {
        linkStatus: 'unlinked',
        verified: false,
        lastSyncStatus: 'idle',
      },
      save,
    }

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', roles: ['user'] } }),
    }))
    vi.doMock('@/lib/logger', createLoggerMock)
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/user', () => ({
      default: {
        findById: vi.fn().mockResolvedValue(userDoc),
        exists: vi.fn().mockResolvedValue(null),
      },
    }))
    vi.doMock('@/lib/rate-limit', () => createRateLimitMock(true))

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ access_token: 'oauth-token' }), { status: 200 })
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              id: 'discord-123',
              username: 'ze-discord',
              global_name: 'ZE Discord',
              avatar: 'avatar-hash',
            }),
            { status: 200 }
          )
        )
    )

    const { state } = createDiscordLinkState({
      userId: 'user-1',
      redirectTo: '/ze-club',
    })

    const { GET } = await import('@/app/api/user/discord/link/callback/route')

    const response = await GET(
      new Request(
        `http://localhost/api/user/discord/link/callback?code=oauth-code&state=${encodeURIComponent(state)}`
      ),
      {} as never
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.success).toBe(true)
    expect(payload.eligibleForRoleSync).toBe(true)
    expect(save).toHaveBeenCalledOnce()
  })

  it('rejects callback when Discord account is already linked to another user', async () => {
    const userDoc = {
      _id: 'mongo-user-1',
      discordId: undefined,
      discordSync: {
        linkStatus: 'unlinked',
        verified: false,
      },
      save: vi.fn(),
    }

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', roles: ['user'] } }),
    }))
    vi.doMock('@/lib/logger', createLoggerMock)
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/user', () => ({
      default: {
        findById: vi.fn().mockResolvedValue(userDoc),
        exists: vi.fn().mockResolvedValue({ _id: 'other-user' }),
      },
    }))
    vi.doMock('@/lib/rate-limit', () => createRateLimitMock(true))

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ access_token: 'oauth-token' }), { status: 200 })
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              id: 'discord-123',
              username: 'ze-discord',
            }),
            { status: 200 }
          )
        )
    )

    const { state } = createDiscordLinkState({ userId: 'user-1' })
    const { GET } = await import('@/app/api/user/discord/link/callback/route')

    const response = await GET(
      new Request(
        `http://localhost/api/user/discord/link/callback?code=oauth-code&state=${encodeURIComponent(state)}`
      ),
      {} as never
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toMatchObject({
      error: 'This Discord account is already linked to another user',
    })
  })

  it('blocks unlink when account is not linked', async () => {
    const userDoc = {
      discordId: undefined,
      discordSync: {
        linkStatus: 'unlinked',
        verified: false,
      },
      save: vi.fn(),
      set: vi.fn(),
    }

    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', roles: ['user'] } }),
    }))
    vi.doMock('@/lib/logger', createLoggerMock)
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/user', () => ({
      default: {
        findById: vi.fn().mockResolvedValue(userDoc),
      },
    }))
    vi.doMock('@/lib/rate-limit', () => createRateLimitMock(true))

    const { POST } = await import('@/app/api/user/discord/unlink/route')

    const response = await POST(
      new Request('http://localhost/api/user/discord/unlink', {
        method: 'POST',
        body: JSON.stringify({ confirm: true }),
      }),
      {} as never
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Discord account is not linked',
    })
  })

  it('returns link status payload for dashboard use', async () => {
    vi.doMock('@/app/api/auth/[...nextauth]/route', () => ({
      auth: vi.fn().mockResolvedValue({ user: { id: 'user-1', roles: ['user'] } }),
    }))
    vi.doMock('@/lib/logger', createLoggerMock)
    vi.doMock('@/lib/mongodb', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
    vi.doMock('@/models/user', () => ({
      default: {
        findById: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue({
            discordId: 'discord-123',
            discordUsername: 'ze-discord',
            discordGlobalName: 'ZE Discord',
            discordAvatar: 'https://cdn.discordapp.com/avatars/discord-123/avatar-hash.png',
            discordSync: {
              linkStatus: 'linked_verified',
              verified: true,
              lastSyncStatus: 'idle',
              lastSyncedAt: null,
            },
          }),
        }),
      },
    }))
    vi.doMock('@/lib/rate-limit', () => createRateLimitMock(true))

    const { GET } = await import('@/app/api/user/discord/status/route')

    const response = await GET(
      new Request('http://localhost/api/user/discord/status', { method: 'GET' }),
      {} as never
    )

    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.linked).toBe(true)
    expect(payload.verified).toBe(true)
    expect(payload.eligibleForRoleSync).toBe(true)
    expect(payload.discord.id).toBe('discord-123')
  })
})
