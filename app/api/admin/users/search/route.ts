import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user.roles.includes('admin')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ users: [] })
    }

    await dbConnect()

    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // Search by username, email, or zeClubId (case-insensitive partial match)
    const users = await User.find({
      $or: [
        { name: { $regex: escapedQuery, $options: 'i' } },
        { email: { $regex: escapedQuery, $options: 'i' } },
        { zeClubId: { $regex: escapedQuery, $options: 'i' } },
        { zeTag: { $regex: escapedQuery, $options: 'i' } }
      ]
    })
      .select('_id name email image profilePhotoUrl zeClubId roles points rank discordId zeTag')
      .limit(20)
      .lean()

    console.log(`Found ${users.length} users for query: "${query}"`)
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error searching users:', error)
    return NextResponse.json(
      { error: 'Failed to search users', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
