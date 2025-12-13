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

export default function AdminZEClubPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('submissions')
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-24 left-4 z-50 p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white hover:bg-zinc-800 transition-colors"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 z-40 pt-20"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: sidebarOpen ? 0 : 0 }}
        className={cn(
          "fixed left-0 top-20 bottom-0 w-72 bg-zinc-900/30 backdrop-blur-xl border-r border-zinc-700/30 z-40 transition-transform lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
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
                  onClick={() => {
                    setActiveTab(item.id)
                    setSidebarOpen(false)
                  }}
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
      </motion.aside>

      {/* Main Content */}
      <div className="lg:ml-72 pt-20">
        <div className="container mx-auto px-4 sm:px-6 py-8 max-w-7xl">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            {navItems.map((item) => {
              if (item.id === activeTab) {
                const Icon = item.icon
                return (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/50">
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent">
                        {item.label}
                      </h1>
                      <p className="text-gray-400 text-sm">{item.description}</p>
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
