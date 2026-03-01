import { describe, expect, it } from 'vitest'
import {
  filterActiveMissions,
  formatHourlySchedule,
  getCurrentHourInTimezone,
  getDayName,
  getNextAvailableTime,
  getNextWeeklyInstanceDate,
  getWeekNumber,
  isMissionCurrentlyActive,
  isWeeklyMissionAvailableToday,
  shouldShowWeeklyMission,
} from '../../lib/missionUtils'

describe('missionUtils', () => {
  it('returns inactive when mission is disabled', () => {
    const mission = { active: false }
    expect(isMissionCurrentlyActive(mission)).toBe(false)
  })

  it('respects inclusive hourly schedule end hour', () => {
    const mission = {
      active: true,
      isHourlyScheduled: true,
      hourlySchedule: { startHour: 9, endHour: 17, timezone: 'UTC' },
    }

    const atEndHour = new Date('2026-01-10T17:30:00Z')
    expect(isMissionCurrentlyActive(mission, atEndHour)).toBe(true)
  })

  it('returns next day when current time is past hourly window', () => {
    const mission = {
      active: true,
      isHourlyScheduled: true,
      hourlySchedule: { startHour: 9, endHour: 17, timezone: 'UTC' },
    }

    const now = new Date('2026-01-10T20:30:00Z')
    const next = getNextAvailableTime(mission, now)

    expect(next).not.toBeNull()
    expect(next?.toISOString()).toBe('2026-01-11T09:00:00.000Z')
  })

  it('falls back to UTC hour for invalid timezone', () => {
    const date = new Date('2026-01-10T14:30:00Z')
    const hour = getCurrentHourInTimezone(date, 'Invalid/Timezone')
    expect(hour).toBe(14)
  })

  it('formats hourly schedule for display', () => {
    expect(formatHourlySchedule({ startHour: 9, endHour: 17, timezone: 'UTC' })).toBe(
      '09:00 - 17:00 UTC'
    )
  })

  it('computes ISO week number', () => {
    expect(getWeekNumber(new Date('2026-01-01T12:00:00Z'))).toBe('2026-W01')
  })

  it('shows weekly mission when today matches weekly day', () => {
    const mission = { isWeeklyMission: true, weeklyDay: 2 }
    const date = new Date('2026-01-06T10:00:00Z') // Tuesday
    expect(isWeeklyMissionAvailableToday(mission, date)).toBe(true)
  })

  it('keeps weekly mission visible with pending submission in same week', () => {
    const mission = { isWeeklyMission: true, weeklyDay: 4 }
    const now = new Date('2026-01-06T10:00:00Z')
    const week = getWeekNumber(now)
    const submissions = [{ weekYear: week, status: 'pending' }]

    expect(shouldShowWeeklyMission(mission, submissions, now)).toBe(true)
  })

  it('computes next weekly instance date at midnight', () => {
    const mission = { isWeeklyMission: true, weeklyDay: 5 } // Friday
    const now = new Date('2026-01-06T15:45:00Z') // Tuesday
    const next = getNextWeeklyInstanceDate(mission, now)

    expect(next.toISOString()).toBe('2026-01-09T00:00:00.000Z')
  })

  it('filters only currently active missions', () => {
    const now = new Date('2026-01-10T10:00:00Z')
    const missions = [
      { id: 1, active: true },
      { id: 2, active: false },
    ]

    const active = filterActiveMissions(missions, now)
    expect(active).toHaveLength(1)
    expect(active[0].id).toBe(1)
  })

  it('returns unknown for invalid day names', () => {
    expect(getDayName(99)).toBe('Unknown')
  })
})
