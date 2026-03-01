import { describe, expect, it } from 'vitest'
import { buildRateLimitHeaders, checkRateLimit, getClientIp } from '../../lib/rate-limit'

describe('rate-limit helpers', () => {
  it('extracts first forwarded ip', () => {
    const request = new Request('https://example.com', {
      headers: {
        'x-forwarded-for': '10.0.0.1, 172.16.0.2',
      },
    })

    expect(getClientIp(request)).toBe('10.0.0.1')
  })

  it('falls back to unknown when no ip headers exist', () => {
    const request = new Request('https://example.com')
    expect(getClientIp(request)).toBe('unknown')
  })

  it('builds rate limit headers', () => {
    const reset = Math.ceil(Date.now() / 1000) + 60
    const headers = buildRateLimitHeaders({
      success: false,
      limit: 10,
      remaining: 0,
      reset,
    }) as Record<string, string>

    expect(headers['X-RateLimit-Limit']).toBe('10')
    expect(headers['X-RateLimit-Remaining']).toBe('0')
    expect(headers['X-RateLimit-Reset']).toBe(String(reset))
  })

  it('enforces local fallback rate limit counters', async () => {
    const key = `user-${Date.now()}`
    const params = {
      key,
      prefix: 'test-local',
      limit: 2,
      windowSeconds: 60,
    }

    const first = await checkRateLimit(params)
    const second = await checkRateLimit(params)
    const third = await checkRateLimit(params)

    expect(first.success).toBe(true)
    expect(second.success).toBe(true)
    expect(third.success).toBe(false)
    expect(third.remaining).toBe(0)
  })
})
