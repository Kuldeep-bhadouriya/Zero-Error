import RewardsClient from '@/components/ze-club/rewards-page/RewardsClient';
import ZEClubLayout from '@/components/ze-club/ZEClubLayout';
import { createBreadcrumbSchema, createPageMetadata, toJsonLd } from '@/lib/seo'

// Disable caching to always show fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = createPageMetadata({
  title: 'ZE Club Rewards | Redeem Your Points',
  description:
    'Browse ZE Club rewards and redemption options tied to your Zero Error Esports mission progress and points balance.',
  path: '/ze-club/rewards',
  noIndex: true,
})

const breadcrumbSchema = createBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'ZE Club', path: '/ze-club' },
  { name: 'Rewards', path: '/ze-club/rewards' },
])

export default function RewardsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbSchema) }}
      />
      <ZEClubLayout>
        <RewardsClient />
      </ZEClubLayout>
    </>
  );
}
