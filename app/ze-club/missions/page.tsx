import MissionUploader from '@/components/ze-club/MissionUploader'
import { Suspense } from 'react'
import { auth } from '@/app/api/auth/[...nextauth]/route'
import dbConnect from '@/lib/mongodb'
import User from '@/models/user'
import MissionSubmission from '@/models/missionSubmission'
import Mission from '@/models/mission'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/badge'
import ZEClubLayout from '@/components/ze-club/ZEClubLayout'

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
  const user = await User.findOne({ email: session.user.email })
  if (!user) {
    return <p className="text-gray-400">User not found.</p>
  }

  const submissions: PopulatedSubmission[] = await MissionSubmission.find({
    user: user._id,
  })
    .populate({ path: 'mission', model: Mission, select: 'name' })
    .sort({ submittedAt: -1 })

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black/60 mb-4">
          <span className="text-3xl">📋</span>
        </div>
        <p className="text-gray-400 text-lg">You have no submissions yet.</p>
        <p className="text-gray-500 text-sm mt-2">Complete missions above to get started!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {submissions.map((submission) => (
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
  return (
    <ZEClubLayout>
      <div className="text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent">
          🎯 Missions
        </h1>
        <p className="text-gray-400 text-lg mb-8">Complete missions to earn points and rewards</p>
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-white">Upload Mission Proof</h2>
          <Suspense fallback={<div className="text-gray-400">Loading uploader...</div>}>
            <MissionUploader />
          </Suspense>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-4 text-white">My Submissions</h2>
          <Suspense fallback={<div className="text-gray-400">Loading submissions...</div>}>
            <UserSubmissions />
          </Suspense>
        </div>
      </div>
    </ZEClubLayout>
  )
}
