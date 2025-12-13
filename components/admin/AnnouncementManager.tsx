'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Megaphone, PlusCircle } from 'lucide-react'
import AnnouncementForm from './AnnouncementForm'
import AnnouncementList from './AnnouncementList'

function AnnouncementManager() {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  function handleCreate() {
    setSelectedAnnouncement(null)
    setShowForm(true)
  }

  function handleEdit(announcement: any) {
    setSelectedAnnouncement(announcement)
    setShowForm(true)
  }

  function handleSuccess() {
    setShowForm(false)
    setSelectedAnnouncement(null)
    setRefreshKey((prev) => prev + 1)
  }

  function handleCancel() {
    setShowForm(false)
    setSelectedAnnouncement(null)
  }

  return (
    <div className="space-y-6">
      {showForm ? (
        <AnnouncementForm announcement={selectedAnnouncement} onSuccess={handleSuccess} onCancel={handleCancel} />
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-xl sm:rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-5 shadow-xl shadow-black/30 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="flex items-center gap-2 text-xs sm:text-sm font-semibold uppercase tracking-wide text-gray-400">
                <Megaphone className="h-3 w-3 sm:h-4 sm:w-4 text-red-400" /> Announcement control
              </p>
              <h2 className="mt-2 text-xl sm:text-2xl font-bold text-white">Keep the community in the loop</h2>
              <p className="text-xs sm:text-sm text-gray-400">
                Create time-sensitive callouts for the marketing site and ZE Club dashboard.
              </p>
            </div>
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/40"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              New announcement
            </Button>
          </div>

          <AnnouncementList onEdit={handleEdit} refreshTrigger={refreshKey} />
        </>
      )}
    </div>
  )
}

export default AnnouncementManager
