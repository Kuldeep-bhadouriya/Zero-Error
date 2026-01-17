import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Mission from '@/models/mission'
import MissionSubmission from '@/models/missionSubmission'
import { revalidatePath } from 'next/cache'

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !session.user.roles?.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { searchParams } = new URL(req.url)
    const missionId = searchParams.get('id')
    
    if (!missionId) {
      return NextResponse.json(
        { error: 'Mission ID required' },
        { status: 400 }
      )
    }

    // Soft delete - mark as deleted, inactive and set metadata
    const mission = await Mission.findByIdAndUpdate(
      missionId,
      {
        active: false,
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: session.user.id,
        deactivatedAt: new Date(),
        deactivatedBy: session.user.id,
      },
      { new: true }
    )

    if (!mission) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
      )
    }

    // Check if there are any pending submissions
    const pendingCount = await MissionSubmission.countDocuments({
      mission: missionId,
      status: 'pending',
    })

    // Revalidate relevant paths
    revalidatePath('/admin/ze-club')
    revalidatePath('/ze-club/missions')
    revalidatePath('/api/ze-club/missions')

    return NextResponse.json({
      mission,
      pendingSubmissions: pendingCount,
      message: pendingCount > 0 
        ? `Mission deactivated. ${pendingCount} pending submissions still need review.`
        : 'Mission deactivated successfully',
    })
  } catch (error: any) {
    console.error('Error deleting mission:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete mission' },
      { status: 500 }
    )
  }
}
