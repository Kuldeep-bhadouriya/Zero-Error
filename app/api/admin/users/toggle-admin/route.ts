import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user.roles.includes('admin')) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { userId, action } = await req.json()

    if (!userId || !action || !['add', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid request. userId and action (add/remove) are required.' },
        { status: 400 }
      )
    }

    // Prevent admin from removing their own admin role
    if (action === 'remove' && userId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot remove your own admin role.' },
        { status: 400 }
      )
    }

    await dbConnect()

    const user = await User.findById(userId)
    if (!user) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      )
    }

    if (action === 'add') {
      // Add admin role if not already present
      if (!user.roles.includes('admin')) {
        user.roles.push('admin')
        await user.save()
      }
    } else if (action === 'remove') {
      // Remove admin role
      user.roles = user.roles.filter((role: string) => role !== 'admin')
      await user.save()
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        zeTag: user.zeTag,
        roles: user.roles,
        points: user.points,
        rank: user.rank
      }
    })
  } catch (error) {
    console.error('Error toggling admin role:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
