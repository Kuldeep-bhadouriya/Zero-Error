import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { errorResponse } from '@/lib/api-response'
import dbConnect from '@/lib/mongodb'
import Season from '@/models/season'
import logger from '@/lib/logger'

/**
 * GET /api/admin/seasons
 * List all seasons, sorted by seasonNumber descending.
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || !session.user.roles?.includes('admin')) {
      return errorResponse('Unauthorized', 401)
    }

    await dbConnect()
    const seasons = await Season.find()
      .sort({ seasonNumber: -1 })
      .lean()

    return NextResponse.json(seasons)
  } catch (error) {
    logger.error('Error fetching seasons:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/seasons
 * Create a new season with status 'upcoming'.
 * Body: { name, description?, startDate, scheduledEndDate }
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.roles?.includes('admin')) {
      return errorResponse('Unauthorized', 401)
    }

    await dbConnect()

    const { name, description, startDate, scheduledEndDate } = await req.json()

    if (!name || !startDate || !scheduledEndDate) {
      return NextResponse.json(
        { error: 'Name, start date, and end date are required' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(scheduledEndDate)

    if (end <= start) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // Check for overlapping active/upcoming seasons
    const overlapping = await Season.findOne({
      status: { $in: ['active', 'upcoming'] },
      $or: [
        { startDate: { $lte: end }, scheduledEndDate: { $gte: start } },
      ],
    })

    if (overlapping) {
      return NextResponse.json(
        { error: `Date range overlaps with "${overlapping.name}" (Season ${overlapping.seasonNumber})` },
        { status: 400 }
      )
    }

    // Auto-calculate season number
    const lastSeason = await Season.findOne().sort({ seasonNumber: -1 })
    const seasonNumber = lastSeason ? lastSeason.seasonNumber + 1 : 1

    const season = await Season.create({
      seasonNumber,
      name,
      description,
      startDate: start,
      scheduledEndDate: end,
      status: 'upcoming',
      createdBy: session.user.id,
    })

    return NextResponse.json(season, { status: 201 })
  } catch (error) {
    logger.error('Error creating season:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
