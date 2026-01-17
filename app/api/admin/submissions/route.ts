
import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import MissionSubmission from '@/models/missionSubmission'
import Mission from '@/models/mission'
import User from '@/models/user'
import dbConnect from '@/lib/mongodb'

export async function GET(req: Request) {
  const session = await auth()

  if (!session || !session.user.roles.includes('admin')) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  await dbConnect()

  try {
    // Parse URL to get query params
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    
    // Ensure models are registered by referencing them
    const _ = Mission.modelName
    const __ = User.modelName
    
    // Build query based on status filter
    const query = status && status !== 'all' ? { status } : {}
    
    const submissions = await MissionSubmission.find(query)
      .populate('user', 'zeTag email')
      .populate('mission', 'name points')
      .populate('approvedBy', 'zeTag email')
      .populate('revertedBy', 'zeTag email')
      .sort({ submittedAt: -1 })
      
    return NextResponse.json(submissions)
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
