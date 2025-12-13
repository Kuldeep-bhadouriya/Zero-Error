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

function normalizePayload(payload: Record<string, unknown>) {
  const normalized: Record<string, unknown> = { ...payload }

  if (normalized.priority !== undefined) {
    normalized.priority = Math.min(Math.max(Number(normalized.priority) || 5, 1), 10)
  }

  if (normalized.startDate) {
    normalized.startDate = new Date(normalized.startDate as string)
  }

  if (normalized.endDate) {
    normalized.endDate = new Date(normalized.endDate as string)
  }

  if (normalized.targetPages) {
    normalized.targetPages = Array.isArray(normalized.targetPages) && (normalized.targetPages as unknown[]).length > 0
      ? normalized.targetPages
      : ['all']
  }

  return normalized
}

export async function PATCH(req: Request) {
  const session = await auth()

  if (!session || !session.user.roles.includes('admin')) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  await dbConnect()

  try {
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) {
      return new NextResponse('Announcement ID is required', { status: 400 })
    }

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      normalizePayload(updates),
      { new: true, runValidators: true }
    )

    if (!announcement) {
      return new NextResponse('Announcement not found', { status: 404 })
    }

    revalidateAnnouncements()

    return NextResponse.json({ announcement })
  } catch (error) {
    console.error('Error updating announcement:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
