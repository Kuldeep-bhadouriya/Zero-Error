import SeasonHistory from '@/components/ze-club/SeasonHistory'
import ZEClubLayout from '@/components/ze-club/ZEClubLayout'
import ZEClubPageHeader from '@/components/ze-club/ZEClubPageHeader'
import { createBreadcrumbSchema, createPageMetadata, toJsonLd } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'ZE Club Season History | Zero Error Esports',
  description:
    'Explore ZE Club season history, champions, and performance highlights from Zero Error Esports competitions in India.',
  path: '/ze-club/seasons',
})

const breadcrumbSchema = createBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'ZE Club', path: '/ze-club' },
  { name: 'Seasons', path: '/ze-club/seasons' },
])

export default function SeasonsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbSchema) }}
      />
      <ZEClubLayout>
        <div className="text-white min-h-screen pb-24 w-full max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <ZEClubPageHeader
            align="center"
            eyebrow="ZE Club Seasons"
            title="Season"
            highlight="History"
            subtitle="Browse past seasons, view champions, and relive the competition."
          />
          <SeasonHistory />
        </div>
      </ZEClubLayout>
    </>
  )
}
