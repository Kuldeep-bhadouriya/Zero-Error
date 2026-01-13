import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Event from '@/models/event'

// ISR: Revalidate every 5 minutes (300 seconds) instead of force-dynamic
export const revalidate = 300

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const eventType = searchParams.get('eventType') // 'upcoming' | 'past'
    const featured = searchParams.get('featured') // 'true' | 'false'
    const limit = parseInt(searchParams.get('limit') || '0')

    await dbConnect()

    // Build query - only show published events
    const query: any = { status: 'published' }

    if (eventType) {
      query.eventType = eventType
    }

    if (featured) {
      query.featured = featured === 'true'
    }

    let eventsQuery = Event.find(query).select('-createdBy')

    // Sort upcoming events by date (ascending - soonest first)
    // Sort past events by date (descending - most recent first)
    if (eventType === 'upcoming') {
      eventsQuery = eventsQuery.sort({ eventDate: 1 })
    } else if (eventType === 'past') {
      eventsQuery = eventsQuery.sort({ eventDate: -1 })
    } else {
      eventsQuery = eventsQuery.sort({ eventDate: -1 })
    }

    if (limit > 0) {
      eventsQuery = eventsQuery.limit(limit)
    }

    const events = await eventsQuery.lean()

    return NextResponse.json({
      success: true,
      events,
      count: events.length,
    })
  } catch (error: any) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch events' },
      { status: 500 }
    )
  }
}
