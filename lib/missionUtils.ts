/**
 * Utility functions for mission scheduling and availability
 */

import { IMission } from '@/models/mission'
import logger from '@/lib/logger'

/**
 * Check if a mission is currently active based on its schedule
 * @param mission - The mission to check
 * @param currentTime - Optional current time (defaults to now)
 * @returns true if the mission is currently available
 */
export function isMissionCurrentlyActive(
  mission: IMission | any,
  currentTime: Date = new Date()
): boolean {
  // Check if mission is active (not deactivated)
  if (!mission.active) {
    return false
  }

  // Check date-based time limits
  if (mission.isTimeLimited) {
    const now = currentTime.getTime()
    
    if (mission.startDate && now < new Date(mission.startDate).getTime()) {
      return false // Not started yet
    }
    
    if (mission.endDate && now > new Date(mission.endDate).getTime()) {
      return false // Already ended
    }
  }

  // Check hourly schedule
  if (mission.isHourlyScheduled && mission.hourlySchedule) {
    const { startHour, endHour, timezone } = mission.hourlySchedule
    
    // Get current hour in the mission's timezone
    const currentHour = getCurrentHourInTimezone(currentTime, timezone || 'UTC')
    
    // endHour is INCLUSIVE: if endHour=17, mission is active during the 17:00–17:59 window
    if (currentHour < startHour || currentHour > endHour) {
      return false // Outside of scheduled hours
    }
  }

  // Check max completions
  if (mission.maxCompletions && mission.currentCompletions >= mission.maxCompletions) {
    return false // Max completions reached
  }

  return true
}

/**
 * Get the current hour in a specific timezone (0-23)
 * @param date - The date to check
 * @param timezone - The timezone to use (e.g., 'UTC', 'America/New_York')
 * @returns The current hour (0-23) in the specified timezone
 */
export function getCurrentHourInTimezone(date: Date, timezone: string): number {
  try {
    // Use Intl.DateTimeFormat with hourCycle: 'h23' to guarantee 0–23 range.
    // IMPORTANT: Do NOT use hour12: false — in Node.js/V8 with the en-US locale,
    // midnight (00:xx) is formatted as "24" (CLDR h24 behaviour), causing
    // parseInt("24") = 24 which is outside 0-23 and always fails the endHour check.
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hourCycle: 'h23', // h23 always returns 0–23 (midnight = 0, not 24)
      timeZone: timezone,
    })

    const parts = formatter.formatToParts(date)
    const hourPart = parts.find((p) => p.type === 'hour')
    const hour = parseInt(hourPart?.value ?? '0', 10)

    // Normalize just in case: some runtimes may still emit 24 for midnight
    return hour % 24
  } catch (error) {
    logger.error('Error getting hour in timezone:', error)
    // Fallback to UTC
    return date.getUTCHours()
  }
}

/**
 * Get the next time a mission will be available
 * @param mission - The mission to check
 * @param currentTime - Optional current time (defaults to now)
 * @returns Date when mission will next be available, or null if never/already available
 */
export function getNextAvailableTime(
  mission: IMission | any,
  currentTime: Date = new Date()
): Date | null {
  if (!mission.active) {
    return null // Mission is deactivated
  }

  // Check date-based time limits
  if (mission.isTimeLimited) {
    const now = currentTime.getTime()
    
    // If has start date and not started yet, return start date
    if (mission.startDate && now < new Date(mission.startDate).getTime()) {
      return new Date(mission.startDate)
    }
    
    // If has end date and already ended, mission won't be available again
    if (mission.endDate && now > new Date(mission.endDate).getTime()) {
      return null
    }
  }

  // Check hourly schedule
  if (mission.isHourlyScheduled && mission.hourlySchedule) {
    const { startHour, endHour, timezone } = mission.hourlySchedule
    const currentHour = getCurrentHourInTimezone(currentTime, timezone || 'UTC')

    if (currentHour < startHour) {
      // Mission starts later today
      const nextAvailable = new Date(currentTime)
      nextAvailable.setHours(startHour, 0, 0, 0)
      return nextAvailable
    } else if (currentHour <= endHour) {
      // Currently within the schedule window → mission is available now
      return null
    } else {
      // Past endHour for today — next window is tomorrow at startHour
      const nextAvailable = new Date(currentTime)
      nextAvailable.setDate(nextAvailable.getDate() + 1)
      nextAvailable.setHours(startHour, 0, 0, 0)
      return nextAvailable
    }
  }

  // Mission is currently available
  return null
}

