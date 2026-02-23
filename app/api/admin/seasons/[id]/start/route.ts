import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { errorResponse } from '@/lib/api-response'
import dbConnect from '@/lib/mongodb'
import Season from '@/models/season'
import logger from '@/lib/logger'

/**
 * POST /api/admin/seasons/[id]/start
 * Activate an upcoming season.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.roles?.includes('admin')) {
      return errorResponse('Unauthorized', 401)
    }

    await dbConnect()
    const { id } = await params

    // Check no other season is active
    const activeSeason = await Season.findOne({ status: 'active' })
    if (activeSeason) {
      return NextResponse.json(
        { error: `Cannot start: "${activeSeason.name}" is currently active. End it first.` },
        { status: 400 }
      )
    }

    const season = await Season.findById(id)
    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    if (season.status !== 'upcoming') {
      return NextResponse.json(
        { error: 'Only upcoming seasons can be started' },
        { status: 400 }
      )
    }

    // If start date is in the future, set it to now
    const now = new Date()
    if (season.startDate > now) {
      season.startDate = now
    }

    season.status = 'active'
    await season.save()

    return NextResponse.json(season)
  } catch (error) {
    logger.error('Error starting season:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
