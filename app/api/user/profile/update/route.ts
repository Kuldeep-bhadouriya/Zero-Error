import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    await dbConnect()

    const body = await req.json()
    const { name, bio } = body

    // Validate input
    if (name && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
    }

    if (bio && (typeof bio !== 'string' || bio.length > 200)) {
      return NextResponse.json(
        { error: 'Bio must be 200 characters or less' },
        { status: 400 }
      )
    }

    const user = await User.findById(session.user.id)
    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Update only allowed fields
    if (name !== undefined) user.name = name.trim()
    if (bio !== undefined) user.bio = bio.trim()

    await user.save()

    return NextResponse.json({
      success: true,
      profile: {
        id: user._id.toString(),
        name: user.name,
        bio: user.bio,
      },
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
