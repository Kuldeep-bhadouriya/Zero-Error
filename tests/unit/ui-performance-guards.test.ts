import { afterEach, describe, expect, it, vi } from 'vitest'
import type { HyperspeedOptions } from '@/components/Hyperspeed'
import { getZeClubNavItems } from '@/components/ze-club/ZEClubLayout'
import { buildHyperspeedOptions, scheduleIdleStart } from '@/components/Hyperspeed'
import { getVisibleAnnouncements } from '@/components/home/AnnouncementsSection'

describe('ui performance guards', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete (globalThis as Record<string, unknown>).requestIdleCallback
    delete (globalThis as Record<string, unknown>).cancelIdleCallback
  })

  it('keeps ZE Club nav items reference stable to avoid avoidable rerender churn', () => {
    const first = getZeClubNavItems()
    const second = getZeClubNavItems()

    expect(first).toBe(second)
    expect(first.length).toBeGreaterThanOrEqual(7)
  })

  it('uses requestIdleCallback path when available for deferred Hyperspeed startup', () => {
    const start = vi.fn()
    const cancelIdleCallback = vi.fn()

    const requestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
      callback({
        didTimeout: false,
        timeRemaining: () => 10,
      } as IdleDeadline)
      return 42
    })

    ;(globalThis as Record<string, unknown>).requestIdleCallback = requestIdleCallback
    ;(globalThis as Record<string, unknown>).cancelIdleCallback = cancelIdleCallback

    const cancel = scheduleIdleStart(start)

    expect(requestIdleCallback).toHaveBeenCalledOnce()
    expect(start).toHaveBeenCalledOnce()

    cancel()
    expect(cancelIdleCallback).toHaveBeenCalledWith(42)
  })

  it('falls back to setTimeout path when requestIdleCallback is unavailable', () => {
    const start = vi.fn()
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation((cb: TimerHandler) => {
      if (typeof cb === 'function') {
        cb()
      }
      return 7 as unknown as ReturnType<typeof setTimeout>
    })
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout').mockImplementation(() => undefined)

    const cancel = scheduleIdleStart(start)

    expect(setTimeoutSpy).toHaveBeenCalledOnce()
    expect(start).toHaveBeenCalledOnce()

    cancel()
    expect(clearTimeoutSpy).toHaveBeenCalledWith(7)
  })

  it('preserves Hyperspeed merge contract for colors and distortion resolution', () => {
    const options = buildHyperspeedOptions({
      distortion: 'turbulentDistortion',
      colors: {
        background: 0x111111,
      },
    } as Partial<HyperspeedOptions>)

    expect(typeof options.distortion).toBe('object')
    expect(options.colors.background).toBe(0x111111)
    expect(options.colors.roadColor).toBeDefined()
    expect(options.length).toBeGreaterThan(0)
  })

  it('caps visible announcements to top three for bounded render work', () => {
    const announcements = [
      { _id: '1', title: 'A', message: 'A', type: 'info', priority: 1, active: true, dismissible: true },
      { _id: '2', title: 'B', message: 'B', type: 'warning', priority: 2, active: true, dismissible: true },
      { _id: '3', title: 'C', message: 'C', type: 'success', priority: 3, active: true, dismissible: true },
      { _id: '4', title: 'D', message: 'D', type: 'urgent', priority: 4, active: true, dismissible: true },
    ] as const

    const visible = getVisibleAnnouncements(announcements)
    expect(visible).toHaveLength(3)
    expect(visible.map((item) => item._id)).toEqual(['1', '2', '3'])
  })
})
