import { redirect } from "next/navigation"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import ZEClubLayout from "@/components/ze-club/ZEClubLayout"
import Dashboard from "@/components/ze-club/Dashboard"
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'ZE Club Dashboard | Zero Error Esports',
  description:
    'Access your ZE Club dashboard to track missions, standings, and rewards within the Zero Error Esports ecosystem.',
  path: '/ze-club',
  noIndex: true,
})

export default async function ZEClubPage() {
  const session = await auth()

  if (!session) {
    redirect("/join-us")
  }

  return (
    <ZEClubLayout>
      <Dashboard />
    </ZEClubLayout>
  )
}