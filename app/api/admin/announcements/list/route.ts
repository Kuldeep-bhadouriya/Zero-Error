import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Announcement from '@/models/announcement'

export async function GET(req: Request) {
  const session = await auth()

  if (!session || !session.user.roles.includes('admin')) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  await dbConnect()

  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(Number(searchParams.get('page')) || 1, 1)
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 50)
    const skip = (page - 1) * limit
    const search = searchParams.get('search')
    const active = searchParams.get('active')

    const filter: Record<string, unknown> = {}

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ]
    }

    if (active === 'true') {
      filter.active = true
    } else if (active === 'false') {
      filter.active = false
    }

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Announcement.countDocuments(filter),
    ])

    return NextResponse.json({
      announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
