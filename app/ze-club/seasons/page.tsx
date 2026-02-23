import SeasonHistory from '@/components/ze-club/SeasonHistory'
import ZEClubLayout from '@/components/ze-club/ZEClubLayout'

export default function SeasonsPage() {
  return (
    <ZEClubLayout>
      <div className="text-white min-h-screen pb-24 w-full max-w-7xl mx-auto px-4 sm:px-6">
        <div className="pt-0 pb-8 text-center space-y-4 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-32 bg-red-600/20 blur-[100px] pointer-events-none" />
          <div className="relative z-10">
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tight text-white uppercase">
              Season <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">History</span>
            </h1>
            <p className="text-gray-400 max-w-lg mx-auto text-sm md:text-base mt-4 font-medium leading-relaxed">
              Browse past seasons, view champions, and relive the competition.
            </p>
          </div>
        </div>
        <SeasonHistory />
      </div>
    </ZEClubLayout>
  )
}
