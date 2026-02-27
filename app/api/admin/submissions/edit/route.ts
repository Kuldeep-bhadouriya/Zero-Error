import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import MissionSubmission from '@/models/missionSubmission'
import logger from '@/lib/logger'

/**
 * PATCH /api/admin/submissions/edit
 * Admin endpoint to edit a mission submission's proof URL and/or remarks.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !session.user.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { submissionId, proof, remarks } = await req.json()

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID required' }, { status: 400 })
    }

    const submission = await MissionSubmission.findById(submissionId)

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    if (proof !== undefined && proof.trim() !== '') {
      submission.proof = proof.trim()
    }

    if (remarks !== undefined) {
      submission.remarks = remarks.trim()
    }

    await submission.save()

    return NextResponse.json({ message: 'Submission updated successfully', submission })
  } catch (error: unknown) {
    logger.error('Error editing submission:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to edit submission' },
      { status: 500 }
    )
  }
}
