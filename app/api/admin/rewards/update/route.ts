import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Reward from '@/models/reward'

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user.roles.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { rewardId, ...updateData } = body

    if (!rewardId) {
      return NextResponse.json(
        { error: 'Reward ID is required' },
        { status: 400 }
      )
    }

    // Validate numeric fields
    if (updateData.cost !== undefined && updateData.cost < 0) {
      return NextResponse.json(
        { error: 'Cost must be a non-negative number' },
        { status: 400 }
      )
    }

    if (updateData.stock !== undefined && updateData.stock < 0) {
      return NextResponse.json(
        { error: 'Stock must be a non-negative number' },
        { status: 400 }
      )
    }

    // Validate rank if provided
    const validRanks = ['Rookie', 'Contender', 'Gladiator', 'Vanguard', 'Errorless Legend']
    if (updateData.requiredRank && !validRanks.includes(updateData.requiredRank)) {
      return NextResponse.json(
        { error: 'Invalid requiredRank' },
        { status: 400 }
      )
    }

    await dbConnect()

    const reward = await Reward.findByIdAndUpdate(
      rewardId,
      { $set: updateData },
      { new: true, runValidators: true }
    )

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
      reward,
      message: 'Reward updated successfully',
    })
  } catch (error: any) {
    console.error('Error updating reward:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update reward' },
      { status: 500 }
    )
  }
}
