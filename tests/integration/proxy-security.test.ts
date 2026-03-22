import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

describe('proxy security headers and auth-safe limits', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    delete process.env.CSP_ENFORCE
    delete process.env.CSP_SCRIPT_SRC_EXTRA
    delete process.env.CSP_STYLE_SRC_EXTRA
  })

  it('emits CSP report-only and modern security headers on API responses by default', async () => {
    const checkRateLimit = vi
      .fn()
      .mockResolvedValueOnce({ success: true, limit: 120, remaining: 119, reset: 9999999999 })
      .mockResolvedValueOnce({ success: true, limit: 5, remaining: 4, reset: 9999999999 })

    vi.doMock('@/lib/rate-limit', () => ({
      getClientIp: vi.fn(() => '1.2.3.4'),
      checkRateLimit,
      buildRateLimitHeaders: vi.fn().mockReturnValue({
        'X-RateLimit-Limit': '120',
        'X-RateLimit-Remaining': '119',
        'X-RateLimit-Reset': '9999999999',
      }),
      getRateLimitRule: vi.fn((name: string) => {
        if (name === 'apiDefault') {
          return { prefix: 'rl:api:default', limit: 120, windowSeconds: 60 }
        }
        if (name === 'apiAuth') {
          return { prefix: 'rl:api:auth', limit: 20, windowSeconds: 600 }
        }
        return { prefix: 'rl:api:contact', limit: 5, windowSeconds: 600 }
      }),
    }))

    const { proxy } = await import('@/proxy')

    const request = new NextRequest('http://localhost/api/contact', {
      method: 'GET',
    })

    const response = await proxy(request)

    expect(response.headers.get('Content-Security-Policy-Report-Only')).toContain("default-src 'self'")
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    expect(response.headers.get('Permissions-Policy')).toContain('camera=()')
  })

  it('does not apply auth-specific limit to GET /api/auth/session', async () => {
    const checkRateLimit = vi
      .fn()
      .mockResolvedValueOnce({ success: true, limit: 120, remaining: 119, reset: 9999999999 })

    vi.doMock('@/lib/rate-limit', () => ({
      getClientIp: vi.fn(() => '2.2.2.2'),
      checkRateLimit,
      buildRateLimitHeaders: vi.fn().mockReturnValue({}),
      getRateLimitRule: vi.fn((name: string) => {
        if (name === 'apiDefault') {
          return { prefix: 'rl:api:default', limit: 120, windowSeconds: 60 }
        }
        if (name === 'apiAuth') {
          return { prefix: 'rl:api:auth', limit: 20, windowSeconds: 600 }
        }
        return { prefix: 'rl:api:contact', limit: 5, windowSeconds: 600 }
      }),
    }))

    const { proxy } = await import('@/proxy')

    const request = new NextRequest('http://localhost/api/auth/session', {
      method: 'GET',
    })

    const response = await proxy(request)

    expect(response.status).toBe(200)
    expect(checkRateLimit).toHaveBeenCalledTimes(1)
    expect(checkRateLimit).toHaveBeenCalledWith(
      expect.objectContaining({
        prefix: 'rl:api:default',
      })
    )
  })
})
