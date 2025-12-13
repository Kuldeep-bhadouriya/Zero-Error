import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Event from '@/models/event'

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user.roles.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      title,
      description,
      eventDate,
      eventType,
      imageUrl,
      location,
      registrationLink,
      featured,
      games,
      organizer,
      maxParticipants,
      status,
    } = body

    // Validation
    if (!title || !description || !eventDate || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description, eventDate, eventType' },
        { status: 400 }
      )
    }

    if (!['upcoming', 'past'].includes(eventType)) {
      return NextResponse.json(
        { error: 'Invalid eventType. Must be "upcoming" or "past"' },
        { status: 400 }
      )
    }

    if (status && !['draft', 'published', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "draft", "published", or "cancelled"' },
        { status: 400 }
      )
    }

    await dbConnect()

    const event = await Event.create({
      title,
      description,
      eventDate: new Date(eventDate),
      eventType,
      imageUrl,
      location,
      registrationLink,
      featured: featured || false,
      games: games || [],
      organizer: organizer || 'Zero Error Esports',
      maxParticipants,
      currentParticipants: 0,
      status: status || 'draft',
      createdBy: session.user.id,
    })

    // Revalidate the events page to show new event
    revalidatePath('/events')
    revalidatePath('/api/events')
    revalidatePath('/')

    return NextResponse.json({
      success: true,
      event,
      message: 'Event created successfully',
    })
  } catch (error: any) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create event' },
      { status: 500 }
    )
  }
}
