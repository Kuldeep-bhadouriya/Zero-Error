import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Reward from '@/models/reward'

// Prevent caching to ensure admins always see latest data
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  try {
    const session = await auth()
    
    if (!session || !session.user.roles.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const requiredRank = searchParams.get('requiredRank')

    await dbConnect()

    // Build query
    const query: any = {}

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    if (requiredRank) {
      query.requiredRank = requiredRank
    }

    const rewards = await Reward.find(query)
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({
      success: true,
      rewards,
    })
  } catch (error: any) {
    console.error('Error listing rewards:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to list rewards' },
      { status: 500 }
    )
  }
}
