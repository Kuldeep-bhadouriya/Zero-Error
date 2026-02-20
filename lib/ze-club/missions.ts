import dbConnect from '@/lib/mongodb'
import Mission from '@/models/mission'
import MissionSubmission from '@/models/missionSubmission'
import User from '@/models/user'
import {
  isMissionCurrentlyActive,
  shouldShowWeeklyMission,
  getNextWeeklyInstanceDate,
  getDayName,
  getWeekNumber,
} from '@/lib/missionUtils'

export type MissionWithComputed = {
  [key: string]: any

  _id: string
  name: string
  points: number
  description?: string
  category?: string
  difficulty?: string
  requiredProofType?: 'image' | 'video' | 'both'
  instructions?: string
  exampleImageUrl?: string

  isTimeLimited?: boolean
  startDate?: string
  endDate?: string

  isHourlyScheduled?: boolean
  hourlySchedule?: {
    startHour: number
    endHour: number
    timezone?: string
  }

  isWeeklyMission?: boolean
  weeklyDay?: number
  weeklyDayName?: string
  nextWeeklyAvailableDate?: string

  maxCompletions?: number
  currentCompletions?: number
  featured?: boolean

  isExpired?: boolean
  daysRemaining?: number | null
  isMaxedOut?: boolean
  isCompleted?: boolean
  isPending?: boolean
  isAvailable?: boolean
}

export async function getMissionsForUserEmail(email?: string | null): Promise<MissionWithComputed[]> {
  await dbConnect()

  const now = new Date()

  const filter: any = {
    active: true,
    $or: [{ startDate: { $exists: false } }, { startDate: null }, { startDate: { $lte: now } }],
  }

  const missions = await Mission.find(filter)
    .select('-createdBy -deactivatedBy -deactivatedAt')
    .sort({ featured: -1, createdAt: -1 })
    .lean() // Convert to plain objects

  let userSubmissions: any[] = []

  if (email) {
    const user = await User.findOne({ email }).lean() as any
    if (user) {
      userSubmissions = await MissionSubmission.find({
        user: user._id,
      })
        .select('mission status weekYear')
        .lean()
    }
  }

  const submissionMap = new Map(userSubmissions.map((sub) => [sub.mission.toString(), sub]))

  const availableMissions = missions
    .map((mission: any) => {
      let isExpired = false
      let daysRemaining: number | null = null

      if (mission.isTimeLimited && mission.endDate) {
        const endDate = new Date(mission.endDate)
        isExpired = endDate < now
        if (!isExpired) {
          const diffTime = endDate.getTime() - now.getTime()
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        }
      }

      const isMaxedOut = mission.maxCompletions
        ? mission.currentCompletions >= mission.maxCompletions
        : false

      // Get user's submissions for this mission (grouped by mission ID)
      const missionSubmission = submissionMap.get(mission._id.toString())
      const missionSubmissions = userSubmissions.filter(
        (sub) => sub.mission.toString() === mission._id.toString()
      )

      const isCompleted = missionSubmission
        ? missionSubmission.status === 'approved'
        : false
      const isPending = missionSubmission
        ? missionSubmission.status === 'pending'
        : false

      // Check if mission is available
      let isCurrentlyActive = false
      let weeklyDayName: string | undefined
      let nextWeeklyAvailableDate: string | undefined

      if (mission.isWeeklyMission) {
        weeklyDayName = getDayName(mission.weeklyDay)
        isCurrentlyActive = shouldShowWeeklyMission(mission, missionSubmissions, now)

        // Calculate next available date
        const nextDate = getNextWeeklyInstanceDate(mission, now)
        nextWeeklyAvailableDate = nextDate.toISOString()
      } else {
        isCurrentlyActive = isMissionCurrentlyActive(mission, now)
      }

      // Convert _id to string and dates to ISO strings for serialization
      return {
        ...mission,
        _id: mission._id.toString(),
        startDate: mission.startDate ? new Date(mission.startDate).toISOString() : undefined,
        endDate: mission.endDate ? new Date(mission.endDate).toISOString() : undefined,
        createdAt: mission.createdAt ? new Date(mission.createdAt).toISOString() : undefined,
        updatedAt: mission.updatedAt ? new Date(mission.updatedAt).toISOString() : undefined,
        weeklyDayName,
        nextWeeklyAvailableDate,
        isExpired,
        daysRemaining,
        isMaxedOut,
        isCompleted,
        isPending,
        isAvailable: isCurrentlyActive && !isExpired && !isMaxedOut && !isCompleted && !isPending,
      } as MissionWithComputed
    })
    .filter((mission: MissionWithComputed) => mission.isAvailable)

  return availableMissions
}
