import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { errorResponse } from '@/lib/api-response'
import dbConnect from '@/lib/mongodb'
import Season from '@/models/season'
import Mission from '@/models/mission'
import Announcement from '@/models/announcement'
import logger from '@/lib/logger'

/**
 * POST /api/admin/seasons/[id]/extend
 * Extend the scheduled end date of an active season.
 * Also extends endDate on time-limited missions and active announcements
 * that were tied to the old season end date (within a ±1 day window).
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

    // Capture the old end date BEFORE overwriting it so we can cascade the
    // change to any missions / announcements that were anchored to it.
    const oldScheduledEndDate = new Date(season.scheduledEndDate)
    const oneDayMs = 24 * 60 * 60 * 1000
    const windowLow  = new Date(oldScheduledEndDate.getTime() - oneDayMs)
    const windowHigh = new Date(oldScheduledEndDate.getTime() + oneDayMs)

    season.scheduledEndDate = newEnd
    await season.save()

    // Issue 1 fix: extend time-limited missions whose endDate was pinned to the
    // old season end so they remain visible after the season extension.
    const missionsResult = await Mission.updateMany(
      {
        active: true,
        isTimeLimited: true,
        endDate: { $gte: windowLow, $lte: windowHigh },
      },
      { $set: { endDate: newEnd } }
    )

    // Issue 2 fix: extend active announcements whose endDate was tied to the
    // old season end so notification timings reflect the new deadline.
    const announcementsResult = await Announcement.updateMany(
      {
        active: true,
        endDate: { $gte: windowLow, $lte: windowHigh },
      },
      { $set: { endDate: newEnd } }
    )

    logger.info(
      `Season ${season.seasonNumber} extended to ${newEnd.toISOString()}. ` +
      `Updated ${missionsResult.modifiedCount} mission(s) and ${announcementsResult.modifiedCount} announcement(s).`
    )

    return NextResponse.json({
      message: 'Season extended successfully',
      season,
      updatedMissions: missionsResult.modifiedCount,
      updatedAnnouncements: announcementsResult.modifiedCount,
    })
  } catch (error) {
    logger.error('Error extending season:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
