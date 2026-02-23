import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { errorResponse } from '@/lib/api-response'
import dbConnect from '@/lib/mongodb'
import SeasonArchive from '@/models/seasonArchive'
import User from '@/models/user'
import logger from '@/lib/logger'

/**
 * GET /api/ze-club/season/[seasonNumber]/user
 * Returns the authenticated user's stats for a past season.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ seasonNumber: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return errorResponse('Unauthorized', 401)
    }

    await dbConnect()
    const { seasonNumber } = await params
    const num = parseInt(seasonNumber, 10)

    if (isNaN(num)) {
      return NextResponse.json({ error: 'Invalid season number' }, { status: 400 })
    }

    const user = await User.findOne({ email: session.user.email }).select('_id').lean() as { _id: string } | null
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const archive = await SeasonArchive.findOne({
      seasonNumber: num,
      user: user._id,
    }).lean()

    if (!archive) {
      return NextResponse.json({ error: 'No data found for this season' }, { status: 404 })
    }

    return NextResponse.json(archive)
  } catch (error) {
    logger.error('Error fetching user season stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
