/**
 * Utility functions for mission scheduling and availability
 */

import { IMission } from '@/models/mission'

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
    
    // Check if current hour is within the scheduled range
    if (currentHour < startHour || currentHour >= endHour) {
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
    // Use Intl.DateTimeFormat to get the hour in the specified timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      hour12: false,
      timeZone: timezone,
    })
    
    const hourString = formatter.format(date)
    const hour = parseInt(hourString, 10)
    
    return hour
  } catch (error) {
    console.error('Error getting hour in timezone:', error)
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
    const { startHour, timezone } = mission.hourlySchedule
    const currentHour = getCurrentHourInTimezone(currentTime, timezone || 'UTC')
    
    if (currentHour < startHour) {
      // Mission starts later today
      const nextAvailable = new Date(currentTime)
      nextAvailable.setHours(startHour, 0, 0, 0)
      return nextAvailable
    } else {
      // Mission starts tomorrow at startHour
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
