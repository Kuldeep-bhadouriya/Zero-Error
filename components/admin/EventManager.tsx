'use client'

import { useState } from 'react'
import EventForm from './EventForm'
import { EventList } from './EventList'
import { Button } from '@/components/ui/button'
import { PlusCircle } from 'lucide-react'

interface Event {
  _id: string
  title: string
  description: string
  eventDate: string
  eventType: 'upcoming' | 'past' | 'current'
  imageUrl?: string
  location?: string
  registrationLink?: string
  featured: boolean
  games: string[]
  organizer: string
  maxParticipants?: number
  currentParticipants: number
  status: 'draft' | 'published' | 'cancelled'
  createdAt: string
  updatedAt: string
}

function EventManager() {
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  function handleEdit(event: Event) {
    setEditingEvent(event)
    setIsFormOpen(true)
  }

  function handleCancel() {
    setEditingEvent(null)
    setIsFormOpen(false)
  }

  function handleSuccess() {
    setEditingEvent(null)
    setIsFormOpen(false)
    setRefreshTrigger((prev) => prev + 1)
  }

  function handleCreateNew() {
    setEditingEvent(null)
    setIsFormOpen(true)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {isFormOpen ? (
        <EventForm
          event={editingEvent}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Manage Events</h2>
            <Button
              onClick={handleCreateNew}
              className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-red-700 text-white border border-red-500/30 shadow-lg shadow-red-500/30 hover:from-red-500 hover:to-red-600"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Create New Event</span>
              <span className="sm:hidden">New Event</span>
            </Button>
          </div>
          <EventList onEdit={handleEdit} refreshTrigger={refreshTrigger} />
        </>
      )}
    </div>
  )
}

export default EventManager
