import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Reward from '@/models/reward'

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user.roles.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      name,
      description,
      cost,
      stock,
      requiredRank,
      exclusiveToTop3,
      discountable,
    } = body

    // Validation
    if (!name || !description || cost === undefined || stock === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, cost, stock' },
        { status: 400 }
      )
    }

    if (cost < 0) {
      return NextResponse.json(
        { error: 'Cost must be a non-negative number' },
        { status: 400 }
      )
    }

    if (stock < 0) {
      return NextResponse.json(
        { error: 'Stock must be a non-negative number' },
        { status: 400 }
      )
    }

    const validRanks = ['Rookie', 'Contender', 'Gladiator', 'Vanguard', 'Errorless Legend']
    if (requiredRank && !validRanks.includes(requiredRank)) {
      return NextResponse.json(
        { error: 'Invalid requiredRank' },
        { status: 400 }
      )
    }

    await dbConnect()

    const reward = await Reward.create({
      name,
      description,
      cost,
      stock,
      requiredRank: requiredRank || 'Rookie',
      exclusiveToTop3: exclusiveToTop3 || false,
      discountable: discountable !== undefined ? discountable : true,
    })

    // Revalidate relevant pages
    revalidatePath('/ze-club/rewards')
    revalidatePath('/api/ze-club/rewards')

    return NextResponse.json({
      success: true,
      reward,
      message: 'Reward created successfully',
    })
  } catch (error: any) {
    console.error('Error creating reward:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create reward' },
      { status: 500 }
    )
  }
}
