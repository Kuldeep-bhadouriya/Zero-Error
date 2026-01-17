import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user.roles.includes('admin')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    await dbConnect()

    // Find all users with admin role
    const admins = await User.find({
      roles: 'admin'
    })
      .select('_id email image profilePhotoUrl roles points rank discordId zeTag createdAt')
      .sort({ createdAt: 1 }) // Sort by creation date, oldest first
      .lean()

    console.log(`Found ${admins.length} admin users`)
    return NextResponse.json({ admins })
  } catch (error) {
    console.error('Error fetching admins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admins', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
