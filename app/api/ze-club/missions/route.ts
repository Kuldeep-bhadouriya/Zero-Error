import { NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import { getMissionsForUserEmail } from '@/lib/ze-club/missions'

export async function GET() {
  try {
    const session = await auth()
    const missions = await getMissionsForUserEmail(session?.user?.email)
    return NextResponse.json(missions)
  } catch (error) {
    console.error('Error fetching missions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch missions' },
      { status: 500 }
    )
  }
}

