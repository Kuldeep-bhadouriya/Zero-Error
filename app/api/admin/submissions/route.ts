
import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import MissionSubmission from '@/models/missionSubmission'
import dbConnect from '@/lib/mongodb'

export async function GET(req: Request) {
  const session = await auth()

  if (!session || !session.user.roles.includes('admin')) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  await dbConnect()

  try {
    const submissions = await MissionSubmission.find({ status: 'pending' })
      .populate('user', 'name email')
      .populate('mission', 'name points')
    return NextResponse.json(submissions)
  } catch (error) {
    console.error('Error fetching pending submissions:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
