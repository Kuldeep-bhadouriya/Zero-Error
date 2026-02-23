import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { errorResponse } from '@/lib/api-response'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'
import logger from '@/lib/logger'

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return errorResponse('Unauthorized', 401)
    }

    await dbConnect()

    const body = await req.json()
    const { bio } = body

    // Validate input
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
    if (bio !== undefined) user.bio = bio.trim()

    await user.save()

    return NextResponse.json({
      success: true,
      profile: {
        id: user._id.toString(),
        bio: user.bio,
      },
    })
  } catch (error) {
    logger.error('Error updating profile:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
