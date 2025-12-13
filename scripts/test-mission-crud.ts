/**
 * Test script to verify Mission CRUD operations
 * Run with: pnpm test:mission-crud
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Import with relative paths
import Mission from '../models/mission'
import dbConnect from '../lib/mongodb'

async function testMissionCRUD() {
  console.log('🔍 Testing Mission CRUD Operations...\n')

  try {
    // Connect to database
    await dbConnect()
    console.log('✅ Connected to MongoDB\n')

    // Test 1: CREATE Mission
    console.log('📝 Test 1: Creating a new mission...')
    const testMission = await Mission.create({
      name: 'Test Mission - CRUD Verification',
      description: 'This is a test mission to verify CRUD operations',
      points: 100,
      category: 'Testing',
      difficulty: 'Easy',
      requiredProofType: 'image',
      maxFileSize: 50,
      instructions: 'This is a test mission. Please complete the following steps:\n1. Step 1\n2. Step 2\n3. Step 3',
      active: true,
      featured: false,
      isTimeLimited: false,
      currentCompletions: 0,
    })
    console.log('✅ Mission created successfully:', testMission._id)
    console.log(`   Name: ${testMission.name}`)
    console.log(`   Points: ${testMission.points}`)
    console.log(`   Category: ${testMission.category}\n`)

    // Test 2: READ Mission
    console.log('📖 Test 2: Reading the mission...')
    const foundMission = await Mission.findById(testMission._id)
    if (!foundMission) {
      throw new Error('Mission not found')
    }
    console.log('✅ Mission found successfully')
    console.log(`   ID: ${foundMission._id}`)
    console.log(`   Active: ${foundMission.active}\n`)

    // Test 3: UPDATE Mission
    console.log('✏️  Test 3: Updating the mission...')
    const updatedMission = await Mission.findByIdAndUpdate(
      testMission._id,
      {
        points: 200,
        featured: true,
        description: 'Updated description for testing',
      },
      { new: true, runValidators: true }
    )
    if (!updatedMission) {
      throw new Error('Mission update failed')
    }
    console.log('✅ Mission updated successfully')
    console.log(`   New points: ${updatedMission.points}`)
    console.log(`   Featured: ${updatedMission.featured}`)
    console.log(`   Description: ${updatedMission.description}\n`)

    // Test 4: LIST Missions
    console.log('📋 Test 4: Listing all missions...')
    const allMissions = await Mission.find({ category: 'Testing' })
    console.log(`✅ Found ${allMissions.length} test mission(s)\n`)

    // Test 5: Validation Test (should fail)
    console.log('🔒 Test 5: Testing validation (should fail)...')
    try {
      await Mission.create({
        name: '',
        description: '',
        points: -100, // Invalid
        category: 'Testing',
      })
      console.log('❌ Validation should have failed but did not\n')
    } catch (validationError: any) {
      console.log('✅ Validation working correctly')
      console.log(`   Error: ${validationError.message}\n`)
    }

    // Test 6: Time-Limited Mission
    console.log('⏰ Test 6: Creating time-limited mission...')
    const startDate = new Date()
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const timeLimitedMission = await Mission.create({
      name: 'Time-Limited Test Mission',
      description: 'This mission expires in 7 days',
      points: 500,
      category: 'Testing',
      difficulty: 'Medium',
      requiredProofType: 'both',
      instructions: 'Complete within 7 days',
      isTimeLimited: true,
      startDate,
      endDate,
      daysAvailable: 7,
      active: true,
      currentCompletions: 0,
    })
    console.log('✅ Time-limited mission created')
    console.log(`   Start: ${timeLimitedMission.startDate?.toISOString()}`)
    console.log(`   End: ${timeLimitedMission.endDate?.toISOString()}\n`)

    // Test 7: DELETE (Soft Delete)
    console.log('🗑️  Test 7: Soft deleting missions...')
    await Mission.findByIdAndUpdate(testMission._id, {
      active: false,
      deactivatedAt: new Date(),
    })
    await Mission.findByIdAndUpdate(timeLimitedMission._id, {
      active: false,
      deactivatedAt: new Date(),
    })
    console.log('✅ Missions soft deleted successfully\n')

    // Clean up
    console.log('🧹 Cleaning up test data...')
    await Mission.deleteMany({ category: 'Testing' })
    console.log('✅ Test data cleaned up\n')

    console.log('🎉 All CRUD tests passed successfully!')
  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    // Disconnect from database
    await mongoose.connection.close()
    console.log('\n👋 Disconnected from MongoDB')
  }
}

// Run tests
testMissionCRUD()
