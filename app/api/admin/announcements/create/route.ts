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

export async function POST(req: Request) {
  const session = await auth()

  if (!session || !session.user.roles.includes('admin')) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  await dbConnect()

  try {
    const body = await req.json()
    const { title, message, type } = body

    if (!title || !message || !type) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const announcement = await Announcement.create({
      title,
      message,
      type,
      priority: Math.min(Math.max(Number(body.priority) || 5, 1), 10),
      active: body.active ?? true,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      link: body.link,
      linkText: body.linkText,
      targetPages:
        Array.isArray(body.targetPages) && body.targetPages.length > 0
          ? body.targetPages
          : ['all'],
      dismissible: body.dismissible ?? true,
      createdBy: session.user.id,
    })

    revalidateAnnouncements()

    return NextResponse.json({ announcement }, { status: 201 })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
