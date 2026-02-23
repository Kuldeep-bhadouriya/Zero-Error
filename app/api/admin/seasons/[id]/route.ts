import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { errorResponse } from '@/lib/api-response'
import dbConnect from '@/lib/mongodb'
import Season from '@/models/season'
import { z } from 'zod'
import { badRequestFromZod, objectIdSchema, optionalTextSchema } from '@/lib/validation'
import logger from '@/lib/logger'

const seasonPatchSchema = z
  .object({
    name: optionalTextSchema('Name', 80),
    description: optionalTextSchema('Description', 500),
    startDate: z.string().datetime().optional(),
    scheduledEndDate: z.string().datetime().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'At least one field is required for update',
  })

/**
 * PATCH /api/admin/seasons/[id]
 * Update a season (name, description, scheduledEndDate).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.roles?.includes('admin')) {
      return errorResponse('Unauthorized', 401)
    }

    await dbConnect()
    const { id } = await params
    const idParse = objectIdSchema.safeParse(id)
    if (!idParse.success) {
      return NextResponse.json({ error: 'Invalid season ID' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = seasonPatchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(badRequestFromZod(parsed.error), { status: 400 })
    }
    const updates = parsed.data

    const season = await Season.findById(idParse.data)
    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    // Only allow certain field updates
    if (updates.name) season.name = updates.name
    if (updates.description !== undefined) season.description = updates.description

    // Only allow date changes for upcoming seasons
    if (updates.startDate && season.status === 'upcoming') {
      season.startDate = new Date(updates.startDate)
    }
    if (updates.scheduledEndDate) {
      const newEnd = new Date(updates.scheduledEndDate)
      if (newEnd <= season.startDate) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        )
      }
      season.scheduledEndDate = newEnd
    }

    await season.save()
    return NextResponse.json(season)
  } catch (error) {
    logger.error('Error updating season:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/seasons/[id]
 * Delete a season. Only 'upcoming' seasons can be deleted.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || !session.user.roles?.includes('admin')) {
      return errorResponse('Unauthorized', 401)
    }

    await dbConnect()
    const { id } = await params
    const idParse = objectIdSchema.safeParse(id)
    if (!idParse.success) {
      return NextResponse.json({ error: 'Invalid season ID' }, { status: 400 })
    }

    const season = await Season.findById(idParse.data)

    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 })
    }

    if (season.status !== 'upcoming') {
      return NextResponse.json(
        { error: 'Only upcoming seasons can be deleted' },
        { status: 400 }
      )
    }

    await Season.findByIdAndDelete(idParse.data)
    return NextResponse.json({ message: 'Season deleted' })
  } catch (error) {
    logger.error('Error deleting season:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
