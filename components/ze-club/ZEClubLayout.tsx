"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { AnimatePresence, motion } from "framer-motion"
import PageTransition from "@/components/page-transition"
import { useState, useEffect } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Menu, X, LayoutDashboard, Trophy, Gift, Target, HeadphonesIcon, User, Sparkles, Shield, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { GlassCard } from "@/components/ui/GlassCard"
import { RadialNavigationMenu } from "@/components/ze-club/RadialNavigationMenu"
import { RadialMenuItem } from "@/types/radial-menu"

function ZEClubLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = useSession()
  const [userPoints, setUserPoints] = useState(0)
  const [userZeTag, setUserZeTag] = useState<string | undefined>()

  useEffect(() => {
    async function fetchUserData() {
      try {
        const response = await fetch("/api/ze-club/user/dashboard")
        if (response.ok) {
          const data = await response.json()
          setUserPoints(data.totalPoints || 0)
          setUserZeTag(data.zeTag)
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error)
      }
    }
    fetchUserData()
  }, [])

  const navItems = [
    { href: "/ze-club", label: "Dashboard", icon: LayoutDashboard },
    { href: "/profile", label: "Profile", icon: User },
    { href: "/ze-club/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/ze-club/rewards", label: "Rewards", icon: Gift },
    { href: "/ze-club/missions", label: "Missions", icon: Target },
    { href: "/ze-club/support", label: "Support", icon: HeadphonesIcon },
  ]

  const handleLinkClick = () => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const router = useRouter()

  const handleNavigate = (href: string) => {
    router.push(href)
  }

  // Prepare radial menu items for mobile
  const radialMenuItems: RadialMenuItem[] = [
    { id: "dashboard", icon: LayoutDashboard, label: "Dashboard", onClick: () => handleNavigate('/ze-club') },
    { id: "profile", icon: User, label: "Profile", onClick: () => handleNavigate('/profile') },
    { id: "leaderboard", icon: Trophy, label: "Leaderboard", onClick: () => handleNavigate('/ze-club/leaderboard') },
    { id: "rewards", icon: Gift, label: "Rewards", onClick: () => handleNavigate('/ze-club/rewards') },
    { id: "missions", icon: Target, label: "Missions", onClick: () => handleNavigate('/ze-club/missions') },
  ]

  // Add admin menu item if user is admin
  if (session?.user?.roles?.includes('admin')) {
    radialMenuItems.push({
      id: "admin",
      icon: Shield,
      label: "Admin Portal",
      onClick: () => handleNavigate('/admin/ze-club'),
      variant: "admin"
    })
  }

  return (
    <div className="relative flex min-h-screen z-10">
      {/* Radial Navigation Menu for mobile */}
      {isMobile && (
        <RadialNavigationMenu items={radialMenuItems} position="left" />
      )}

      {/* Sidebar - Hidden on mobile, always visible on desktop */}
      {!isMobile && (
      <aside
        className={cn(
          "fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-[85vw] sm:w-80 md:w-72 lg:w-64 backdrop-blur-xl text-white p-4 sm:p-5 md:p-6 border-r border-red-500/30 overflow-hidden z-40 transition-all duration-300 flex flex-col shadow-2xl"
        )}
      >
        {/* Scrollable container */}
        <div className="overflow-y-auto flex-1 pr-2 scrollbar-thin scrollbar-thumb-red-500/50 scrollbar-track-transparent hover:scrollbar-thumb-red-500/70">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="bg-gradient-to-br from-red-500 to-red-700 p-2 sm:p-2.5 rounded-lg shadow-lg shadow-red-500/50">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-red-500 via-red-400 to-orange-500 bg-clip-text text-transparent">
              ZE Club
            </h2>
          </div>
          <p className="text-xs text-gray-400 ml-12 sm:ml-14">Your Gaming Hub</p>
        </div>

        {/* User Profile Card */}
        {session?.user && (
          <GlassCard variant="intense" gradient="red" hover className="mb-5 sm:mb-6 p-3.5 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
            <div className="mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-semibold text-white truncate leading-tight">@{userZeTag || session.user.zeTag || 'Set username'}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 truncate mt-0.5">{session.user.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-gray-700/50">
              <span className="text-xs text-gray-400">Total Points</span>
              <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                {userPoints}
              </span>
            </div>
            </motion.div>
          </GlassCard>
        )}

        {/* Navigation */}
        <nav>
          <ul className="space-y-2">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <motion.li 
                  key={item.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Link
                    href={item.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "group flex items-center gap-2.5 sm:gap-3 py-3 sm:py-3.5 px-3.5 sm:px-4 rounded-xl transition-all duration-200 relative overflow-hidden touch-manipulation active:scale-95",
                      isActive
                        ? "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/50"
                        : "hover:bg-black/60 hover:text-red-400 text-gray-300"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeNav"
                        className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 rounded-xl"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon className={cn(
                      "h-5 w-5 relative z-10 transition-transform duration-200",
                      isActive ? "text-white" : "text-gray-400 group-hover:text-red-400 group-hover:scale-110"
                    )} />
                    <span className="relative z-10 font-medium">{item.label}</span>
                    {isActive && (
                      <motion.div
                        className="ml-auto relative z-10"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </motion.div>
                    )}
                  </Link>
                </motion.li>
              )
            })}
          </ul>
        </nav>

        {/* Admin Portal Button - Only visible to admins */}
        {session?.user?.roles?.includes('admin') && (
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link
              href="/admin/ze-club"
              onClick={handleLinkClick}
              className="group flex items-center gap-3 py-3 px-4 rounded-xl transition-all duration-200 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/50 hover:shadow-purple-600/60"
            >
              <Shield className="h-5 w-5 relative z-10" />
              <span className="relative z-10 font-medium">Admin Portal</span>
              <motion.div
                className="ml-auto"
                whileHover={{ scale: 1.2 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <div className="w-2 h-2 bg-white rounded-full" />
              </motion.div>
            </Link>
          </motion.div>
        )}

        {/* Footer Info */}
        <div className="mt-auto pt-6 border-t border-gray-800/50">
          <div className="text-xs text-gray-500 space-y-1">
            <p>💡 Complete missions to earn points</p>
            <p>🏆 Climb the leaderboard</p>
            <p>🎁 Redeem exclusive rewards</p>
          </div>
        </div>
        </div>
      </aside>
      )}

      {/* Main content */}
      <main className={cn(
        "flex-1 relative z-10 transition-all duration-300 min-h-screen overflow-y-auto",
        !isMobile && "ml-72",
        "p-3 sm:p-4 md:p-6 lg:p-8 pt-16 sm:pt-4"
      )}>
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={pathname}>{children}</PageTransition>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default ZEClubLayout