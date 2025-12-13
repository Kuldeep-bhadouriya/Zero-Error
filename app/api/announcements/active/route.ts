import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Announcement from '@/models/announcement'

const MAX_PER_PAGE = 3

function buildDateFilter(now: Date) {
  return {
    $and: [
      {
        $or: [
          { startDate: { $lte: now } },
          { startDate: { $exists: false } },
          { startDate: null },
        ],
      },
      {
        $or: [
          { endDate: { $gte: now } },
          { endDate: { $exists: false } },
          { endDate: null },
        ],
      },
    ],
  }
}

export async function GET(req: Request) {
  await dbConnect()

  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(Number(searchParams.get('page')) || 1, 1)
    const targetPage = searchParams.get('targetPage') || 'all'
    const now = new Date()
    const skip = (page - 1) * MAX_PER_PAGE

    const filter: Record<string, unknown> = {
      active: true,
      ...buildDateFilter(now),
    }

    if (targetPage && targetPage !== 'all') {
      filter.targetPages = { $in: ['all', targetPage] }
    }

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .sort({ priority: -1, updatedAt: -1 })
        .skip(skip)
        .limit(MAX_PER_PAGE)
        .lean(),
      Announcement.countDocuments(filter),
    ])

    return NextResponse.json({
      announcements,
      pagination: {
        page,
        limit: MAX_PER_PAGE,
        total,
        totalPages: Math.ceil(total / MAX_PER_PAGE) || 1,
        hasMore: page * MAX_PER_PAGE < total,
      },
    })
  } catch (error) {
    console.error('Error fetching active announcements:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
