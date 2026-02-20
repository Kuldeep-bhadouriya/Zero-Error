import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import MissionSubmission from '@/models/missionSubmission'
import User from '@/models/user'
import Mission from '@/models/mission'
import dbConnect from '@/lib/mongodb'
import { getWeekNumber, getWeekStartDate } from '@/lib/missionUtils'

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
    // Fetch the mission to check if it's weekly
    const mission = await Mission.findById(missionId).lean()
    if (!mission) {
      return NextResponse.json(
        { error: 'Mission not found' },
        { status: 404 }
      )
    }

    // Calculate week information if this is a weekly mission
    let weekYear: string | undefined
    let weekStartDate: Date | undefined

    if (mission.isWeeklyMission) {
      const now = new Date()
      weekYear = getWeekNumber(now)
      weekStartDate = getWeekStartDate(now)

      // Check if user already has a pending or approved submission for THIS WEEK
      const existingWeeklySubmission = await MissionSubmission.findOne({
        user: user._id,
        mission: missionId,
        weekYear,
        status: { $in: ['pending', 'approved'] }
      })

      if (existingWeeklySubmission) {
        return NextResponse.json(
          {
            error: existingWeeklySubmission.status === 'approved'
              ? 'You have already completed this weekly mission this week'
              : 'You already have a pending submission for this weekly mission this week'
          },
          { status: 400 }
        )
      }
    } else {
      // Check if user already has a pending or approved submission for non-weekly mission
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
    }

    // Create submission record in database
    const newSubmission = new MissionSubmission({
      user: user._id,
      mission: missionId,
      proof: fileUrl,
      status: 'pending',
      ...(weekYear && { weekYear }),
      ...(weekStartDate && { weekStartDate }),
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
