import { clearUserCache } from '@/lib/userService'
import dbConnect from '@/lib/mongodb'
import RedemptionRequest from '@/models/redemptionRequest'
import {
  adjustMissionCompletionCount,
  findMissionById,
  findSubmissionById,
  findSubmissionByIdWithRelations,
  saveSubmission,
} from '@/lib/repositories/missionRepository'
import { findUserById, saveUser } from '@/lib/repositories/userRepository'
import { applyRankFromExperience } from '@/lib/services/rankService'

type MissionServiceResult<T> = {
  status: number
  data: T
}

type VerifySubmissionInput = {
  submissionId: string
  status: 'approved' | 'rejected'
  adminUserId: string
  rejectReason?: string
}

type RevertSubmissionInput = {
  submissionId: string
  revertReason?: string
  adminUserId: string
}

export async function verifyMissionSubmission(
  input: VerifySubmissionInput
): Promise<MissionServiceResult<{ message: string }>> {
  await dbConnect()

  const submission = await findSubmissionById(input.submissionId)
  if (!submission) {
    return { status: 404, data: { message: 'Submission not found' } }
  }

  if (submission.status !== 'pending') {
    return {
      status: 400,
      data: { message: `Submission is already ${submission.status} and cannot be reviewed again` },
    }
  }

  submission.status = input.status
  if (input.status === 'approved') {
    submission.approvedBy = input.adminUserId
    submission.approvedAt = new Date()
  }
  if (input.status === 'rejected' && input.rejectReason) {
    submission.remarks = input.rejectReason
  }

  await saveSubmission(submission)

  if (input.status === 'approved') {
    const user = await findUserById(String(submission.user))
    const mission = await findMissionById(String(submission.mission))

    if (user && mission) {
      user.zeCoins += mission.points
      user.experience += mission.points
      user.points = user.experience

      applyRankFromExperience(user)
      await saveUser(user)
      await clearUserCache()

      await adjustMissionCompletionCount(String(submission.mission), 1)
    }
  }

  return { status: 200, data: { message: 'Submission status updated successfully' } }
}

export async function revertMissionSubmission(
  input: RevertSubmissionInput
): Promise<
  MissionServiceResult<
    | { message: string; details: Record<string, unknown> }
    | { error: string; details?: Record<string, unknown> }
  >
> {
  await dbConnect()

  const submission = await findSubmissionByIdWithRelations(input.submissionId)
  if (!submission) {
    return { status: 404, data: { error: 'Submission not found' } }
  }

  if (submission.status !== 'approved') {
    return { status: 400, data: { error: 'Only approved submissions can be reverted' } }
  }

  const user = await findUserById(String((submission as any).user._id))
  const mission = await findMissionById(String((submission as any).mission._id))

  if (!user || !mission) {
    return { status: 404, data: { error: 'User or mission not found' } }
  }

  const redemptionRequests = await RedemptionRequest.find({
    userId: user._id,
    status: { $in: ['pending', 'processing', 'completed'] },
  })

  const newZeCoins = user.zeCoins - mission.points

  if (newZeCoins < 0 && redemptionRequests.length > 0) {
    return {
      status: 400,
      data: {
        error: 'Cannot revert: User has active redemption requests and insufficient balance',
        details: {
          currentZeCoins: user.zeCoins,
          pointsToDeduct: mission.points,
          resultingBalance: newZeCoins,
          activeRedemptions: redemptionRequests.length,
        },
      },
    }
  }

  user.zeCoins = Math.max(0, user.zeCoins - mission.points)
  user.experience = Math.max(0, user.experience - mission.points)
  user.points = user.experience

  const oldRank = user.rank
  applyRankFromExperience(user)

  await saveUser(user)
  await clearUserCache()

  submission.status = 'rejected'
  submission.revertedBy = input.adminUserId
  submission.revertedAt = new Date()
  submission.revertReason = input.revertReason || 'Approval reverted by admin'
  submission.remarks = input.revertReason || 'Approval reverted by admin'

  await saveSubmission(submission)
  await adjustMissionCompletionCount(String((submission as any).mission._id), -1)

  return {
    status: 200,
    data: {
      message: 'Submission reverted successfully',
      details: {
        pointsDeducted: mission.points,
        newBalance: user.zeCoins,
        newExperience: user.experience,
        oldRank,
        newRank: user.rank,
        rankChanged: oldRank !== user.rank,
      },
    },
  }
}
