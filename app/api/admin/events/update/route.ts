import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Event from '@/models/event'

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user.roles.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { eventId, ...updateData } = body

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    // Validate status if provided
    if (updateData.status && !['draft', 'published', 'cancelled'].includes(updateData.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "draft", "published", or "cancelled"' },
        { status: 400 }
      )
    }

    // Validate eventType if provided
    if (updateData.eventType && !['upcoming', 'past'].includes(updateData.eventType)) {
      return NextResponse.json(
        { error: 'Invalid eventType. Must be "upcoming" or "past"' },
        { status: 400 }
      )
    }

    await dbConnect()

    const event = await Event.findByIdAndUpdate(
      eventId,
      { $set: updateData },
      { new: true, runValidators: true }
    )

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Revalidate the events page to show updated data
    revalidatePath('/events')
    revalidatePath('/api/events')
    revalidatePath('/')

    return NextResponse.json({
      success: true,
      event,
      message: 'Event updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update event' },
      { status: 500 }
    )
  }
}
