import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import MissionSubmission from '@/models/missionSubmission'
import User from '@/models/user'
import Mission from '@/models/mission'
import RedemptionRequest from '@/models/redemptionRequest'
import dbConnect from '@/lib/mongodb'
import { revalidatePath } from 'next/cache'

/**
 * Rank thresholds - defines the points required for each rank.
 * Users automatically progress through ranks as they accumulate points.
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
 */
function calculateRankProgress(currentPoints: number, currentRank: string) {
  const currentRankIndex = ranks.findIndex(r => r.name === currentRank)
  
  if (currentRankIndex === ranks.length - 1) {
    return {
      progressToNextRank: 100,
      nextRankPoints: ranks[currentRankIndex].points,
      currentRankPoints: ranks[currentRankIndex].points,
    }
  }
  
  const currentRankThreshold = ranks[currentRankIndex].points
  const nextRankThreshold = ranks[currentRankIndex + 1].points
  
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
 * Updates a user's rank based on their current experience.
 * This handles both rank upgrades and downgrades.
 */
async function updateUserRank(user: any) {
  let newRank = user.rank
  let rankIcon = user.rankIcon
  
  // Find the highest rank the user qualifies for based on EXPERIENCE
  for (let i = ranks.length - 1; i >= 0; i--) {
    if (user.experience >= ranks[i].points) {
      newRank = ranks[i].name
      rankIcon = ranks[i].icon
      break
    }
  }

  // Calculate rank progress based on EXPERIENCE
  const progress = calculateRankProgress(user.experience, newRank)
  
  // Update user fields
  user.rank = newRank
  user.rankIcon = rankIcon
  user.progressToNextRank = progress.progressToNextRank
  user.nextRankPoints = progress.nextRankPoints
  user.currentRankPoints = progress.currentRankPoints
  
  await user.save()
}

/**
 * POST /api/admin/submissions/revert
 * Admin endpoint to revert an approved mission submission.
 * Deducts points from the user, recalculates rank, and updates submission status.
 * Requires admin role in the session.
 */
export async function POST(req: Request) {
  const session = await auth()

  // Verify admin authentication
  if (!session || !session.user.roles.includes('admin')) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  await dbConnect()

  try {
    const { submissionId, revertReason } = await req.json()

    // Find the submission
    const submission = await MissionSubmission.findById(submissionId)
      .populate('user')
      .populate('mission')

    if (!submission) {
      return new NextResponse('Submission not found', { status: 404 })
    }

    // Verify submission is approved
    if (submission.status !== 'approved') {
      return new NextResponse('Only approved submissions can be reverted', { status: 400 })
    }

    const user = await User.findById(submission.user._id)
    const mission = await Mission.findById(submission.mission._id)

    if (!user || !mission) {
      return new NextResponse('User or mission not found', { status: 404 })
    }

    // Check if user has pending/completed redemption requests that might be affected
    const redemptionRequests = await RedemptionRequest.find({
      userId: user._id,
      status: { $in: ['pending', 'processing', 'completed'] }
    })

    // Calculate what the user's balance would be after revert
    const newZeCoins = user.zeCoins - mission.points
    
    // Check if reverting would cause issues with redemptions
    if (newZeCoins < 0 && redemptionRequests.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot revert: User has active redemption requests and insufficient balance',
          details: {
            currentZeCoins: user.zeCoins,
            pointsToDeduct: mission.points,
            resultingBalance: newZeCoins,
            activeRedemptions: redemptionRequests.length
          }
        },
        { status: 400 }
      )
    }

    // Deduct points from user (both zeCoins and experience)
    user.zeCoins = Math.max(0, user.zeCoins - mission.points)
    user.experience = Math.max(0, user.experience - mission.points)
    user.points = user.experience // Keep in sync for backward compatibility

    // Store old rank for logging
    const oldRank = user.rank

    // Update user's rank (this may downgrade them)
    await updateUserRank(user)
    
    await user.save()

    // Update submission status and record revert details
    submission.status = 'rejected'
    submission.revertedBy = session.user.id
    submission.revertedAt = new Date()
    submission.revertReason = revertReason || 'Approval reverted by admin'
    submission.remarks = revertReason || 'Approval reverted by admin'
    
    await submission.save()

    // Decrement mission completion counter
    await Mission.findByIdAndUpdate(
      submission.mission._id,
      { $inc: { currentCompletions: -1 } },
      { runValidators: false }
    )

    // Revalidate the leaderboard page
    revalidatePath('/ze-club/leaderboard')

    return NextResponse.json({ 
      message: 'Submission reverted successfully',
      details: {
        pointsDeducted: mission.points,
        newBalance: user.zeCoins,
        newExperience: user.experience,
        oldRank,
        newRank: user.rank,
        rankChanged: oldRank !== user.rank
      }
    })
  } catch (error) {
    console.error('Error reverting submission:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
