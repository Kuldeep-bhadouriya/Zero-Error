import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Event from '@/models/event'

// Force dynamic rendering for client-side fetches
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const eventType = searchParams.get('eventType') // 'upcoming' | 'past'
    const featured = searchParams.get('featured') // 'true' | 'false'
    const limit = parseInt(searchParams.get('limit') || '0')

    console.log('Fetching events with params:', { eventType, featured, limit })

    await dbConnect()
    console.log('Database connected successfully')

    // Build query - only show published events
    const query: any = { status: 'published' }
    const now = new Date()

    // Filter by date instead of manual eventType field
    if (eventType === 'past') {
      // Events with date in the past
      query.eventDate = { $lt: now }
    } else if (eventType === 'upcoming') {
      // Events with date in the future
      query.eventDate = { $gte: now }
    } else if (eventType === 'current') {
      // Events happening today
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const todayEnd = new Date(todayStart)
      todayEnd.setDate(todayEnd.getDate() + 1)
      query.eventDate = { $gte: todayStart, $lt: todayEnd }
    }

    if (featured) {
      query.featured = featured === 'true'
    }

    console.log('Query:', query)

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
    console.log(`Found ${events.length} events`)

    return NextResponse.json({
      success: true,
      events,
      count: events.length,
    })
  } catch (error: any) {
    console.error('Error fetching events:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to fetch events',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