/**
 * Filter missions to only return currently active ones
 * @param missions - Array of missions to filter
 * @param currentTime - Optional current time (defaults to now)
 * @returns Filtered array of active missions
 */
export function filterActiveMissions(
  missions: IMission[] | any[],
  currentTime: Date = new Date()
): typeof missions {
  return missions.filter(mission => isMissionCurrentlyActive(mission, currentTime))
}

/**
 * Format the hourly schedule for display
 * @param hourlySchedule - The hourly schedule object
 * @returns Formatted string like "09:00 - 17:00 UTC"
 */
export function formatHourlySchedule(hourlySchedule?: {
  startHour: number
  endHour: number
  timezone?: string
}): string | null {
  if (!hourlySchedule) {
    return null
  }

  const { startHour, endHour, timezone } = hourlySchedule
  const start = startHour.toString().padStart(2, '0') + ':00'
  const end = endHour.toString().padStart(2, '0') + ':00'
  const tz = timezone || 'UTC'

  return `${start} - ${end} ${tz}`
}

/**
 * Get the ISO week number for a date in format "YYYY-WXX"
 * @param date - The date to get the week number for
 * @returns ISO week string like "2024-W05"
 */
export function getWeekNumber(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${weekNum.toString().padStart(2, '0')}`
}

/**
 * Get the start date (Monday) of a given week
 * @param date - Any date in the week
 * @returns The Monday of that week
 */
export function getWeekStartDate(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is Sunday
  return new Date(d.setDate(diff))
}

/**
 * Check if a weekly mission is available today based on its day
 * @param mission - The mission to check
 * @param currentTime - Optional current time (defaults to now)
 * @returns true if today matches the mission's weekly day
 */
export function isWeeklyMissionAvailableToday(
  mission: IMission | any,
  currentTime: Date = new Date()
): boolean {
  if (!mission.isWeeklyMission || mission.weeklyDay === undefined) {
    return false
  }

  const today = currentTime.getDay() // 0-6 (Sunday-Saturday)
  return today === mission.weeklyDay
}

/**
 * Check if a weekly mission should be shown to a user
 * @param mission - The mission to check
 * @param userSubmissions - Array of user's submissions for this mission
 * @param currentTime - Optional current time (defaults to now)
 * @returns true if the mission should be displayed
 */
export function shouldShowWeeklyMission(
  mission: IMission | any,
  userSubmissions: any[] = [],
  currentTime: Date = new Date()
): boolean {
  if (!mission.isWeeklyMission) {
    return false
  }

  const currentWeek = getWeekNumber(currentTime)

  // Check if user has an active (pending or approved) submission for this week
  const hasActiveSubmissionThisWeek = userSubmissions.some(
    submission =>
      submission.weekYear === currentWeek &&
      ['pending', 'approved'].includes(submission.status)
  )

  // Mission should show if:
  // 1. Today is the mission's day, OR
  // 2. User has an active submission for this week (incomplete mission stays visible)
  return isWeeklyMissionAvailableToday(mission, currentTime) || hasActiveSubmissionThisWeek
}

/**
 * Get the next date when a weekly mission will become available
 * @param mission - The weekly mission
 * @param currentTime - Optional current time (defaults to now)
 * @returns Date of next availability
 */
export function getNextWeeklyInstanceDate(
  mission: IMission | any,
  currentTime: Date = new Date()
): Date {
  if (!mission.isWeeklyMission || mission.weeklyDay === undefined) {
    return currentTime
  }

  const today = currentTime.getDay()
  const targetDay = mission.weeklyDay

  const nextDate = new Date(currentTime)

  if (today === targetDay) {
    // Today is the day, but next instance is next week
    nextDate.setDate(nextDate.getDate() + 7)
  } else if (today < targetDay) {
    // Target day is later this week
    nextDate.setDate(nextDate.getDate() + (targetDay - today))
  } else {
    // Target day was earlier this week, so next instance is next week
    nextDate.setDate(nextDate.getDate() + (7 - today + targetDay))
  }

  // Reset time to 00:00:00
  nextDate.setHours(0, 0, 0, 0)
  return nextDate
}

/**
 * Get a human-readable day name from week day number
 * @param dayNum - Day number 0-6 (Sunday-Saturday)
 * @returns Day name like "Monday"
 */
export function getDayName(dayNum: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayNum] || 'Unknown'
}
