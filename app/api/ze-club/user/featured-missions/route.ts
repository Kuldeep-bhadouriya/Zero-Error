import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import Mission from '@/models/mission'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session || !session.user) {
      return new NextResponse('Unauthorized', { status: 401 })
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
      .limit(6) // Return max 6 featured missions

    // Add computed fields and filter out expired/maxed missions
    const availableMissions = missions
      .map((mission) => {
        const missionObj = mission.toObject()
        
        let isExpired = false
        let daysRemaining = null
        
        // Check if mission is expired
        if (mission.isTimeLimited && mission.endDate) {
          isExpired = mission.endDate < now
          if (!isExpired) {
            const diffTime = mission.endDate.getTime() - now.getTime()
            daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          }
        }
        
        // Check if mission has reached max completions
        const isMaxedOut = mission.maxCompletions 
          ? mission.currentCompletions >= mission.maxCompletions
          : false

        return {
          ...missionObj,
          isExpired,
          daysRemaining,
          isMaxedOut,
          isAvailable: !isExpired && !isMaxedOut,
        }
      })
      .filter((mission) => !mission.isExpired && !mission.isMaxedOut)

    return NextResponse.json(availableMissions)
  } catch (error) {
    console.error('Error fetching featured missions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch featured missions' },
      { status: 500 }
    )
  }
}
