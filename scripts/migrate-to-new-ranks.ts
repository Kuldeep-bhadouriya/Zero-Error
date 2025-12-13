import mongoose from 'mongoose'
import User from '../models/user'
import dbConnect from '../lib/mongodb'

/**
 * Migration Script: Update Users to New Rank System
 * 
 * This script migrates all users from the old rank system to the new one:
 * 
 * OLD SYSTEM:
 * - Rookie: 0
 * - Bronze: 500
 * - Silver: 1000
 * - Gold: 5000
 * - Platinum: 10000
 * - Diamond: 20000
 * 
 * NEW SYSTEM:
 * - Rookie: 0-99 points
 * - Contender: 100-249 points
 * - Gladiator: 250-499 points
 * - Vanguard: 500-999 points
 * - Errorless Legend: 1000+ points
 * 
 * Usage: pnpm tsx scripts/migrate-to-new-ranks.ts
 */

const NEW_RANKS = [
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
  const currentRankIndex = NEW_RANKS.findIndex(r => r.name === currentRank)
  
  // If at max rank (Errorless Legend), return 100% progress
  if (currentRankIndex === NEW_RANKS.length - 1) {
    return {
      progressToNextRank: 100,
      nextRankPoints: NEW_RANKS[currentRankIndex].points,
      currentRankPoints: NEW_RANKS[currentRankIndex].points,
    }
  }
  
  const currentRankThreshold = NEW_RANKS[currentRankIndex].points
  const nextRankThreshold = NEW_RANKS[currentRankIndex + 1].points
  
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
 * Determines the correct rank based on points
 */
function calculateRankFromPoints(points: number) {
  for (let i = NEW_RANKS.length - 1; i >= 0; i--) {
    if (points >= NEW_RANKS[i].points) {
      return NEW_RANKS[i]
    }
  }
  return NEW_RANKS[0] // Default to Rookie
}

async function migrateRanks() {
  console.log('🚀 Starting rank system migration...\n')
  
  try {
    await dbConnect()
    
    // Get all users
    const users = await User.find({})
    console.log(`📊 Found ${users.length} users to migrate\n`)
    
    let updated = 0
    let skipped = 0
    let errors = 0
    
    for (const user of users) {
      try {
        const oldRank = user.rank
        const oldRankIcon = user.rankIcon
        const points = user.points || 0
        
        // Calculate new rank based on points
        const newRankData = calculateRankFromPoints(points)
        const progress = calculateRankProgress(points, newRankData.name)
        
        // Update user
        user.rank = newRankData.name
        user.rankIcon = newRankData.icon
        user.progressToNextRank = progress.progressToNextRank
        user.nextRankPoints = progress.nextRankPoints
        user.currentRankPoints = progress.currentRankPoints
        
        await user.save()
        
        updated++
        console.log(`✅ Updated: ${user.name || user.email}`)
        console.log(`   Points: ${points}`)
        console.log(`   ${oldRank} → ${newRankData.name}`)
        console.log(`   Progress: ${progress.progressToNextRank}%\n`)
      } catch (error) {
        errors++
        console.error(`❌ Error updating user ${user.email}:`, error)
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('📈 Migration Summary:')
    console.log('='.repeat(50))
    console.log(`✅ Successfully updated: ${updated}`)
    console.log(`⏭️  Skipped: ${skipped}`)
    console.log(`❌ Errors: ${errors}`)
    console.log('='.repeat(50) + '\n')
    
    console.log('🎉 Migration completed!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await mongoose.connection.close()
    console.log('🔌 Database connection closed')
  }
}

// Run migration
migrateRanks()
