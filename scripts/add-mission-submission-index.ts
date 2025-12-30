/**
 * Migration Script: Add Unique Index to MissionSubmission
 * 
 * This script adds a compound unique index on (user, mission, status)
 * to prevent duplicate mission submissions per user.
 * 
 * The index only applies to submissions with status 'pending' or 'approved',
 * allowing users to resubmit rejected missions.
 * 
 * Run with: npx ts-node scripts/add-mission-submission-index.ts
 */

import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') })

import mongoose from 'mongoose'
import dbConnect from '../lib/mongodb'

async function addUniqueIndex() {
  try {
    console.log('🔌 Connecting to MongoDB...')
    await dbConnect()
    
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }

    const collection = db.collection('missionsubmissions')
    
    console.log('📋 Checking existing indexes...')
    const existingIndexes = await collection.indexes()
    console.log('Existing indexes:', existingIndexes.map(idx => idx.name))
    
    // Check if index already exists
    const indexExists = existingIndexes.some(
      idx => idx.name === 'user_1_mission_1_status_1'
    )
    
    if (indexExists) {
      console.log('✅ Index already exists, no action needed')
      return
    }
    
    console.log('🔨 Creating unique compound index...')
    
    // Create the unique compound index
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
    console.log('   - Users can now only have one pending or approved submission per mission')
    console.log('   - Users can resubmit rejected missions')
    
    // Check for any duplicate submissions that would violate the new index
    console.log('\n🔍 Checking for duplicate submissions...')
    const duplicates = await collection.aggregate([
      {
        $match: {
          status: { $in: ['pending', 'approved'] }
        }
      },
      {
        $group: {
          _id: { user: '$user', mission: '$mission' },
          count: { $sum: 1 },
          submissions: { $push: { _id: '$_id', status: '$status', submittedAt: '$submittedAt' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray()
    
    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} users with duplicate submissions:`)
      for (const dup of duplicates) {
        console.log(`   User: ${dup._id.user}, Mission: ${dup._id.mission}, Count: ${dup.count}`)
        console.log(`   Submissions:`, dup.submissions.map((s: any) => 
          `${s._id} (${s.status}, ${s.submittedAt})`
        ).join(', '))
      }
      console.log('\n   Consider manually reviewing and removing duplicate submissions')
    } else {
      console.log('✅ No duplicate submissions found')
    }
    
  } catch (error) {
    console.error('❌ Error adding index:', error)
    throw error
  } finally {
    await mongoose.connection.close()
    console.log('\n🔌 Disconnected from MongoDB')
  }
}

// Run the migration
addUniqueIndex()
  .then(() => {
    console.log('\n✨ Migration completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error)
    process.exit(1)
  })
