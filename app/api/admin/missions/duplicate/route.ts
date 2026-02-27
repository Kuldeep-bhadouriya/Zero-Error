import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Mission from '@/models/mission'
import { revalidatePath } from 'next/cache'
import logger from '@/lib/logger'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user || !session.user.roles?.includes('admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    const { missionId } = await req.json()

    if (!missionId) {
      return NextResponse.json({ error: 'Mission ID required' }, { status: 400 })
    }

    const original = await Mission.findById(missionId).lean()

    if (!original) {
      return NextResponse.json({ error: 'Mission not found' }, { status: 404 })
    }

    // Strip fields that should not be copied
    const { _id, createdAt, updatedAt, currentCompletions, __v, ...fields } = original as any

    const duplicate = await Mission.create({
      ...fields,
      name: `${fields.name} (Copy)`,
      active: false, // Start inactive so admin can review before publishing
      currentCompletions: 0,
      createdBy: session.user.id,
    })

    revalidatePath('/admin/ze-club')
    revalidatePath('/ze-club/missions')

    return NextResponse.json(duplicate, { status: 201 })
  } catch (error: unknown) {
    logger.error('Error duplicating mission:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to duplicate mission' },
      { status: 500 }
    )
  }
}
