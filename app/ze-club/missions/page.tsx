import CurrentMissions from '@/components/ze-club/CurrentMissions'
import { Suspense } from 'react'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'
import MissionSubmission from '@/models/missionSubmission'
import Mission from '@/models/mission'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/badge'
import ZEClubLayout from '@/components/ze-club/ZEClubLayout'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getMissionsForUserEmail } from '@/lib/ze-club/missions'
import { createBreadcrumbSchema, createPageMetadata, toJsonLd } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'ZE Club Missions | Earn Points in Zero Error Esports',
  description:
    'Browse ZE Club missions, submit completion proof, and progress through India-first esports challenges on Zero Error Esports.',
  path: '/ze-club/missions',
  noIndex: true,
})

const breadcrumbSchema = createBreadcrumbSchema([
  { name: 'Home', path: '/' },
  { name: 'ZE Club', path: '/ze-club' },
  { name: 'Missions', path: '/ze-club/missions' },
])

interface PopulatedSubmission {
  _id: string
  mission: {
    _id: string
    name: string
  }
  proof: string
  status: string
  submittedAt: Date
  remarks?: string
}

async function UserSubmissions() {
  const session = await auth()
  if (!session?.user?.email) {
    return <p className="text-gray-400">Please log in to see your submissions.</p>
  }

  await dbConnect()
  const user = await User.findOne({ email: session.user.email }).lean() as any
  if (!user) {
    return <p className="text-gray-400">User not found.</p>
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const submissions = await MissionSubmission.find({
    user: user._id,
    $or: [
      { status: 'pending' },
      { submittedAt: { $gte: sevenDaysAgo } },
    ],
  })
    .populate({ path: 'mission', model: Mission, select: 'name' })
    .sort({ submittedAt: -1 })
    .lean()

  const serializedSubmissions: PopulatedSubmission[] = submissions.map((sub: any) => ({
    _id: sub._id.toString(),
    mission: {
      _id: sub.mission._id.toString(),
      name: sub.mission.name,
    },
    proof: sub.proof,
    status: sub.status,
    submittedAt: new Date(sub.submittedAt),
    remarks: sub.remarks,
  }))

  if (serializedSubmissions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 mb-4" />
        <p className="text-gray-300 text-lg font-semibold">No submissions yet</p>
        <p className="text-gray-500 text-sm mt-2">Submit proof from any mission to get started.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {serializedSubmissions.map((submission) => (
        <GlassCard key={submission._id} variant="intense" hover className="text-white p-4 sm:p-5 md:p-6">
          <div className="mb-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-white text-lg font-bold mb-1">{submission.mission.name}</h3>
                <p className="text-gray-400 text-sm">
                  Submitted on {new Date(submission.submittedAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <Badge
                variant={
                  submission.status === 'approved'
                    ? 'default'
                    : submission.status === 'rejected'
                    ? 'destructive'
                    : 'secondary'
                }
                className={
                  submission.status === 'approved'
                    ? 'bg-green-600/20 text-green-400 border-green-500/50'
                    : submission.status === 'rejected'
                    ? 'bg-red-600/20 text-red-400 border-red-500/50'
                    : 'bg-yellow-600/20 text-yellow-400 border-yellow-500/50'
                }
              >
                {submission.status}
              </Badge>
            </div>
          </div>
          <div>
            <a
              href={submission.proof}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline transition-colors"
            >
              <span>View Submission</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            {submission.status === 'pending' && (
              <div className="mt-3">
                <Button asChild size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                  <Link href={`/ze-club/missions/submit?editSubmissionId=${submission._id}`}>
                    Edit Submission
                  </Link>
                </Button>
              </div>
            )}
            {submission.remarks && (
              <div className="mt-4 p-3 rounded-lg bg-black/40 border border-white/10">
                <p className="text-sm text-gray-300">
                  <span className="font-semibold text-gray-200">Admin Remarks:</span> {submission.remarks}
                </p>
              </div>
            )}
          </div>
        </GlassCard>
      ))}
    </div>
  )
}

export default function MissionsPage() {
  // Server fetch missions once; client components reuse this data.
  // This avoids duplicate fetches and gives a faster first render.
  const missionsPromise = (async () => {
    const session = await auth()
    return getMissionsForUserEmail(session?.user?.email)
  })()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(breadcrumbSchema) }}
      />
      <ZEClubLayout>
        <div className="text-white space-y-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent">
              Missions
            </h1>
            <p className="text-gray-400 mt-2 text-sm sm:text-base">
              Complete missions to earn ZE Points and unlock rewards.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
              <Link href="/ze-club/missions/submit">Submit Proof</Link>
            </Button>
          </div>
        </div>

        {/* Summary strip */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <GlassCard key={i} className="p-4 h-[92px]" variant="subtle" />
              ))}
            </div>
          }
        >
          <MissionsSummary missionsPromise={missionsPromise} />
        </Suspense>

        {/* Missions */}
        <Suspense
          fallback={
            <div className="space-y-4">
              <div className="h-6 w-40 bg-white/5 rounded" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <GlassCard key={i} className="p-6 h-56" variant="intense" />
                ))}
              </div>
            </div>
          }
        >
          <MissionsSection missionsPromise={missionsPromise} />
        </Suspense>

        <div className="border-t border-white/10" />

        {/* Submissions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white">My Submissions</h2>
              <p className="text-gray-500 text-sm mt-1">
                Track review status and admin feedback.
              </p>
            </div>
          </div>
          <Suspense fallback={<div className="text-gray-400">Loading submissions…</div>}>
            <UserSubmissions />
          </Suspense>
        </div>
        </div>
      </ZEClubLayout>
    </>
  )
}

async function MissionsSummary({
  missionsPromise,
}: {
  missionsPromise: Promise<any[]>
}) {
  const missions = await missionsPromise
  const availableCount = missions.filter((m) => m.isAvailable).length
  const completedCount = missions.filter((m) => m.isCompleted).length
  const pendingCount = missions.filter((m) => m.isPending).length

  const items = [
    { label: 'Available', value: availableCount, accent: 'text-emerald-400' },
    { label: 'Completed', value: completedCount, accent: 'text-blue-400' },
    { label: 'Pending', value: pendingCount, accent: 'text-amber-400' },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {items.map((item) => (
        <GlassCard key={item.label} variant="subtle" className="p-3 sm:p-4">
          <div className="text-[10px] sm:text-xs uppercase tracking-widest text-zinc-500 font-medium">
            {item.label}
          </div>
          <div className={`mt-1 sm:mt-2 text-xl sm:text-2xl font-bold tabular-nums ${item.accent}`}>
            {item.value}
          </div>
          <div className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs text-zinc-500">This week</div>
        </GlassCard>
      ))}
    </div>
  )
}

async function MissionsSection({
  missionsPromise,
}: {
  missionsPromise: Promise<any[]>
}) {
  const missions = await missionsPromise
  return <CurrentMissions missions={missions} />
}
