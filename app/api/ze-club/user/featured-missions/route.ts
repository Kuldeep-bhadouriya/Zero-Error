import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { errorResponse } from '@/lib/api-response'
import dbConnect from '@/lib/mongodb'
import Mission from '@/models/mission'
import logger from '@/lib/logger'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return errorResponse('Unauthorized', 401)
    }

    await dbConnect()
    
    const now = new Date()
    
    // Build filter for active, featured, non-expired missions
    const filter: any = {
      active: true,
      featured: true,
    }
    
    // Filter out missions that haven't started yet
    filter.$or = [
      { startDate: { $exists: false } },
      { startDate: null },
      { startDate: { $lte: now } },
    ]

    const missions = await Mission.find(filter)
      .select('name description points category difficulty isTimeLimited endDate maxCompletions currentCompletions')
      .sort({ createdAt: -1 })
      .limit(6)
      .lean() // Convert to plain objects

    // Add computed fields and filter out expired/maxed missions
    const availableMissions = missions
      .map((mission: any) => {
        let isExpired = false
        let daysRemaining = null
        
        // Check if mission is expired
        if (mission.isTimeLimited && mission.endDate) {
          const endDate = new Date(mission.endDate)
          isExpired = endDate < now
          if (!isExpired) {
            const diffTime = endDate.getTime() - now.getTime()
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          }
        }
        
        // Check if mission has reached max completions
        const isMaxedOut = mission.maxCompletions 
          ? mission.currentCompletions >= mission.maxCompletions
          : false

        return {
          ...mission,
          _id: mission._id.toString(),
          endDate: mission.endDate ? new Date(mission.endDate).toISOString() : undefined,
          isExpired,
          daysRemaining,
          isMaxedOut,
          isAvailable: !isExpired && !isMaxedOut,
        }
      })
      .filter((mission) => !mission.isExpired && !mission.isMaxedOut)

    return NextResponse.json(availableMissions)
  } catch (error) {
    logger.error('Error fetching featured missions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch featured missions' },
      { status: 500 }
    )
  }
}
