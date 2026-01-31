import dbConnect from '@/lib/mongodb'
import Mission from '@/models/mission'
import MissionSubmission from '@/models/missionSubmission'
import User from '@/models/user'

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

  let userSubmissions: any[] = []

  if (email) {
    const user = await User.findOne({ email })
    if (user) {
      userSubmissions = await MissionSubmission.find({
        user: user._id,
        status: { $in: ['pending', 'approved'] },
      }).select('mission status')
    }
  }

  const submissionMap = new Map(userSubmissions.map((sub) => [sub.mission.toString(), sub.status]))

  const availableMissions = missions
    .map((mission: any) => {
      const missionObj = mission.toObject()

      let isExpired = false
      let daysRemaining: number | null = null

      if (mission.isTimeLimited && mission.endDate) {
        isExpired = mission.endDate < now
        if (!isExpired) {
          const diffTime = mission.endDate.getTime() - now.getTime()
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        }
      }

      const isMaxedOut = mission.maxCompletions
        ? mission.currentCompletions >= mission.maxCompletions
        : false

      const userSubmissionStatus = submissionMap.get(mission._id.toString())
      const isCompleted = userSubmissionStatus === 'approved'
      const isPending = userSubmissionStatus === 'pending'

      return {
        ...missionObj,
        isExpired,
        daysRemaining,
        isMaxedOut,
        isCompleted,
        isPending,
        isAvailable: !isExpired && !isMaxedOut && !isCompleted && !isPending,
      } as MissionWithComputed
    })
    .filter((mission: MissionWithComputed) => !mission.isExpired && !mission.isMaxedOut)

  return availableMissions
}
