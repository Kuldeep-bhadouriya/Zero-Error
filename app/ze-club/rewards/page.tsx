import RewardsClient from '@/components/ze-club/rewards-page/RewardsClient';
import ZEClubLayout from '@/components/ze-club/ZEClubLayout';

// Disable caching to always show fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function RewardsPage() {
  return (
    <ZEClubLayout>
      <RewardsClient />
    </ZEClubLayout>
  );
}
