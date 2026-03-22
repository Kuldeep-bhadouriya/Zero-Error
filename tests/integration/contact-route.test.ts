import { beforeEach, describe, expect, it, vi } from 'vitest'

const rateLimitHeaders = {
  'X-RateLimit-Limit': '2',
  'X-RateLimit-Remaining': '0',
  'X-RateLimit-Reset': '9999999999',
  'Retry-After': '60',
}

function createLoggerMock() {
  return {
    default: {
      info: vi.fn(),
      error: vi.fn(),
    },
  }
}

describe('contact route', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns 405 for GET requests', async () => {
    vi.doMock('@/lib/logger', createLoggerMock)

    const { GET } = await import('@/app/api/contact/route')
    const response = await GET()

    expect(response.status).toBe(405)
    expect(response.headers.get('allow')).toBe('POST, OPTIONS')
    await expect(response.json()).resolves.toEqual({
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED',
    })
  })

  it('rejects malformed payload with 400', async () => {
    const checkRateLimit = vi.fn().mockResolvedValue({
      success: true,
      limit: 3,
      remaining: 2,
      reset: Math.ceil(Date.now() / 1000) + 600,
    })

    vi.doMock('@/lib/rate-limit', () => ({
      checkRateLimit,
      getRateLimitRule: vi.fn((name: string) =>
        name === 'contactIp'
          ? { prefix: 'rl:contact:ip', limit: 3, windowSeconds: 600 }
          : { prefix: 'rl:contact:email', limit: 2, windowSeconds: 3600 }
      ),
      buildRateLimitHeaders: vi.fn().mockReturnValue(rateLimitHeaders),
    }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { POST } = await import('@/app/api/contact/route')

    const response = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'invalid-email',
          subject: 'Hi',
          message: 'Message',
        }),
      })
    )

    expect(response.status).toBe(400)
    const payload = await response.json()
    expect(payload.error).toBe('Invalid email format')
    expect(payload.code).toBe('INVALID_PAYLOAD')
    expect(Array.isArray(payload.details)).toBe(true)
    expect(checkRateLimit).toHaveBeenCalledTimes(1)
  })

  it('returns deterministic 429 payload when rate limited', async () => {
    vi.doMock('@/lib/rate-limit', () => ({
      checkRateLimit: vi.fn().mockResolvedValue({
        success: false,
        limit: 3,
        remaining: 0,
        reset: Math.ceil(Date.now() / 1000) + 600,
      }),
      getRateLimitRule: vi.fn((name: string) =>
        name === 'contactIp'
          ? { prefix: 'rl:contact:ip', limit: 3, windowSeconds: 600 }
          : { prefix: 'rl:contact:email', limit: 2, windowSeconds: 3600 }
      ),
      buildRateLimitHeaders: vi.fn().mockReturnValue(rateLimitHeaders),
    }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { POST } = await import('@/app/api/contact/route')

    const response = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          subject: 'Hi',
          message: 'Message',
        }),
      })
    )

    expect(response.status).toBe(429)
    expect(response.headers.get('X-RateLimit-Limit')).toBe('2')
    await expect(response.json()).resolves.toEqual({
      error: 'Too many requests. Please try again later.',
      code: 'RATE_LIMITED',
    })
  })

  it('accepts valid payload and sanitizes outbound HTML', async () => {
    const checkRateLimit = vi
      .fn()
      .mockResolvedValueOnce({
        success: true,
        limit: 3,
        remaining: 2,
        reset: Math.ceil(Date.now() / 1000) + 600,
      })
      .mockResolvedValueOnce({
        success: true,
        limit: 2,
        remaining: 1,
        reset: Math.ceil(Date.now() / 1000) + 3600,
      })

    const sendMail = vi.fn().mockResolvedValue({ messageId: 'msg-123' })

    vi.doMock('@/lib/rate-limit', () => ({
      checkRateLimit,
      getRateLimitRule: vi.fn((name: string) =>
        name === 'contactIp'
          ? { prefix: 'rl:contact:ip', limit: 3, windowSeconds: 600 }
          : { prefix: 'rl:contact:email', limit: 2, windowSeconds: 3600 }
      ),
      buildRateLimitHeaders: vi.fn().mockReturnValue(rateLimitHeaders),
    }))
    vi.doMock('nodemailer', () => ({
      default: {
        createTransport: vi.fn().mockReturnValue({ sendMail }),
      },
    }))
    vi.doMock('@/lib/logger', createLoggerMock)

    const { POST } = await import('@/app/api/contact/route')

    const response = await POST(
      new Request('http://localhost/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test <User>',
          email: 'test@example.com',
          subject: 'Help <script>',
          message: 'I need <b>support</b>',
        }),
      })
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({
      message: 'Email sent successfully',
      messageId: 'msg-123',
    })
    expect(sendMail).toHaveBeenCalledOnce()
    const sendMailArg = sendMail.mock.calls[0]?.[0]
    expect(sendMailArg?.html).toContain('&lt;User&gt;')
    expect(sendMailArg?.html).toContain('&lt;script&gt;')
    expect(sendMailArg?.html).toContain('&lt;b&gt;support&lt;/b&gt;')
  })
})
