import ZEClubLayout from '@/components/ze-club/ZEClubLayout'
import MissionUploader from '@/components/ze-club/MissionUploader'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getMissionsForUserEmail } from '@/lib/ze-club/missions'
import { GlassCard } from '@/components/ui/GlassCard'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'
import MissionSubmission from '@/models/missionSubmission'
import Mission from '@/models/mission'
import { createBreadcrumbSchema, createPageMetadata, toJsonLd } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Submit Mission Proof | ZE Club',
  description:
    'Upload mission completion proof for ZE Club and keep your Zero Error Esports progress accurate and review-ready.',
  path: '/ze-club/missions/submit',
  noIndex: true,
})

const breadcrumbSchema = createBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'ZE Club', path: '/ze-club' },
  { name: 'Missions', path: '/ze-club/missions' },
  { name: 'Submit Proof', path: '/ze-club/missions/submit' },
])

export default async function MissionSubmitPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const session = await auth()

  if (!session?.user?.email) {
    return (
      <ZEClubLayout>
        <GlassCard variant="intense" className="p-10 text-center text-white">
          <h1 className="text-2xl font-semibold">Submit mission proof</h1>
          <p className="text-gray-400 mt-2">Please sign in to upload proof.</p>
          <div className="mt-6">
            <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
              <Link href="/signup">Go to sign in</Link>
            </Button>
          </div>
        </GlassCard>
      </ZEClubLayout>
    )
  }

  const allMissions = await getMissionsForUserEmail(session.user.email)
  const missions = allMissions.filter((m: any) => !m.isCompleted && !m.isPending)

  const editSubmissionIdParam = searchParams?.editSubmissionId
  const editSubmissionId = Array.isArray(editSubmissionIdParam)
    ? editSubmissionIdParam[0]
    : editSubmissionIdParam

  let editSubmission: { submissionId: string; missionId: string; missionName: string } | undefined
  if (editSubmissionId) {
    await dbConnect()
    const user = await User.findOne({ email: session.user.email }).lean() as { _id: string } | null
    if (user) {
      const pendingSubmission = await MissionSubmission.findOne({
        _id: editSubmissionId,
        user: user._id,
        status: 'pending',
      })
        .populate({ path: 'mission', model: Mission, select: 'name' })
        .lean() as any

      if (pendingSubmission?.mission?._id) {
        editSubmission = {
          submissionId: pendingSubmission._id.toString(),
          missionId: pendingSubmission.mission._id.toString(),
          missionName: pendingSubmission.mission.name,
        }
      }
    }
  }

  const missionIdParam = searchParams?.missionId
  const missionId = Array.isArray(missionIdParam) ? missionIdParam[0] : missionIdParam
  const initialMissionId = missions.some((m: any) => m._id?.toString?.() === missionId) ? missionId : undefined

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbSchema) }}
      />
      <ZEClubLayout>
        <div className="text-white space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-zinc-500 font-medium">
              <Link href="/ze-club/missions" className="hover:text-zinc-300 transition-colors">
                Missions
              </Link>
              <span className="mx-2">/</span>
              <span className="text-zinc-400">Submit proof</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold mt-2">Submit mission proof</h1>
            <p className="text-gray-400 mt-2 text-sm sm:text-base">
              {editSubmission
                ? 'Replace your proof before admin review is complete.'
                : 'Upload a clear image or video that shows the mission completion.'}
            </p>
          </div>

          <Button asChild variant="ghost" className="text-zinc-300 hover:bg-white/5">
            <Link href="/ze-club/missions">Back</Link>
          </Button>
        </div>

        <MissionUploader
          missions={missions}
          initialMissionId={initialMissionId}
          editSubmission={editSubmission}
        />
        </div>
      </ZEClubLayout>
    </>
  )
}
