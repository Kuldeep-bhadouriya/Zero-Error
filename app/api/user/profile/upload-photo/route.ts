import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'
import { uploadToS3 } from '@/lib/s3'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPG, PNG, and WebP are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      )
    }

    await dbConnect()

    const user = await User.findById(session.user.id)
    if (!user) {
      return new NextResponse('User not found', { status: 404 })
    }

    // Upload to S3
    const fileName = `profile-photos/${session.user.id}-${Date.now()}.${file.type.split('/')[1]}`
    const buffer = Buffer.from(await file.arrayBuffer())
    const photoUrl = await uploadToS3(buffer, fileName, file.type)

    // Update user profile
    user.profilePhotoUrl = photoUrl
    await user.save()

    return NextResponse.json({
      success: true,
      profilePhotoUrl: photoUrl,
    })
  } catch (error) {
    console.error('Error uploading profile photo:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
