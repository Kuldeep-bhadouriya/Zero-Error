import mongoose from 'mongoose'
import User from '../models/user'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

async function makeAdmin(email: string) {
  try {
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables')
    }

    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Find user by email
    const user = await User.findOne({ email })

    if (!user) {
      console.error(`❌ User with email "${email}" not found`)
      console.log('\nAvailable users:')
      const users = await User.find({}, 'email name roles')
      users.forEach(u => {
        console.log(`  - ${u.email} (${u.name}) - Roles: ${u.roles.join(', ')}`)
      })
      process.exit(1)
    }

    // Check if user already has admin role
    if (user.roles.includes('admin')) {
      console.log(`ℹ️  User "${email}" already has admin role`)
      console.log(`   Current roles: ${user.roles.join(', ')}`)
      process.exit(0)
    }

    // Add admin role
    user.roles.push('admin')
    await user.save()

    console.log('✅ Admin role granted successfully!')
    console.log(`   User: ${user.email}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Roles: ${user.roles.join(', ')}`)
    console.log('\n🎉 You can now access the admin portal at: /admin/ze-club')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\n✅ Disconnected from MongoDB')
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.error('❌ Please provide an email address')
  console.log('Usage: npm run db:make-admin <email>')
  console.log('Example: npm run db:make-admin user@example.com')
  process.exit(1)
}

makeAdmin(email)
