import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import dbConnect from '../lib/mongodb'
import Mission from '../models/mission'

const missions = [
  {
    name: 'Follow on Instagram',
    description: 'Follow Zero Error Esports on Instagram and submit a screenshot.',
    points: 50,
    category: 'Social Media',
    difficulty: 'Easy',
    requiredProofType: 'image',
    maxFileSize: 50,
    instructions: '1. Visit instagram.com/zeroerror_esports\n2. Click the Follow button\n3. Take a screenshot showing you\'re following\n4. Upload the screenshot as proof',
    active: true,
    featured: true,
    isTimeLimited: false,
    currentCompletions: 0,
  },
  {
    name: 'Join Discord Server',
    description: 'Join the official Zero Error Discord server and verify your membership.',
    points: 100,
    category: 'Community',
    difficulty: 'Easy',
    requiredProofType: 'image',
    maxFileSize: 50,
    instructions: '1. Join our Discord server using the link on the website\n2. Complete server verification\n3. Take a screenshot of your member status\n4. Upload the screenshot',
    active: true,
    featured: true,
    isTimeLimited: false,
    currentCompletions: 0,
  },
  {
    name: 'First Blood Achievement',
    description: 'Get the first kill in any competitive match.',
    points: 150,
    category: 'Gameplay',
    difficulty: 'Medium',
    requiredProofType: 'both',
    maxFileSize: 50,
    instructions: '1. Play a competitive match\n2. Secure the first kill\n3. Record or screenshot the moment\n4. Upload your proof showing the first blood notification',
    active: true,
    featured: false,
    isTimeLimited: false,
    currentCompletions: 0,
  },
  {
    name: 'Ace in the Hole',
    description: 'Get 5 kills in a single round of Valorant or CS:GO.',
    points: 500,
    category: 'Gameplay',
    difficulty: 'Hard',
    requiredProofType: 'video',
    maxFileSize: 50,
    instructions: '1. Play a round of Valorant or CS:GO\n2. Eliminate all 5 enemy players yourself\n3. Record the ace moment\n4. Upload the video showing the complete ace',
    active: true,
    featured: false,
    isTimeLimited: false,
    currentCompletions: 0,
  },
  {
    name: 'Clutch Master',
    description: 'Win a 1v3 or higher clutch situation in any competitive game.',
    points: 1000,
    category: 'Gameplay',
    difficulty: 'Hard',
    requiredProofType: 'video',
    maxFileSize: 50,
    instructions: '1. Find yourself in a 1v3+ situation\n2. Eliminate all remaining enemies and win the round\n3. Record the entire clutch\n4. Upload the video proof',
    active: true,
    featured: false,
    isTimeLimited: false,
    currentCompletions: 0,
  },
  {
    name: 'Share Tournament Post',
    description: 'Share our latest tournament announcement on your story.',
    points: 75,
    category: 'Social Media',
    difficulty: 'Easy',
    requiredProofType: 'image',
    maxFileSize: 50,
    instructions: '1. Find our latest tournament post on Instagram\n2. Share it to your story\n3. Screenshot your story showing the post\n4. Upload the screenshot',
    active: true,
    featured: false,
    isTimeLimited: false,
    currentCompletions: 0,
  },
  {
    name: 'Create Gaming Montage',
    description: 'Create and share a gaming highlight montage featuring Zero Error.',
    points: 2000,
    category: 'Content Creation',
    difficulty: 'Hard',
    requiredProofType: 'video',
    maxFileSize: 50,
    instructions: '1. Create a gaming montage (min 30 seconds)\n2. Include Zero Error branding/watermark\n3. Post it on social media and tag us\n4. Upload the video and link to your post',
    active: true,
    featured: false,
    isTimeLimited: false,
    maxCompletions: 50,
    currentCompletions: 0,
  },
  {
    name: 'Refer a Friend',
    description: 'Invite a friend to join ZE Club and they must complete 3 missions.',
    points: 300,
    category: 'Community',
    difficulty: 'Medium',
    requiredProofType: 'image',
    maxFileSize: 50,
    instructions: '1. Share your referral link with a friend\n2. They must sign up and complete 3 missions\n3. Take a screenshot of their profile showing completed missions\n4. Upload the proof',
    active: true,
    featured: false,
    isTimeLimited: false,
    currentCompletions: 0,
  },
]

async function seedMissions() {
  try {
    await dbConnect()
    console.log('Connected to database.')

    // Using updateOne with upsert to avoid creating duplicates
    for (const missionData of missions) {
      await Mission.updateOne(
        { name: missionData.name },
        { $set: missionData },
        { upsert: true }
      )
      console.log(`Upserted mission: ${missionData.name}`)
    }

    console.log('Missions seeded successfully!')
  } catch (error) {
    console.error('Error seeding missions:', error)
  } finally {
    // Mongoose connection will be closed automatically by the runtime
    process.exit()
  }
}

seedMissions()
