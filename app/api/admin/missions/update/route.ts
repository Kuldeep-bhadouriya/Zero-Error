import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Mission from '@/models/mission'
import { revalidatePath } from 'next/cache'

async function handleUpdate(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !session.user.roles?.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const data = await req.json()
    const { missionId, ...updates } = data
    
    if (!missionId) {
      return NextResponse.json(
        { error: 'Mission ID required' },
        { status: 400 }
      )
    }

    // Validate points if provided
    if (updates.points !== undefined && updates.points < 0) {
      return NextResponse.json(
        { error: 'Points must be a positive number' },
        { status: 400 }
      )
    }

    // Calculate endDate if daysAvailable is provided
    if (updates.isTimeLimited && updates.daysAvailable && !updates.endDate) {
      const startDate = updates.startDate ? new Date(updates.startDate) : new Date()
      updates.endDate = new Date(startDate.getTime() + updates.daysAvailable * 24 * 60 * 60 * 1000)
    }

    // Validate date range if time limited
    if (updates.isTimeLimited && updates.startDate && updates.endDate) {
      const start = new Date(updates.startDate)
      const end = new Date(updates.endDate)
      if (end <= start) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        )
      }
    }

    const mission = await Mission.findByIdAndUpdate(
      missionId,
      updates,
      { new: true, runValidators: true }
    )

    if (!mission) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
      )
    }

    // Revalidate relevant paths
    revalidatePath('/admin/ze-club')
    revalidatePath('/ze-club/missions')
    revalidatePath('/api/ze-club/missions')

    return NextResponse.json(mission)
  } catch (error: any) {
    console.error('Error updating mission:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update mission' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  return handleUpdate(req)
}

export async function PUT(req: NextRequest) {
  return handleUpdate(req)
}
