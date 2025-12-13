import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Announcement from '@/models/announcement'
import { revalidatePath } from 'next/cache'

const REVALIDATE_PATHS = ['/', '/ze-club', '/admin/ze-club']

function revalidateAnnouncements() {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path)
  }
}

export async function DELETE(req: Request) {
  const session = await auth()

  if (!session || !session.user.roles.includes('admin')) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const announcementId = searchParams.get('id')

  if (!announcementId) {
    return new NextResponse('Announcement ID is required', { status: 400 })
  }

  await dbConnect()

  try {
    const announcement = await Announcement.findByIdAndDelete(announcementId)

    if (!announcement) {
      return new NextResponse('Announcement not found', { status: 404 })
    }

    revalidateAnnouncements()

    return NextResponse.json({ message: 'Announcement deleted' })
  } catch (error) {
    console.error('Error deleting announcement:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
