import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Mission from '@/models/mission'
import { revalidatePath } from 'next/cache'

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !session.user.roles?.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { missionId, active } = await req.json()
    
    if (!missionId || typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'Mission ID and active status required' },
        { status: 400 }
      )
    }

    const updateData: any = { active }
    
    // If activating, clear deactivation metadata
    if (active) {
      updateData.deactivatedAt = null
      updateData.deactivatedBy = null
    } else {
      // If deactivating, set metadata
      updateData.deactivatedAt = new Date()
      updateData.deactivatedBy = session.user.id
    }

    const mission = await Mission.findByIdAndUpdate(
      missionId,
      updateData,
      { new: true }
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
    console.error('Error toggling mission status:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to toggle mission status' },
      { status: 500 }
    )
  }
}
