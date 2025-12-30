/**
 * Migration Script: Separate ZE Coins and Experience
 * 
 * This script migrates all users from the old single 'points' system to the new dual system:
 * - zeCoins: Used for redemption/purchasing (can decrease)
 * - experience: Used for ranking (never decreases)
 * 
 * The migration copies existing 'points' to both 'zeCoins' and 'experience',
 * ensuring users keep their current balance and rank.
 * 
 * Usage: pnpm tsx scripts/migrate-coins-experience.ts
 */

// Load environment variables
import dotenv from 'dotenv'
import path from 'path'

// Try .env.local first, then .env
const envPath = path.resolve(process.cwd(), '.env.local')
dotenv.config({ path: envPath })

import dbConnect from '../lib/mongodb'
import User from '../models/user'

async function migrateCoinsAndExperience() {
  console.log('🚀 Starting ZE Coins & Experience migration...\n')
  console.log('This will separate points into two systems:')
  console.log('  💰 ZE Coins - For redemption (can decrease)')
  console.log('  ⭐ Experience - For ranking (never decreases)\n')
  
  try {
    await dbConnect()
    console.log('✅ Connected to MongoDB\n')
    
    // Get all users
    const users = await User.find({})
    console.log(`📊 Found ${users.length} users to migrate\n`)
    
    let updated = 0
    let skipped = 0
    let errors = 0
    
    for (const user of users) {
      try {
        const currentPoints = user.points || 0
        
        // Check if already migrated
        if (user.zeCoins !== undefined && user.experience !== undefined) {
          console.log(`⏭️  Skipped: ${user.name || user.email} (already migrated)`)
          skipped++
          continue
        }
        
        // Migrate: Copy points to both zeCoins and experience
        user.zeCoins = currentPoints
        user.experience = currentPoints
        
        await user.save()
        
        updated++
        console.log(`✅ Migrated: ${user.name || user.email}`)
        console.log(`   Points: ${currentPoints}`)
        console.log(`   → ZE Coins: ${user.zeCoins}`)
        console.log(`   → Experience: ${user.experience}`)
        console.log(`   Rank: ${user.rank}\n`)
      } catch (error) {
        errors++
        console.error(`❌ Error migrating user ${user.email}:`, error)
      }
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📈 Migration Summary:')
    console.log('='.repeat(60))
    console.log(`✅ Successfully migrated: ${updated}`)
    console.log(`⏭️  Already migrated (skipped): ${skipped}`)
    console.log(`❌ Errors: ${errors}`)
    console.log('='.repeat(60) + '\n')
    
    if (updated > 0) {
      console.log('🎉 Migration completed successfully!')
      console.log('\n📝 What changed:')
      console.log('  • All users now have ZE Coins = their old points')
      console.log('  • All users now have Experience = their old points')
      console.log('  • When users complete missions, they earn BOTH')
      console.log('  • When users redeem rewards, only ZE Coins decrease')
      console.log('  • Rank is now based on Experience only\n')
    } else {
      console.log('ℹ️  No users needed migration\n')
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    process.exit(0)
  }
}

// Run migration
migrateCoinsAndExperience()
