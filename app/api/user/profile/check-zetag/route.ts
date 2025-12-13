import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const zeTag = searchParams.get('zeTag')

    if (!zeTag) {
      return NextResponse.json({ error: 'ZE Tag is required' }, { status: 400 })
    }

    // Validate format
    const zeTagRegex = /^[a-zA-Z0-9_]{3,20}$/
    if (!zeTagRegex.test(zeTag)) {
      return NextResponse.json({
        available: false,
        error: 'ZE Tag must be 3-20 characters (alphanumeric and underscore only)',
      })
    }

    await dbConnect()

    // Check if zeTag is already taken by another user
    const existingUser = await User.findOne({
      zeTag,
      _id: { $ne: session.user.id },
    })

    return NextResponse.json({
      available: !existingUser,
      zeTag,
    })
  } catch (error) {
    console.error('Error checking zeTag availability:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
