import { redirect } from "next/navigation"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import ZEClubLayout from "@/components/ze-club/ZEClubLayout"
import Dashboard from "@/components/ze-club/Dashboard"

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