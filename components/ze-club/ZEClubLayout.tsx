"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import dynamic from 'next/dynamic'
import { cn } from "@/lib/utils"
import { AnimatePresence } from "framer-motion"
import PageTransition from "@/components/page-transition"
import { useEffect, useMemo } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Menu, X, LayoutDashboard, Trophy, Gift, Target, HeadphonesIcon, User, Shield, CalendarClock } from "lucide-react"
import { useSession } from "next-auth/react"
import { MenuItem, MenuContainer } from "@/components/ui/fluid-menu"
import SeasonBanner from "@/components/ze-club/SeasonBanner"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import logger from '@/lib/browser-logger'
import { useZeClubStore } from '@/lib/stores/zeClubStore'
import { hyperspeedPresets } from "@/components/HyperSpeedPresets"

const Hyperspeed = dynamic(() => import('@/components/Hyperspeed'), {
  ssr: false,
})

export const ZE_CLUB_NAV_ITEMS = [
  { href: '/ze-club', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/ze-club/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/ze-club/rewards', label: 'Rewards', icon: Gift },
  { href: '/ze-club/missions', label: 'Missions', icon: Target },
  { href: '/ze-club/seasons', label: 'Seasons', icon: CalendarClock },
  { href: '/ze-club/support', label: 'Support', icon: HeadphonesIcon },
] as const

export function getZeClubNavItems() {
  return ZE_CLUB_NAV_ITEMS
}

function ZEClubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const { data: session } = useSession()
  const userPoints = useZeClubStore((state) => state.totalPoints)
  const userZeTag = useZeClubStore((state) => state.zeTag)
  const hydrateFromDashboard = useZeClubStore((state) => state.hydrateFromDashboard)
  const navItems = useMemo(() => getZeClubNavItems(), [])

  useEffect(() => {
    async function fetchUserData() {
      try {
        const response = await fetch("/api/ze-club/user/dashboard")
        if (response.ok) {
          const data = await response.json()
          hydrateFromDashboard(data)
        }
      } catch (error) {
        logger.error("Failed to fetch user data:", error)
      }
    }
    fetchUserData()
  }, [hydrateFromDashboard])

  const router = useRouter()

  const handleNavigate = (href: string) => {
    router.push(href)
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 -z-20">
        <Hyperspeed effectOptions={hyperspeedPresets.six} />
      </div>
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(239,68,68,0.18),transparent_42%),radial-gradient(circle_at_85%_85%,rgba(56,189,248,0.12),transparent_40%)]" />

      <div className="relative z-10 flex min-h-screen pt-0">
      {/* Fluid Menu for mobile */}
      {isMobile && (
        <div className="fixed left-4 bottom-4 z-50">
          <MenuContainer>
            <MenuItem 
              icon={
                <div className="relative w-5 h-5">
                  <div className="absolute inset-0 transition-all duration-300 ease-in-out origin-center opacity-100 scale-100 rotate-0 [div[data-expanded=true]_&]:opacity-0 [div[data-expanded=true]_&]:scale-0 [div[data-expanded=true]_&]:rotate-180">
                    <Menu size={20} strokeWidth={1.5} className="text-white" />
                  </div>
                  <div className="absolute inset-0 transition-all duration-300 ease-in-out origin-center opacity-0 scale-0 -rotate-180 [div[data-expanded=true]_&]:opacity-100 [div[data-expanded=true]_&]:scale-100 [div[data-expanded=true]_&]:rotate-0">
                    <X size={20} strokeWidth={1.5} className="text-white" />
                  </div>
                </div>
              } 
            />
            <MenuItem 
              icon={<LayoutDashboard size={20} strokeWidth={1.5} className="text-white" />} 
              onClick={() => handleNavigate('/ze-club')}
            />
            <MenuItem 
              icon={<User size={20} strokeWidth={1.5} className="text-white" />} 
              onClick={() => handleNavigate('/profile')}
            />
            <MenuItem 
              icon={<Trophy size={20} strokeWidth={1.5} className="text-white" />} 
              onClick={() => handleNavigate('/ze-club/leaderboard')}
            />
            <MenuItem 
              icon={<Gift size={20} strokeWidth={1.5} className="text-white" />} 
              onClick={() => handleNavigate('/ze-club/rewards')}
            />
            <MenuItem
              icon={<Target size={20} strokeWidth={1.5} className="text-white" />}
              onClick={() => handleNavigate('/ze-club/missions')}
            />
            <MenuItem
              icon={<CalendarClock size={20} strokeWidth={1.5} className="text-white" />}
              onClick={() => handleNavigate('/ze-club/seasons')}
            />
            <MenuItem
              icon={<HeadphonesIcon size={20} strokeWidth={1.5} className="text-white" />}
              onClick={() => handleNavigate('/ze-club/support')}
            />
            {/* Admin Panel - Only visible to admins */}
            {session?.user?.roles?.includes('admin') && (
              <MenuItem 
                icon={<Shield size={20} strokeWidth={1.5} className="text-white" />} 
                onClick={() => handleNavigate('/admin/ze-club')}
                className="admin-button"
              />
            )}
          </MenuContainer>
        </div>
      )}

      {/* Sidebar - Hidden on mobile, always visible on desktop */}
      {!isMobile && (
      <aside
        className={cn(
          "fixed left-0 top-20 h-[calc(100vh-5rem)] w-72 bg-black/20 backdrop-blur-2xl border-r border-white/15 overflow-hidden z-40 flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-all duration-300"
        )}
      >
        {/* Scrollable container */}
        <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden px-4 py-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          
          {/* Header */}
          <div className="mb-8 px-2">
            <div className="flex items-center gap-3 mb-1">
              {/* Sparkle removed as per request */}
              <h2 className="text-xl font-bold text-white tracking-wide pl-1">
                ZE Club
              </h2>
            </div>
            <p className="text-xs font-medium text-white/40 pl-1 tracking-wider uppercase">
              Elite Gaming Area
            </p>
          </div>

          {/* User Profile Snippet */}
          {session?.user && (
            <div className="mb-8 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative p-4 rounded-xl border border-white/15 bg-white/[0.08] backdrop-blur-md group-hover:border-white/30 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 flex items-center justify-center shadow-inner">
                    <User className="h-5 w-5 text-zinc-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      @{userZeTag || session.user.zeTag || 'Gamer'}
                    </p>
                    <p className="text-[10px] text-zinc-500 truncate uppercase tracking-wider font-medium">
                      Member
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/15">
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">ZE Points</span>
                  <span className="text-sm font-bold text-red-500 tabular-nums">
                    {userPoints.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1">
            <p className="px-2 mb-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
              Menu
            </p>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 border border-transparent",
                        isActive
                          ? "bg-white/[0.14] text-white border-white/25 shadow-sm"
                          : "text-zinc-300 hover:text-white hover:bg-white/[0.08]"
                      )}
                    >
                      <Icon 
                        size={18} 
                        strokeWidth={isActive ? 2 : 1.5}
                        className={cn(
                          "transition-colors",
                          isActive ? "text-red-500" : "text-zinc-500 group-hover:text-white"
                        )} 
                      />
                      <span className={cn(
                        "text-sm font-medium transition-colors",
                        isActive ? "text-white" : "text-zinc-400 group-hover:text-white"
                      )}>
                        {item.label}
                      </span>
                      
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

        </div>

        {/* Admin Portal Button - Fixed at bottom */}
        {session?.user?.roles?.includes('admin') && (
          <div className="p-4 border-t border-white/15 bg-black/25 backdrop-blur-md">
            <Link
              href="/admin/ze-club"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-white/[0.12] border border-white/20 text-zinc-200 hover:text-white hover:border-white/40 transition-all text-xs font-medium group"
            >
              <Shield className="h-3.5 w-3.5 group-hover:text-purple-400 transition-colors" />
              <span>Admin Portal</span>
            </Link>
          </div>
        )}
      </aside>
      )}

      {/* Main content */}
      <main className={cn(
        "flex-1 relative z-10 transition-all duration-300 min-h-screen overflow-x-hidden",
        !isMobile && "ml-72",
        "p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20 lg:pt-24"
      )}>
        <ErrorBoundary
          fallback={
            <div className="p-6 bg-red-900/20 border border-red-700 rounded-lg">
              <h2 className="text-xl font-bold text-red-500 mb-2">ZE Club feature error</h2>
              <p className="text-zinc-300">Try refreshing the page to continue.</p>
            </div>
          }
        >
          <div className="mb-4">
            <SeasonBanner />
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={pathname}>{children}</PageTransition>
          </AnimatePresence>
        </ErrorBoundary>
      </main>
      </div>
    </div>
  )
}

export default ZEClubLayout