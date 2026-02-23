import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { errorResponse } from '@/lib/api-response'
import dbConnect from '@/lib/mongodb'
import Season from '@/models/season'
import logger from '@/lib/logger'

/**
 * POST /api/admin/seasons/[id]/extend
 * Extend the scheduled end date of an active season.
 * Body: { newEndDate: string }
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
    const { newEndDate } = await req.json()

    if (!newEndDate) {
      return NextResponse.json({ error: 'New end date is required' }, { status: 400 })
    }

    const season = await Season.findById(id)
    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    if (season.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active seasons can be extended' },
        { status: 400 }
      )
    }

    const newEnd = new Date(newEndDate)
    if (newEnd <= new Date()) {
      return NextResponse.json(
        { error: 'New end date must be in the future' },
        { status: 400 }
      )
    }

    season.scheduledEndDate = newEnd
    await season.save()

    return NextResponse.json({
      message: 'Season extended successfully',
      season,
    })
  } catch (error) {
    logger.error('Error extending season:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
