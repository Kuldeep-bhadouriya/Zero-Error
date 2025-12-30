import mongoose from 'mongoose'
import User from '../models/user'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined in environment variables')
}

async function addCoins() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')

    // Get email from command line argument
    const email = process.argv[2]
    const coinsToAdd = parseInt(process.argv[3] || '1000')

    if (!email) {
      console.error('❌ Usage: bun run scripts/add-coins.ts <email> [amount]')
      console.error('   Example: bun run scripts/add-coins.ts user@example.com 5000')
      process.exit(1)
    }

    // Find user by email
    const user = await User.findOne({ email })

    if (!user) {
      console.error(`❌ User with email ${email} not found`)
      process.exit(1)
    }

    console.log(`\n📊 Current Stats for ${user.name || user.email}:`)
    console.log(`   ZE Coins: ${user.zeCoins || 0}`)
    console.log(`   Experience: ${user.experience || 0}`)
    console.log(`   Rank: ${user.rank}`)

    // Add coins
    user.zeCoins = (user.zeCoins || 0) + coinsToAdd
    await user.save()

    console.log(`\n✅ Successfully added ${coinsToAdd} ZE Coins!`)
    console.log(`\n📊 New Stats:`)
    console.log(`   ZE Coins: ${user.zeCoins}`)
    console.log(`   Experience: ${user.experience || 0}`)
    console.log(`   Rank: ${user.rank}`)
    console.log(`\n💡 Note: Experience points remain unchanged (rank protected!)`)

    mongoose.connection.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error adding coins:', error)
    process.exit(1)
  }
}

addCoins()
