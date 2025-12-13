
import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import MissionSubmission from '@/models/missionSubmission'
import User from '@/models/user'
import Mission from '@/models/mission'
import dbConnect from '@/lib/mongodb'
import { revalidatePath } from 'next/cache'

/**
 * Rank thresholds - defines the points required for each rank.
 * Users automatically progress through ranks as they accumulate points.
 * Based on ZE Club Points system:
 * - Rookie: 0-99 points
 * - Contender: 100-249 points
 * - Gladiator: 250-499 points
 * - Vanguard: 500-999 points
 * - Errorless Legend: 1000+ points
 */
const ranks = [
  { name: 'Rookie', points: 0, icon: '/images/ranks/rookie.png' },
  { name: 'Contender', points: 100, icon: '/images/ranks/contender.png' },
  { name: 'Gladiator', points: 250, icon: '/images/ranks/gladiator.png' },
  { name: 'Vanguard', points: 500, icon: '/images/ranks/vanguard.png' },
  { name: 'Errorless Legend', points: 1000, icon: '/images/ranks/errorless-legend.png' },
]

/**
 * Calculates rank progress for a user
 * Returns progress percentage and points needed for next rank
 */
function calculateRankProgress(currentPoints: number, currentRank: string) {
  // Find current rank index
  const currentRankIndex = ranks.findIndex(r => r.name === currentRank)
  
  // If at max rank (Errorless Legend), return 100% progress
  if (currentRankIndex === ranks.length - 1) {
    return {
      progressToNextRank: 100,
      nextRankPoints: ranks[currentRankIndex].points,
      currentRankPoints: ranks[currentRankIndex].points,
    }
  }
  
  const currentRankThreshold = ranks[currentRankIndex].points
  const nextRankThreshold = ranks[currentRankIndex + 1].points
  
  // Calculate progress percentage
  const pointsInCurrentRank = currentPoints - currentRankThreshold
  const pointsNeededForNextRank = nextRankThreshold - currentRankThreshold
  const progressPercentage = Math.min(
    Math.floor((pointsInCurrentRank / pointsNeededForNextRank) * 100),
    100
  )
  
  return {
    progressToNextRank: progressPercentage,
    nextRankPoints: nextRankThreshold,
    currentRankPoints: currentRankThreshold,
  }
}

/**
 * Updates a user's rank based on their current points.
 * Checks against the ranks array and assigns the highest rank the user qualifies for.
 * Also calculates progress to next rank and assigns appropriate rank icon.
 */
async function updateUserRank(user: any) {
  let newRank = user.rank
  let rankIcon = user.rankIcon
  
  // Find the highest rank the user qualifies for
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (user.points >= ranks[i].points) {
      newRank = ranks[i].name
      rankIcon = ranks[i].icon
      break
    }
  }

  // Calculate rank progress
  const progress = calculateRankProgress(user.points, newRank)
  
  // Update user fields
  user.rank = newRank
  user.rankIcon = rankIcon
  user.progressToNextRank = progress.progressToNextRank
  user.nextRankPoints = progress.nextRankPoints
  user.currentRankPoints = progress.currentRankPoints
  
  await user.save()
}

/**
 * PATCH /api/admin/submissions/verify
 * Admin endpoint to approve or reject mission submissions.
 * On approval, awards points to the user and updates their rank.
 * Requires admin role in the session.
 */
export async function PATCH(req: Request) {
  const session = await auth()

  // Verify admin authentication
  if (!session || !session.user.roles.includes('admin')) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  await dbConnect()

  try {
    const { submissionId, status } = await req.json()

    // Validate status value
    if (!['approved', 'rejected'].includes(status)) {
      return new NextResponse('Invalid status', { status: 400 })
    }

    // Find the submission
    const submission = await MissionSubmission.findById(submissionId)

    if (!submission) {
      return new NextResponse('Submission not found', { status: 404 })
    }

    // Update submission status
    submission.status = status
    await submission.save()

    // If approved, award points to the user
    if (status === 'approved') {
      const user = await User.findById(submission.user)
      const mission = await Mission.findById(submission.mission)

      if (user && mission) {
        // Add mission points to user's total
        user.points += mission.points
        
        // Check and update user's rank based on new points
        await updateUserRank(user)
        
        await user.save()
        
        // Increment mission completion counter using findByIdAndUpdate to avoid validation
        await Mission.findByIdAndUpdate(
          submission.mission,
          { $inc: { currentCompletions: 1 } },
          { runValidators: false }
        )
      }
    }

    // Revalidate the leaderboard page to show updated data
    revalidatePath('/ze-club/leaderboard')

    return NextResponse.json({ message: 'Submission status updated successfully' })
  } catch (error) {
    console.error('Error updating submission status:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
