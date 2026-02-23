import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { errorResponse } from '@/lib/api-response'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'
import bcrypt from 'bcrypt'
import logger from '@/lib/logger'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return errorResponse('Unauthorized', 401)
    }

    const body = await req.json()
    const { currentPassword, newPassword } = body

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 }
      )
    }

    await dbConnect()

    const user = await User.findById(session.user.id)
    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // If user has a password set, verify current password
    if (user.hashedPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required' },
          { status: 400 }
        )
      }

      const isValid = await bcrypt.compare(currentPassword, user.hashedPassword)
      if (!isValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 401 }
        )
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12)
    user.hashedPassword = hashedPassword
    user.passwordUpdatedAt = new Date()
    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    })
  } catch (error) {
    logger.error('Error changing password:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
