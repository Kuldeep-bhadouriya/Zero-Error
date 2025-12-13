/**
 * Migration script to fix MongoDB indexes
 * Run with: pnpm db:fix-indexes
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import dbConnect from '../lib/mongodb'

async function fixIndexes() {
  console.log('🔧 Fixing MongoDB indexes...\n')

  try {
    // Connect to database
    await dbConnect()
    console.log('✅ Connected to MongoDB\n')

    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established')
    }

    // Get missions collection
    const missionsCollection = db.collection('missions')

    // List current indexes
    console.log('📋 Current indexes:')
    const indexes = await missionsCollection.indexes()
    indexes.forEach((index) => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`)
    })
    console.log()

    // Drop the problematic missionId index if it exists
    try {
      const indexExists = indexes.some((idx) => idx.name === 'missionId_1')
      if (indexExists) {
        console.log('🗑️  Dropping missionId_1 index...')
        await missionsCollection.dropIndex('missionId_1')
        console.log('✅ Successfully dropped missionId_1 index\n')
      } else {
        console.log('ℹ️  missionId_1 index does not exist (already fixed)\n')
      }
    } catch (error: any) {
      if (error.code === 27) {
        console.log('ℹ️  missionId_1 index does not exist (already fixed)\n')
      } else {
        throw error
      }
    }

    // List indexes after cleanup
    console.log('📋 Indexes after cleanup:')
    const newIndexes = await missionsCollection.indexes()
    newIndexes.forEach((index) => {
      console.log(`   - ${index.name}: ${JSON.stringify(index.key)}`)
    })
    console.log()

    console.log('🎉 Index cleanup completed successfully!')
  } catch (error: any) {
    console.error('❌ Error fixing indexes:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    // Disconnect from database
    await mongoose.connection.close()
    console.log('\n👋 Disconnected from MongoDB')
  }
}

// Run migration
fixIndexes()
