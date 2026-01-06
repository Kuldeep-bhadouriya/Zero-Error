import dotenv from 'dotenv'
import path from 'path'
import mongoose from 'mongoose'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import dbConnect from '../lib/mongodb'
import Mission from '../models/mission'

const missions = [
  {
    name: 'Join Discord Event',
    description: 'Participate in any official event hosted on our Discord server.',
    points: 10,
    category: 'Community',
    difficulty: 'Easy',
    requiredProofType: 'image',
    maxFileSize: 50,
    instructions: '1. Join a Discord event voice channel or text channel activity.\n2. Take a screenshot showing your participation.\n3. Upload the screenshot.',
    active: true,
    featured: true,
    isTimeLimited: false,
    currentCompletions: 0,
  },
  {
    name: 'Attend Game Night',
    description: 'Watch or participate in our weekly Game Night on YouTube.',
    points: 15,
    category: 'Community',
    difficulty: 'Easy',
    requiredProofType: 'image',
    maxFileSize: 50,
    instructions: '1. Tune into the Game Night stream on YouTube.\n2. Take a screenshot of the stream with your comment visible.\n3. Upload the screenshot.',
    active: true,
    featured: true,
    isTimeLimited: false,
    currentCompletions: 0,
  },
  {
    name: 'Tournament Participation',
    description: 'Participate in any ZE or sponsored tournament.',
    points: 10,
    category: 'Competitive',
    difficulty: 'Medium',
    requiredProofType: 'image',
    maxFileSize: 50,
    instructions: '1. Register and play in a tournament.\n2. Take a screenshot of the bracket or scoreboard showing your name/team.\n3. Upload the screenshot.',
    active: true,
    featured: false,
    isTimeLimited: false,
    currentCompletions: 0,
  },
  {
    name: 'Tournament Winner',
    description: 'Win 1st place in a ZE or sponsored tournament.',
    points: 100,
    category: 'Competitive',
    difficulty: 'Hard',
    requiredProofType: 'image',
    maxFileSize: 50,
    instructions: '1. Win the tournament.\n2. Take a screenshot of the final victory screen or bracket.\n3. Upload the screenshot.',
    active: true,
    featured: true,
    isTimeLimited: false,
    currentCompletions: 0,
  },
  {
    name: 'Tournament Runner-up',
    description: 'Place 2nd in a ZE or sponsored tournament.',
    points: 50,
    category: 'Competitive',
    difficulty: 'Hard',
    requiredProofType: 'image',
    maxFileSize: 50,
    instructions: '1. Place 2nd in the tournament.\n2. Take a screenshot of the final results.\n3. Upload the screenshot.',
    active: true,
    featured: false,
    isTimeLimited: false,
    currentCompletions: 0,
  },
  {
    name: 'Content Contest Entry',
    description: 'Participate in any ZE content creation contest.',
    points: 10,
    category: 'Content Creation',
    difficulty: 'Medium',
    requiredProofType: 'both',
    maxFileSize: 100,
    instructions: '1. Create content for the contest.\n2. Post it as required.\n3. Upload proof (link or file) of your entry.',
    active: true,
    featured: false,
    isTimeLimited: false,
    currentCompletions: 0,
  },
  {
    name: 'Referral Invite',
    description: 'Invite a new member who joins the ZE Club.',
    points: 30,
    category: 'Community',
    difficulty: 'Medium',
    requiredProofType: 'image',
    maxFileSize: 50,
    instructions: '1. Invite a friend.\n2. Have them join using your referral.\n3. Upload a screenshot confirming their joining/registration.',
    active: true,
    featured: false,
    isTimeLimited: false,
    currentCompletions: 0,
  },
  {
    name: 'Share Memes/Reels',
    description: 'Share a meme or reel about ZE on your social media.',
    points: 10,
    category: 'Social Media',
    difficulty: 'Easy',
    requiredProofType: 'image',
    maxFileSize: 50,
    instructions: '1. Post a ZE-related meme or reel.\n2. Tag Zero Error Esports.\n3. Upload a screenshot of the post.',
    active: true,
    featured: false,
    isTimeLimited: false,
    currentCompletions: 0,
  },
  {
    name: 'Attend Webinar',
    description: 'Attend a webinar hosted by ZE.',
    points: 10,
    category: 'Education',
    difficulty: 'Easy',
    requiredProofType: 'image',
    maxFileSize: 50,
    instructions: '1. Attend the webinar session.\n2. Take a screenshot of the session.\n3. Upload the screenshot.',
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
    // Force close the connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close()
    }
    process.exit()
  }
}

seedMissions()