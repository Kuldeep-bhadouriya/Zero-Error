import mongoose from 'mongoose'
import Reward from '../models/reward'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables')
}

async function seedRewards() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Clear existing rewards
    await Reward.deleteMany({})
    console.log('Cleared existing rewards')

    const rewards = [
      // --- Errorless Legend (Top 3) ---
      {
        name: 'Gaming Headphone (1st Prize)',
        description: 'Gaming headphone. Exclusive reward for the #1 Errorless Legend.',
        cost: 0, 
        stock: 1,
        requiredRank: 'Errorless Legend',
        exclusiveToTop3: true,
        discountable: false,
      },
      {
        name: 'Gaming Mouse (2nd Prize)',
        description: 'Gaming mouse. Exclusive reward for the #2 Errorless Legend.',
        cost: 0,
        stock: 1,
        requiredRank: 'Errorless Legend',
        exclusiveToTop3: true,
        discountable: false,
      },
      {
        name: 'Gaming Mousepad (3rd Prize)',
        description: 'Gaming mousepad. Exclusive reward for the #3 Errorless Legend.',
        cost: 0,
        stock: 1,
        requiredRank: 'Errorless Legend',
        exclusiveToTop3: true,
        discountable: false,
      },

      // --- Vanguard ---
      {
        name: '10% Discount Perk',
        description: '10% discount coupon on points on claimable rewards.',
        cost: 0, // Informational item
        stock: 9999,
        requiredRank: 'Vanguard',
        exclusiveToTop3: false,
        discountable: false,
      },
      {
        name: 'Game Night Slot',
        description: 'Can claim slot at Game night with Zero error official members.',
        cost: 500,
        stock: 10,
        requiredRank: 'Vanguard',
        exclusiveToTop3: false,
        discountable: true,
      },

      // --- Gladiator ---
      {
        name: 'Social Media Shoutout',
        description: 'Shoutout on ZE socials.',
        cost: 300,
        stock: 20,
        requiredRank: 'Gladiator',
        exclusiveToTop3: false,
        discountable: true,
      },

      // --- Contender ---
      {
        name: 'Free Scrim Entry',
        description: 'Free entry in Paid Scrims /Paid Tournaments.',
        cost: 100,
        stock: 50,
        requiredRank: 'Contender',
        exclusiveToTop3: false,
        discountable: true,
      },
      {
        name: 'Special Discord Role',
        description: 'Discord Special Role for a Month/Season.',
        cost: 50,
        stock: 100,
        requiredRank: 'Contender',
        exclusiveToTop3: false,
        discountable: true,
      },

      // --- Rookie ---
      {
        name: 'Discord Event Access',
        description: 'Access Events and Game night in Discord VC.',
        cost: 0, // Informational/Free
        stock: 9999,
        requiredRank: 'Rookie',
        exclusiveToTop3: false,
        discountable: false,
      },
    ]

    await Reward.insertMany(rewards)
    console.log(`✅ Successfully seeded ${rewards.length} rewards`)

    mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('Error seeding rewards:', error)
    process.exit(1)
  }
}

seedRewards()
