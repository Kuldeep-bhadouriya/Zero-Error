'use client'

import { use } from 'react'
import SeasonLeaderboard from '@/components/ze-club/SeasonLeaderboard'
import ZEClubLayout from '@/components/ze-club/ZEClubLayout'

export default function SeasonDetailPage({ params }: { params: Promise<{ seasonNumber: string }> }) {
  const { seasonNumber } = use(params)
  const num = parseInt(seasonNumber, 10)

  return (
    <ZEClubLayout>
      <SeasonLeaderboard seasonNumber={num} />
    </ZEClubLayout>
  )
}
