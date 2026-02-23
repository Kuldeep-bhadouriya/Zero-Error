import Mission from '@/models/mission'
import MissionSubmission from '@/models/missionSubmission'

export async function findSubmissionById(submissionId: string) {
  return MissionSubmission.findById(submissionId)
}

export async function findSubmissionByIdWithRelations(submissionId: string) {
  return MissionSubmission.findById(submissionId).populate('user').populate('mission')
}

export async function saveSubmission(submission: any) {
  await submission.save()
  return submission
}

export async function findMissionById(missionId: string) {
  return Mission.findById(missionId)
}

export async function adjustMissionCompletionCount(missionId: string, delta: number) {
  return Mission.findByIdAndUpdate(
    missionId,
    { $inc: { currentCompletions: delta } },
    { runValidators: false }
  )
}
