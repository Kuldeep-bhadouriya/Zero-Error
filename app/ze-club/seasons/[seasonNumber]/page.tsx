import type { Metadata } from 'next'
import SeasonDetailPageClient from './season-detail-client'
import { createBreadcrumbSchema, createPageMetadata, toJsonLd } from '@/lib/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ seasonNumber: string }>
}): Promise<Metadata> {
  const { seasonNumber } = await params
  const parsedSeasonNumber = Number.parseInt(seasonNumber, 10)
  const validSeasonNumber = Number.isFinite(parsedSeasonNumber)
    ? parsedSeasonNumber
    : undefined

  let seasonName: string | undefined

  try {
    const [{ default: dbConnect }, { default: Season }] = await Promise.all([
      import('@/lib/mongodb'),
      import('@/models/season'),
    ])

    await dbConnect()

    const season = (await Season.findOne(
      { seasonNumber: validSeasonNumber },
      { name: 1, _id: 0 }
    ).lean()) as { name?: string } | null

    seasonName = season?.name
  } catch {
    // Fall back to parameter-derived metadata if the database is unavailable.
  }

  const seasonLabel = validSeasonNumber ?? seasonNumber
  const pageTitle = seasonName
    ? `${seasonName} | ZE Club Season ${seasonLabel}`
    : `ZE Club Season ${seasonLabel} Leaderboard | Zero Error Esports`

  const pageDescription = seasonName
    ? `${seasonName} standings, point progression, and leaderboard highlights from Zero Error Esports.`
    : `View ZE Club Season ${seasonLabel} rankings, top performers, and competition updates from Zero Error Esports in India.`

  return createPageMetadata({
    title: pageTitle,
    description: pageDescription,
    path: `/ze-club/seasons/${seasonNumber}`,
  })
}

export default async function SeasonDetailPage({
  params,
}: {
  params: Promise<{ seasonNumber: string }>
}) {
  const { seasonNumber } = await params
  const parsedSeasonNumber = Number.parseInt(seasonNumber, 10)
  const breadcrumbSchema = createBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: 'ZE Club', path: '/ze-club' },
    { name: 'Seasons', path: '/ze-club/seasons' },
    { name: `Season ${seasonNumber}`, path: `/ze-club/seasons/${seasonNumber}` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbSchema) }}
      />
      <SeasonDetailPageClient seasonNumber={parsedSeasonNumber} />
    </>
  )
}
