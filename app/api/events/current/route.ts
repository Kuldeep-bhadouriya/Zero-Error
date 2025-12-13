import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Event from '@/models/event'

// Make this route dynamic to prevent caching issues
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    await dbConnect()

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    // Find events that are happening today or are currently ongoing
    // This includes events that started today or events that are multi-day
    const events = await Event.find({
      status: 'published',
      eventDate: {
        $gte: todayStart,
        $lt: todayEnd,
      },
    })
      .select('-createdBy')
      .sort({ eventDate: 1 })
      .limit(6)
      .lean()

    return NextResponse.json({
      success: true,
      events,
      count: events.length,
    })
  } catch (error: any) {
    console.error('Error fetching current events:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch current events' },
      { status: 500 }
    )
  }
}
