import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { errorResponse } from '@/lib/api-response'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'
import logger from '@/lib/logger'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user.roles.includes('admin')) {
      return errorResponse('Unauthorized', 401)
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ users: [] })
    }

    await dbConnect()

    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // Search by username, email, or zeTag (case-insensitive partial match)
    const users = await User.find({
      $or: [
        { zeTag: { $regex: escapedQuery, $options: 'i' } },
        { email: { $regex: escapedQuery, $options: 'i' } },
      ]
    })
      .select('_id email image profilePhotoUrl roles points rank discordId zeTag')
      .limit(20)
      .lean()

    logger.info({ route: '/api/admin/users/search', count: users.length }, 'User search completed')
    return NextResponse.json({ users })
  } catch (error) {
    logger.error({ route: '/api/admin/users/search', err: error }, 'Error searching users')
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    )
  }
}
