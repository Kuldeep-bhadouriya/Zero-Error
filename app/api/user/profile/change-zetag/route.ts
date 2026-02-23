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

    const body = await req.json()
    const { zeTag } = body

    if (!zeTag) {
      return NextResponse.json({ error: 'ZE Tag is required' }, { status: 400 })
    }

    // Validate format
    const zeTagRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!zeTagRegex.test(zeTag)) {
      return NextResponse.json(
        { error: 'ZE Tag must be 3-20 characters (alphanumeric and underscore only)' },
        { status: 400 }
      )
    }

    await dbConnect()

    // Check if zeTag is already taken
    const existingUser = await User.findOne({
      zeTag,
      _id: { $ne: session.user.id },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'This ZE Tag is already taken' },
        { status: 409 }
      )
    }

    const user = await User.findById(session.user.id)
    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    user.zeTag = zeTag
    await user.save()

    return NextResponse.json({
      success: true,
      zeTag: user.zeTag,
    })
  } catch (error: unknown) {
    logger.error('Error changing zeTag:', error)
    if (error instanceof Error && 'code' in error && (error as { code: unknown }).code === 11000) {
      return NextResponse.json(
        { error: 'This ZE Tag is already taken' },
        { status: 409 }
      )
    }
    return new NextResponse('Internal server error', { status: 500 })
  }
}
