import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Event from '@/models/event'

// Prevent caching to ensure admins always see latest data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user.roles.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const eventType = searchParams.get('eventType') // 'upcoming' | 'past'
    const status = searchParams.get('status') // 'draft' | 'published' | 'cancelled'
    const featured = searchParams.get('featured') // 'true' | 'false'

    await dbConnect()

    // Build query
    const query: any = {}

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ]
    }

    if (eventType) {
      query.eventType = eventType
    }

    if (status) {
      query.status = status
    }

    if (featured) {
      query.featured = featured === 'true'
    }

    const skip = (page - 1) * limit

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('createdBy', 'name email')
        .sort({ eventDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Event.countDocuments(query),
    ])

    return NextResponse.json({
      success: true,
      events,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Error listing events:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list events' },
      { status: 500 }
    )
  }
}
