import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Event from '@/models/event'
import { UTApi } from 'uploadthing/server'

const utapi = new UTApi()

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user.roles.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    await dbConnect()

    const event = await Event.findById(eventId)

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Delete event image from UploadThing if it's an UploadThing URL
    if (event.imageUrl && event.imageUrl.includes('uploadthing')) {
      try {
        // Extract file key from UploadThing URL
        const fileKey = event.imageUrl.split('/').pop()
        if (fileKey) {
          await utapi.deleteFiles([fileKey])
        }
      } catch (uploadthingError) {
        console.error('Error deleting UploadThing image:', uploadthingError)
        // Continue with event deletion even if UploadThing deletion fails
      }
    }

    await Event.findByIdAndDelete(eventId)

    // Revalidate the events page to remove deleted event
    revalidatePath('/events')
    revalidatePath('/api/events')
    revalidatePath('/')

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete event' },
      { status: 500 }
    )
  }
}
