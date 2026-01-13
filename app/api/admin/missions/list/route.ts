import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Mission from '@/models/mission'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || !session.user.roles?.includes('admin')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await dbConnect()

    const { searchParams } = new URL(req.url)
    const page = Math.max(Number(searchParams.get('page')) || 1, 1)
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 20, 1), 100)
    const skip = (page - 1) * limit
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const active = searchParams.get('active')
    const featured = searchParams.get('featured')
    const timeLimited = searchParams.get('timeLimited')
    const search = searchParams.get('search')

    // Build filter query
    const filter: any = {}
    
    if (category && category !== 'all') {
      filter.category = category
    }
    
    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty
    }
    
    if (active === 'true') {
      filter.active = true
    } else if (active === 'false') {
      filter.active = false
    }
    
    if (featured === 'true') {
      filter.featured = true
    }
    
    if (timeLimited === 'true') {
      filter.isTimeLimited = true
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    const [missions, total] = await Promise.all([
      Mission.find(filter)
        .populate('createdBy', 'name email')
        .populate('deactivatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Mission.countDocuments(filter)
    ])

    // Add computed fields
    const now = new Date()
    const missionsWithMeta = missions.map((mission) => {
      const missionObj = mission.toObject()
      
      let isExpired = false
      let daysRemaining = null
      
      if (mission.isTimeLimited && mission.endDate) {
        isExpired = mission.endDate < now
        if (!isExpired) {
          const diffTime = mission.endDate.getTime() - now.getTime()
          daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        }
      }
      
      const isMaxedOut = mission.maxCompletions 
        ? mission.currentCompletions >= mission.maxCompletions
        : false

      return {
        ...missionObj,
        isExpired,
        daysRemaining,
        isMaxedOut,
      }
    })

    return NextResponse.json({
      missions: missionsWithMeta,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (error: any) {
    console.error('Error fetching missions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch missions' },
      { status: 500 }
    )
  }
}
