import ZEClubLayout from '@/components/ze-club/ZEClubLayout';
import SupportContent from '@/components/ze-club/SupportContent';
import { createBreadcrumbSchema, createPageMetadata, toJsonLd } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'ZE Club Support | Zero Error Esports Help',
  description:
    'Get ZE Club support for missions, submissions, and reward workflows inside the Zero Error Esports platform.',
  path: '/ze-club/support',
  noIndex: true,
})

const breadcrumbSchema = createBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'ZE Club', path: '/ze-club' },
  { name: 'Support', path: '/ze-club/support' },
])

export default function SupportPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbSchema) }}
      />
      <ZEClubLayout>
        <SupportContent />
      </ZEClubLayout>
    </>
  );
}
