import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { errorResponse } from '@/lib/api-response'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'
import logger from '@/lib/logger'

const RANKS = [
  { name: 'Rookie', points: 0, icon: '/images/ranks/rookie.png' },
  { name: 'Contender', points: 100, icon: '/images/ranks/contender.png' },
  { name: 'Gladiator', points: 250, icon: '/images/ranks/gladiator.png' },
  { name: 'Vanguard', points: 500, icon: '/images/ranks/vanguard.png' },
  { name: 'Errorless Legend', points: 1000, icon: '/images/ranks/errorless-legend.png' },
]

function getRankForExperience(experience: number) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (experience >= RANKS[i].points) return RANKS[i]
  }
  return RANKS[0]
}

function calculateRankProgress(currentPoints: number, currentRank: string) {
  const currentRankIndex = RANKS.findIndex(r => r.name === currentRank)
  
  if (currentRankIndex === RANKS.length - 1) {
    return {
      progressToNextRank: 100,
      nextRankPoints: RANKS[currentRankIndex].points,
      currentRankPoints: RANKS[currentRankIndex].points,
    }
  }
  
  const currentRankThreshold = RANKS[currentRankIndex].points
  const nextRankThreshold = RANKS[currentRankIndex + 1].points
  
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
 * POST /api/admin/users/fix-ranks
 * Admin endpoint to recalculate and fix all user ranks based on their current experience
 */
export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return errorResponse('Unauthorized', 401)
    }

    await dbConnect()

    // Check if user is admin
    const adminUser = await User.findOne({ email: session.user.email })
    if (!adminUser?.roles?.includes('admin')) {
      return NextResponse.json({ message: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get all users with valid email
    const users = await User.find({ 
      email: { $exists: true, $ne: null } 
    })

    let updatedCount = 0
    let errorCount = 0
    const updates = []

    for (const user of users) {
      try {
        // Get user's current experience (fallback to points if experience doesn't exist)
        const experience = typeof user.experience === 'number' ? user.experience : (user.points || 0)
        
        // Calculate correct rank
        const correctRank = getRankForExperience(experience)
        const rankProgress = calculateRankProgress(experience, correctRank.name)
        
        // Check if rank needs updating
        const needsUpdate = 
          user.rank !== correctRank.name ||
          user.rankIcon !== correctRank.icon ||
          typeof user.experience !== 'number' ||
          typeof user.zeCoins !== 'number'
        
        if (needsUpdate) {
          // Ensure experience field exists
          if (typeof user.experience !== 'number') {
            user.experience = user.points || 0
          }
          
          // Ensure zeCoins field exists
          if (typeof user.zeCoins !== 'number') {
            user.zeCoins = user.points || 0
          }
          
          // Sync points with experience
          user.points = user.experience
          
          // Update rank information
          user.rank = correctRank.name
          user.rankIcon = correctRank.icon
          user.progressToNextRank = rankProgress.progressToNextRank
          user.nextRankPoints = rankProgress.nextRankPoints
          user.currentRankPoints = rankProgress.currentRankPoints
          
          await user.save()
          updatedCount++
          
          updates.push({
            zeTag: user.zeTag,
            email: user.email,
            experience: user.experience,
            oldRank: user.rank === correctRank.name ? 'N/A' : user.rank,
            newRank: correctRank.name,
          })
        }
      } catch (error) {
        logger.error(`Error updating user ${user.email}:`, error)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully recalculated ranks for ${updatedCount} users`,
      totalUsers: users.length,
      updatedCount,
      errorCount,
      updates: updates.slice(0, 20), // Return first 20 updates
    })
  } catch (error: unknown) {
    logger.error('Error fixing user ranks:', error)
    return NextResponse.json(
      { message: 'Failed to fix user ranks', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
