import dynamic from 'next/dynamic';
import ZEClubLayout from '@/components/ze-club/ZEClubLayout';

const Leaderboard = dynamic(() => import('@/components/ze-club/Leaderboard'));

export default function LeaderboardPage() {
  return (
    <ZEClubLayout>
      <Leaderboard />
    </ZEClubLayout>
  );
}
