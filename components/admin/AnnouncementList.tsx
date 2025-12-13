'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Pencil, RefreshCcw, Search, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnnouncementRecord {
  _id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'urgent'
  priority: number
  active: boolean
  startDate?: string
  endDate?: string
  link?: string
  linkText?: string
  targetPages: string[]
  dismissible: boolean
  createdAt: string
  updatedAt: string
}

interface AnnouncementListProps {
  onEdit: (announcement: AnnouncementRecord) => void
  refreshTrigger: number
}

const TYPE_BADGES: Record<AnnouncementRecord['type'], string> = {
  info: 'bg-blue-500/20 text-blue-200 border border-blue-500/30',
  warning: 'bg-amber-500/15 text-amber-200 border border-amber-500/30',
  success: 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30',
  urgent: 'bg-rose-500/20 text-rose-100 border border-rose-500/40',
}

const filterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

function AnnouncementList({ onEdit, refreshTrigger }: AnnouncementListProps) {
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState<AnnouncementRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [manualRefresh, setManualRefresh] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400)
    return () => clearTimeout(timeout)
  }, [searchTerm])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, activeFilter])

  useEffect(() => {
    async function fetchAnnouncements() {
      setLoading(true)
      try {
        const params = new URLSearchParams({ page: String(page), limit: '10' })
        if (debouncedSearch) {
          params.set('search', debouncedSearch)
        }
        if (activeFilter !== 'all') {
          params.set('active', activeFilter === 'active' ? 'true' : 'false')
        }

        const response = await fetch(`/api/admin/announcements/list?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to load announcements')
        }
        const data = await response.json()
        setAnnouncements(data.announcements || [])
        setTotalPages(data.pagination?.totalPages || 1)
      } catch (error: any) {
        console.error(error)
        toast({ title: 'Unable to load announcements', description: error.message || 'Please try again shortly.' })
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [page, debouncedSearch, activeFilter, refreshTrigger, manualRefresh, toast])

  async function updateAnnouncement(id: string, updates: Partial<AnnouncementRecord>) {
    try {
      const response = await fetch('/api/admin/announcements/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })

      if (!response.ok) {
        throw new Error('Update failed')
      }

      setAnnouncements((prev) => prev.map((item) => (item._id === id ? { ...item, ...updates } : item)))
      toast({ title: 'Announcement updated', description: 'Changes saved' })
    } catch (error: any) {
      console.error('Failed to update announcement', error)
      toast({ title: 'Update failed', description: error.message || 'Try again' })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this announcement?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/announcements/delete?id=${id}`, { method: 'DELETE' })
      if (!response.ok) {
        throw new Error('Delete failed')
      }

      setAnnouncements((prev) => prev.filter((item) => item._id !== id))
      toast({ title: 'Announcement removed' })
    } catch (error: any) {
      console.error('Failed to delete announcement', error)
      toast({ title: 'Delete failed', description: error.message || 'Try again' })
    }
  }

  function getRangeLabel(item: AnnouncementRecord) {
    if (!item.startDate && !item.endDate) {
      return 'Always on'
    }

    const start = item.startDate ? format(new Date(item.startDate), 'MMM d, yyyy') : 'Now'
    const end = item.endDate ? format(new Date(item.endDate), 'MMM d, yyyy') : '∞'
    return `${start} → ${end}`
  }

  const emptyState = !loading && announcements.length === 0

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 shadow-lg shadow-black/30">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2">
          <Search className="h-4 w-4 text-gray-500" />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search announcements"
            className="border-0 bg-transparent text-sm text-white placeholder:text-gray-500 focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center gap-2">
          {filterOptions.map((filter) => (
            <Button
              key={filter.value}
              variant={activeFilter === filter.value ? 'default' : 'outline'}
              onClick={() => setActiveFilter(filter.value as 'all' | 'active' | 'inactive')}
              className={cn(
                'border-zinc-700 text-sm',
                activeFilter === filter.value
                  ? 'bg-red-600 text-white'
                  : 'bg-transparent text-gray-300 hover:bg-zinc-800'
              )}
            >
              {filter.label}
            </Button>
          ))}
          <Button variant="ghost" size="icon" onClick={() => setManualRefresh((prev) => prev + 1)} className="text-gray-300 hover:text-white hover:bg-zinc-800">
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center text-gray-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading announcements...
        </div>
      ) : emptyState ? (
        <div className="min-h-[200px] rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 p-10 text-center text-gray-400">
          No announcements yet. Create one to keep your community informed.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800">
          <Table className="bg-zinc-950/40 text-gray-200">
            <TableHeader>
              <TableRow className="bg-zinc-900/80">
                <TableHead>Title</TableHead>
                <TableHead className="hidden lg:table-cell">Message</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden lg:table-cell">Target</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Window</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {announcements.map((item) => (
                <TableRow key={item._id} className="border-zinc-800">
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-semibold text-white">{item.title}</p>
                      {item.link && item.linkText && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-400 hover:underline"
                        >
                          {item.linkText}
                        </a>
                      )}
                      <p className="text-xs text-gray-500">Updated {format(new Date(item.updatedAt), 'MMM d, HH:mm')}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden max-w-xs lg:table-cell">
                    <p className="line-clamp-3 text-sm text-gray-300">{item.message}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('text-xs font-semibold', TYPE_BADGES[item.type])}>{item.type}</Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {item.targetPages?.map((page) => (
                        <Badge key={`${item._id}-${page}`} variant="outline" className="border-zinc-700 text-xs capitalize text-gray-300">
                          {page}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-zinc-800 text-xs text-gray-100">
                      {item.priority}/10
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.active}
                        onCheckedChange={(checked) => updateAnnouncement(item._id, { active: checked })}
                      />
                      <span className="text-xs text-gray-400">{item.dismissible ? 'Dismissible' : 'Sticky'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs text-gray-400">{getRangeLabel(item)}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => onEdit(item)} className="bg-zinc-800 border-zinc-700 text-gray-300 hover:text-white hover:bg-zinc-700">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(item._id)} className="bg-red-600/20 border-red-600/50 text-red-400 hover:bg-red-600/30 hover:text-red-300">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {!emptyState && !loading && (
        <div className="flex flex-col items-center gap-3 border-t border-zinc-900 pt-4 text-sm text-gray-400 sm:flex-row sm:justify-between">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="bg-zinc-800 border-zinc-700 text-gray-300 hover:text-white hover:bg-zinc-700"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              className="bg-zinc-800 border-zinc-700 text-gray-300 hover:text-white hover:bg-zinc-700"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnnouncementList
