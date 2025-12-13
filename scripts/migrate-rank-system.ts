/**
 * Migration script for Phase 1: Rank System Enhancement
 * Updates existing users with new rank fields (rankIcon, progressToNextRank, etc.)
 * Run this script once after deploying the Phase 1 changes
 * 
 * Usage: pnpm db:migrate-rank-system
 */

// Load environment variables
import dotenv from 'dotenv'
import path from 'path'

// Try .env.local first, then .env
const envPath = path.resolve(process.cwd(), '.env.local')
dotenv.config({ path: envPath })

import dbConnect from '../lib/mongodb'
import User from '../models/user'

const ranks = [
  { name: 'Rookie', points: 0, icon: '/images/ranks/rookie.svg' },
  { name: 'Bronze', points: 500, icon: '/images/ranks/bronze.svg' },
  { name: 'Silver', points: 1000, icon: '/images/ranks/silver.svg' },
  { name: 'Gold', points: 5000, icon: '/images/ranks/gold.svg' },
  { name: 'Platinum', points: 10000, icon: '/images/ranks/platinum.svg' },
  { name: 'Diamond', points: 20000, icon: '/images/ranks/diamond.svg' },
]

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

function getRankIcon(rank: string): string {
  const rankData = ranks.find(r => r.name === rank)
  return rankData?.icon || '/images/ranks/rookie.svg'
}

async function migrateRankSystem() {
  try {
    console.log('🚀 Starting rank system migration...\n')
    
    await dbConnect()
    console.log('✅ Connected to MongoDB\n')
    
    // Fetch all users
    const users = await User.find({})
    console.log(`📊 Found ${users.length} users to migrate\n`)
    
    let updatedCount = 0
    let errorCount = 0
    
    for (const user of users) {
      try {
        // Calculate new rank fields
        const progress = calculateRankProgress(user.points, user.rank)
        const rankIcon = getRankIcon(user.rank)
        
        // Update user
        user.rankIcon = rankIcon
        user.progressToNextRank = progress.progressToNextRank
        user.nextRankPoints = progress.nextRankPoints
        user.currentRankPoints = progress.currentRankPoints
        
        await user.save()
        
        updatedCount++
        console.log(`✅ Updated user: ${user.name} (${user.rank}) - ${user.points} points - ${progress.progressToNextRank}% to next rank`)
      } catch (error) {
        errorCount++
        console.error(`❌ Error updating user ${user.name}:`, error)
      }
    }
    
    console.log(`\n📈 Migration Summary:`)
    console.log(`   ✅ Successfully updated: ${updatedCount} users`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`\n🎉 Rank system migration completed!\n`)
    
    process.exit(0)
  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrateRankSystem()
