import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import MissionSubmission from '@/models/missionSubmission'
import User from '@/models/user'
import dbConnect from '@/lib/mongodb'

/**
 * POST /api/ze-club/missions/upload
 * Handles mission proof submission with file URL from UploadThing.
 * Creates a submission record in the database.
 * Requires authentication via NextAuth session.
 * 
 * Note: File upload is handled by UploadThing (/api/uploadthing)
 * This endpoint only saves the submission after upload completes
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  
  // Verify user authentication
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await dbConnect()

  // Find authenticated user in database
  const user = await User.findOne({ email: session.user.email })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Parse JSON body (file URL comes from UploadThing client)
  const body = await req.json()
  const { missionId, fileUrl } = body

  // Validate required fields
  if (!missionId || !fileUrl) {
    return NextResponse.json(
      { error: 'Missing mission ID or file URL' },
      { status: 400 }
    )
  }

  try {
    // Check if user already has a pending or approved submission for this mission
    const existingSubmission = await MissionSubmission.findOne({
      user: user._id,
      mission: missionId,
      status: { $in: ['pending', 'approved'] }
    })

    if (existingSubmission) {
      return NextResponse.json(
        { 
          error: existingSubmission.status === 'approved' 
            ? 'You have already completed this mission' 
            : 'You already have a pending submission for this mission'
        },
        { status: 400 }
      )
    }

    // Create submission record in database
    const newSubmission = new MissionSubmission({
      user: user._id,
      mission: missionId,
      proof: fileUrl,
      status: 'pending',
    })

    await newSubmission.save()

    return NextResponse.json({
      message: 'Submission created successfully',
      submission: newSubmission,
    })
  } catch (error) {
    console.error('Error saving submission to DB:', error)
    return NextResponse.json(
      { error: 'Failed to create submission' },
      { status: 500 }
    )
  }
}
