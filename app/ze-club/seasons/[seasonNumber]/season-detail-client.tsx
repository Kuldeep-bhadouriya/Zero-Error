'use client'

import SeasonLeaderboard from '@/components/ze-club/SeasonLeaderboard'
import ZEClubLayout from '@/components/ze-club/ZEClubLayout'

export default function SeasonDetailPage({ seasonNumber }: { seasonNumber: number }) {
  return (
    <ZEClubLayout>
      <SeasonLeaderboard seasonNumber={seasonNumber} />
    </ZEClubLayout>
  )
}
