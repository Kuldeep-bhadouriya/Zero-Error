import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { errorResponse } from '@/lib/api-response'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'
import logger from '@/lib/logger'

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user.roles.includes('admin')) {
      return errorResponse('Unauthorized', 401)
    }

    await dbConnect()

    // Find all users with admin role
    const admins = await User.find({
      roles: 'admin'
    })
      .select('_id email image profilePhotoUrl roles points rank discordId zeTag createdAt')
      .sort({ createdAt: 1 }) // Sort by creation date, oldest first
      .lean()

    logger.info({ route: '/api/admin/users/admins', count: admins.length }, 'Fetched admin users')
    return NextResponse.json({ admins })
  } catch (error) {
    logger.error({ route: '/api/admin/users/admins', err: error }, 'Error fetching admins')
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    )
  }
}
