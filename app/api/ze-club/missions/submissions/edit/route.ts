import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import MissionSubmission from '@/models/missionSubmission'
import User from '@/models/user'
import logger from '@/lib/logger'
import { z } from 'zod'
import { badRequestFromZod, objectIdSchema } from '@/lib/validation'

const editSubmissionSchema = z.object({
  submissionId: objectIdSchema,
  fileUrl: z.string().url('Invalid file URL').max(2048, 'File URL is too long'),
})

/**
 * POST /api/ze-club/missions/submissions/edit
 * Allows a user to replace proof for their own pending mission submission.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const parsed = editSubmissionSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        badRequestFromZod(parsed.error),
        { status: 400 }
      )
    }

    const { submissionId, fileUrl } = parsed.data

    const user = await User.findOne({ email: session.user.email }).lean() as { _id: string } | null
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const submission = await MissionSubmission.findOne({
      _id: submissionId,
      user: user._id,
      status: 'pending',
    })

    if (!submission) {
      return NextResponse.json(
        { error: 'Pending submission not found or cannot be edited' },
        { status: 404 }
      )
    }

    submission.proof = fileUrl
    await submission.save()

    return NextResponse.json({
      message: 'Submission updated successfully',
      submission,
    })
  } catch (error) {
    logger.error('Error updating user submission:', error)
    return NextResponse.json(
      { error: 'Failed to update submission' },
      { status: 500 }
    )
  }
}
