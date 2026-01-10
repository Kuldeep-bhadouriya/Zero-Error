import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Reward from '@/models/reward'

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user.roles.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { rewardId } = body

    if (!rewardId) {
      return NextResponse.json(
        { error: 'Reward ID is required' },
        { status: 400 }
      )
    }

    await dbConnect()

    const reward = await Reward.findByIdAndDelete(rewardId)

    if (!reward) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      )
    }

    // Revalidate relevant pages
    revalidatePath('/ze-club/rewards')
    revalidatePath('/api/ze-club/rewards')

    return NextResponse.json({
      success: true,
      message: 'Reward deleted successfully',
    })
  } catch (error: any) {
    console.error('Error deleting reward:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete reward' },
      { status: 500 }
    )
  }
}
