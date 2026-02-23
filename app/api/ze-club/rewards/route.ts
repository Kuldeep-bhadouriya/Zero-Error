import { NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { listRewardsForUserEmail } from '@/lib/services/rewardService';
import { withErrorHandling, withRequestLogging } from '@/lib/api/middleware';

export const GET = withRequestLogging(
  '/api/ze-club/rewards',
  withErrorHandling('/api/ze-club/rewards', async () => {
    const session = await auth();
    const rewards = await listRewardsForUserEmail(session?.user?.email ?? undefined)
    return NextResponse.json(rewards)
  })
)
