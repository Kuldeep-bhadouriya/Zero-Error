import dynamic from 'next/dynamic';
import ZEClubLayout from '@/components/ze-club/ZEClubLayout';
import { createBreadcrumbSchema, createPageMetadata, toJsonLd } from '@/lib/seo'

const Leaderboard = dynamic(() => import('@/components/ze-club/Leaderboard'));

export const metadata = createPageMetadata({
  title: 'ZE Club Leaderboard | Zero Error Esports Rankings',
  description:
    'See live ZE Club leaderboard rankings, top scorers, and competitive momentum across the Zero Error Esports community.',
  path: '/ze-club/leaderboard',
})

const breadcrumbSchema = createBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'ZE Club', path: '/ze-club' },
  { name: 'Leaderboard', path: '/ze-club/leaderboard' },
])

export default function LeaderboardPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbSchema) }}
      />
      <ZEClubLayout>
        <Leaderboard />
      </ZEClubLayout>
    </>
  );
}
