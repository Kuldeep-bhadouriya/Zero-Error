'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SubmissionVerifier from '@/components/admin/SubmissionVerifier'
import HeroMediaManager from '@/components/admin/HeroMediaManager'
import EventManager from '@/components/admin/EventManager'
import AnnouncementManager from '@/components/admin/AnnouncementManager'
import MissionManager from '@/components/admin/MissionManager'
import UserRoleManager from '@/components/admin/UserRoleManager'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Zap, Video, Calendar, ListChecks, Megaphone, Target, Users, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MenuItem, MenuContainer } from '@/components/ui/fluid-menu'
import { useIsMobile } from '@/hooks/use-mobile'

export default function AdminZEClubPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('submissions')
  const isMobile = useIsMobile()

  useEffect(() => {
    // Check if user has access by trying to fetch submissions
    async function checkAccess() {
      try {
        const res = await fetch('/api/admin/submissions')
        if (res.status === 401 || res.status === 403) {
          router.push('/join-us')
        } else if (res.ok) {
          setIsAuthorized(true)
        }
      } catch (error) {
        router.push('/join-us')
      } finally {
        setIsLoading(false)
      }
    }
    checkAccess()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Zap className="h-12 w-12 text-red-500 animate-pulse" />
          <p className="text-lg text-gray-400">Loading admin panel...</p>
        </motion.div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  const navItems = [
    { id: 'submissions', label: 'Submissions', icon: ListChecks, description: 'Verify mission submissions' },
    { id: 'missions', label: 'Mission Manager', icon: Target, description: 'Create & edit missions' },
    { id: 'events', label: 'Events', icon: Calendar, description: 'Manage events' },
    { id: 'announcements', label: 'Announcements', icon: Megaphone, description: 'Post announcements' },
    { id: 'video', label: 'Background Video', icon: Video, description: 'Update hero video' },
    { id: 'users', label: 'User Roles', icon: Users, description: 'Manage admin roles' },
  ]

  function renderContent() {
    switch (activeTab) {
      case 'submissions':
        return <SubmissionVerifier />
      case 'missions':
        return <MissionManager />
      case 'events':
        return <EventManager />
      case 'announcements':
        return <AnnouncementManager />
      case 'video':
        return <HeroMediaManager />
      case 'users':
        return <UserRoleManager />
      default:
        return <SubmissionVerifier />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
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
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <MenuItem 
                  key={item.id}
                  icon={<Icon size={20} strokeWidth={1.5} className="text-white" />} 
                  onClick={() => setActiveTab(item.id)}
                  isActive={activeTab === item.id}
                />
              )
            })}
          </MenuContainer>
        </div>
      )}

      {/* Sidebar - Hidden on mobile, always visible on desktop */}
      {!isMobile && (
      <aside
        className="fixed left-0 top-20 bottom-0 w-72 bg-zinc-900/30 backdrop-blur-xl border-r border-zinc-700/30 z-50"
      >
        <div className="h-full overflow-y-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/50">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Admin Panel</h2>
                <p className="text-xs text-gray-400">ZE Club Dashboard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <motion.button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left group",
                    isActive
                      ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                      : "text-gray-400 hover:text-white hover:bg-zinc-800"
                  )}
                >
                  <Icon className={cn(
                    "h-5 w-5 mt-0.5 shrink-0",
                    isActive ? "text-white" : "text-gray-500 group-hover:text-red-500"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className={cn(
                      "font-medium text-sm mb-0.5",
                      isActive ? "text-white" : "text-gray-300 group-hover:text-white"
                    )}>
                      {item.label}
                    </div>
                    <div className={cn(
                      "text-xs",
                      isActive ? "text-red-100" : "text-gray-500 group-hover:text-gray-400"
                    )}>
                      {item.description}
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </nav>
        </div>
      </aside>
      )}

      {/* Main Content */}
      <div className={cn(
        "pt-20 pb-8",
        !isMobile && "ml-72"
      )}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 max-w-7xl">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 lg:mb-8"
          >
            {navItems.map((item) => {
              if (item.id === activeTab) {
                const Icon = item.icon
                return (
                  <div key={item.id} className="flex items-center gap-3 sm:gap-4">
                    <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/50">
                      <Icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent">
                        {item.label}
                      </h1>
                      <p className="text-gray-400 text-xs sm:text-sm">{item.description}</p>
                    </div>
                  </div>
                )
              }
              return null
            })}
          </motion.div>

          {/* Content Area */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
