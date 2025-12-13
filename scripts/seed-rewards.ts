import mongoose from 'mongoose'
import Reward from '../models/reward'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

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

    // Errorless Legend Exclusive Rewards
    const rewards = [
      {
        name: 'Gaming Headphone (1st Prize)',
        description: 'Premium RGB Gaming Headphone - Exclusive Errorless Legend Reward. Experience immersive audio with crystal-clear sound quality and comfortable over-ear design.',
        cost: 1000,
        stock: 5,
      },
      {
        name: 'Gaming Mouse (2nd Prize)',
        description: 'High-Performance RGB Gaming Mouse - Exclusive Errorless Legend Reward. Precision gaming with customizable DPI settings and ergonomic design.',
        cost: 1000,
        stock: 10,
      },
      {
        name: 'Gaming Mousepad (3rd Prize)',
        description: 'Extended RGB Gaming Mousepad - Exclusive Errorless Legend Reward. Large surface area with smooth glide and vibrant RGB lighting.',
        cost: 1000,
        stock: 15,
      },
      {
        name: 'ZE Exclusive Hoodie',
        description: 'Limited Edition Zero Error Esports Hoodie. Premium quality fabric with embroidered logo. Available in multiple sizes.',
        cost: 800,
        stock: 20,
      },
      {
        name: 'ZE Gaming T-Shirt',
        description: 'Official Zero Error Esports Gaming T-Shirt. Comfortable cotton blend with modern design.',
        cost: 500,
        stock: 50,
      },
      {
        name: 'ZE Collectible Badge',
        description: 'Limited Edition Zero Error Esports Metal Badge. Perfect for collectors and fans.',
        cost: 300,
        stock: 100,
      },
      {
        name: 'Discord Nitro (1 Month)',
        description: 'One month of Discord Nitro subscription. Unlock premium features and enhanced chat experience.',
        cost: 600,
        stock: 30,
      },
      {
        name: 'Steam Wallet Code ($10)',
        description: '$10 Steam Wallet code to fuel your gaming library. Redeem instantly.',
        cost: 700,
        stock: 25,
      },
      {
        name: 'Custom Profile Badge',
        description: 'Exclusive custom badge for your ZE Club profile. Stand out from the crowd.',
        cost: 400,
        stock: 50,
      },
      {
        name: 'Priority Support Access',
        description: 'Get priority support access for all ZE Club related queries. Valid for 3 months.',
        cost: 350,
        stock: 40,
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
