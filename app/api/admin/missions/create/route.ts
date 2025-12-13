import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Mission from '@/models/mission'
import { revalidatePath } from 'next/cache'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !session.user.roles?.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const data = await req.json()
    
    // Validate required fields
    if (!data.name || !data.description || !data.points || !data.category) {
      return NextResponse.json(
        { error: 'Missing required fields: name, description, points, and category are required' },
        { status: 400 }
      )
    }

    // Validate points
    if (data.points < 0) {
      return NextResponse.json(
        { error: 'Points must be a positive number' },
        { status: 400 }
      )
    }

    // Calculate endDate if daysAvailable is provided
    let endDate = data.endDate
    if (data.isTimeLimited && data.daysAvailable && !endDate) {
      const startDate = data.startDate ? new Date(data.startDate) : new Date()
      endDate = new Date(startDate.getTime() + data.daysAvailable * 24 * 60 * 60 * 1000)
    }

    // Validate date range if time limited
    if (data.isTimeLimited && data.startDate && endDate) {
      const start = new Date(data.startDate)
      const end = new Date(endDate)
      if (end <= start) {
        return NextResponse.json(
          { error: 'End date must be after start date' },
          { status: 400 }
        )
      }
    }

    const mission = await Mission.create({
      ...data,
      endDate,
      createdBy: session.user.id,
      currentCompletions: 0,
    })

    // Revalidate relevant paths
    revalidatePath('/admin/ze-club')
    revalidatePath('/ze-club/missions')
    revalidatePath('/api/ze-club/missions')

    return NextResponse.json(mission, { status: 201 })
  } catch (error: any) {
    console.error('Error creating mission:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create mission' },
      { status: 500 }
    )
  }
}
