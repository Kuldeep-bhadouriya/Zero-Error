/**
 * Clean Duplicate Mission Submissions
 * 
 * This script finds and removes duplicate mission submissions,
 * keeping only the first submission for each user+mission combination.
 * 
 * Run with: npx ts-node scripts/clean-duplicate-submissions.ts
 */

import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') })

import mongoose from 'mongoose'
import dbConnect from '../lib/mongodb'

async function cleanDuplicates() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await dbConnect()
    
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }

    const collection = db.collection('missionsubmissions')
    
    console.log('🔍 Finding duplicate submissions (pending/approved)...\n')
    
    // Find all duplicate submissions for pending and approved status
    const duplicates = await collection.aggregate([
      {
        $match: {
          status: { $in: ['pending', 'approved'] }
        }
      },
      {
        $group: {
          _id: { user: '$user', mission: '$mission', status: '$status' },
          count: { $sum: 1 },
          submissions: { 
            $push: { 
              _id: '$_id', 
              submittedAt: '$submittedAt',
              proof: '$proof'
            } 
          }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray()

    if (duplicates.length === 0) {
      console.log('✅ No duplicate submissions found! Database is clean.')
      return
    }

    console.log(`⚠️  Found ${duplicates.length} duplicate submission groups:\n`)
    
    let totalToDelete = 0
    const idsToDelete: any[] = []

    for (const dup of duplicates) {
      const submissions = dup.submissions
      // Sort by submittedAt to keep the earliest submission
      submissions.sort((a: any, b: any) => 
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
      )
      
      const toKeep = submissions[0]
      const toDelete = submissions.slice(1)
      
      console.log(`📌 User: ${dup._id.user}, Mission: ${dup._id.mission}, Status: ${dup._id.status}`)
      console.log(`   Total submissions: ${dup.count}`)
      console.log(`   ✓ Keeping: ${toKeep._id} (${toKeep.submittedAt})`)
      
      for (const sub of toDelete) {
        console.log(`   ✗ Deleting: ${sub._id} (${sub.submittedAt})`)
        idsToDelete.push(sub._id)
        totalToDelete++
      }
      console.log('')
    }

    if (totalToDelete === 0) {
      console.log('✅ No duplicates to delete.')
      return
    }

    console.log(`\n⚠️  About to delete ${totalToDelete} duplicate submission(s)`)
    console.log('Press Ctrl+C now if you want to cancel...\n')
    
    // Wait 3 seconds before proceeding
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    console.log('🗑️  Deleting duplicate submissions...')
    
    const deleteResult = await collection.deleteMany({
      _id: { $in: idsToDelete }
    })
    
    console.log(`✅ Deleted ${deleteResult.deletedCount} duplicate submission(s)\n`)
    
    // Now try to create the index
    console.log('🔨 Creating unique compound index...')
    
    try {
      await collection.createIndex(
        { user: 1, mission: 1, status: 1 },
        { 
          unique: true,
          partialFilterExpression: { 
            status: { $in: ['pending', 'approved'] } 
          },
          name: 'user_1_mission_1_status_1'
        }
      )
      console.log('✅ Successfully created unique index on MissionSubmission')
    } catch (indexError: any) {
      if (indexError.code === 11000) {
        console.log('⚠️  Still have duplicates. Running check again...')
        // Recursively clean again
        await mongoose.connection.close()
        await cleanDuplicates()
        return
      }
      throw indexError
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

// Run the cleanup
cleanDuplicates()
  .then(() => {
    console.log('\n✨ Cleanup and migration completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error)
    process.exit(1)
  })
