'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Edit, Trash2, Loader2, Star, Search } from 'lucide-react'
import { format } from 'date-fns'

interface Event {
  _id: string
  title: string
  description: string
  eventDate: string
  eventType: 'upcoming' | 'past'
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

import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface EventListProps {
  onEdit: (event: Event) => void
  refreshTrigger?: number
}

export function EventList({ onEdit, refreshTrigger }: EventListProps) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  // Filters
  const [search, setSearch] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchEvents()
  }, [page, search, eventTypeFilter, statusFilter, refreshTrigger])

  async function fetchEvents() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      })

      if (search) params.append('search', search)
      if (eventTypeFilter !== 'all') params.append('eventType', eventTypeFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/admin/events/list?${params}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })
      const result = await response.json()

      if (response.ok) {
        setEvents(result.events)
        setTotalPages(result.pagination.totalPages)
      } else {
        console.error('Failed to fetch events:', result.error)
      }
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/events/delete?eventId=${deleteId}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (response.ok) {
        alert(result.message)
        setDeleteId(null)
        fetchEvents()
      } else {
        alert(result.error || 'Failed to delete event')
      }
    } catch (error: any) {
      console.error('Error deleting event:', error)
      alert(error.message || 'Failed to delete event')
    } finally {
      setDeleting(false)
    }
  }

  async function toggleFeatured(eventId: string, currentFeatured: boolean) {
    try {
      const response = await fetch('/api/admin/events/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          featured: !currentFeatured,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        fetchEvents()
      } else {
        alert(result.error || 'Failed to update event')
      }
    } catch (error: any) {
      console.error('Error updating event:', error)
      alert(error.message || 'Failed to update event')
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      draft: 'secondary',
      published: 'default',
      cancelled: 'destructive',
    }
    return <Badge variant={variants[status]}>{status}</Badge>
  }

  function getTypeBadge(type: string) {
    return (
      <Badge variant={type === 'upcoming' ? 'default' : 'outline'}>
        {type}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-8 bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
            />
          </div>
        </div>

        <Select
          value={eventTypeFilter}
          onValueChange={(value) => {
            setEventTypeFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-[150px] bg-zinc-900 border-zinc-700 text-white focus:ring-red-500 focus:ring-offset-0">
            <SelectValue placeholder="Event Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-[150px] bg-zinc-900 border-zinc-700 text-white focus:ring-red-500 focus:ring-offset-0">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No events found
        </div>
      ) : (
        <>
          <div className="border border-zinc-700 rounded-lg bg-zinc-900/50 overflow-x-auto -mx-3 sm:mx-0">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow className="border-zinc-700 hover:bg-zinc-800/50">
                  <TableHead className="text-gray-300 min-w-[200px]">Title</TableHead>
                  <TableHead className="text-gray-300 min-w-[120px]">Date</TableHead>
                  <TableHead className="text-gray-300 min-w-[100px]">Type</TableHead>
                  <TableHead className="text-gray-300 min-w-[100px]">Status</TableHead>
                  <TableHead className="text-gray-300 min-w-[80px]">Featured</TableHead>
                  <TableHead className="text-gray-300 min-w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event._id} className="border-zinc-700 hover:bg-zinc-800/30">
                    <TableCell>
                      <div>
                        <div className="font-medium text-white">{event.title}</div>
                        <div className="text-sm text-gray-400">
                          {event.location || 'No location'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {format(new Date(event.eventDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{getTypeBadge(event.eventType)}</TableCell>
                    <TableCell>{getStatusBadge(event.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFeatured(event._id, event.featured)}
                        className="hover:bg-zinc-700 text-gray-400"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            event.featured
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-400 hover:text-yellow-400'
                          }`}
                        />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onEdit(event)}
                          className="bg-zinc-800 border-zinc-700 text-gray-300 hover:text-white hover:bg-zinc-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => setDeleteId(event._id)}
                          className="bg-red-600/20 border-red-600/50 text-red-400 hover:bg-red-600/30 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                Previous
              </Button>
              <span className="py-2 px-4 text-gray-300">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the event
              and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}


