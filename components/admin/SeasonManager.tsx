'use client'

import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import {
  Calendar,
  Clock,
  Play,
  Square,
  Timer,
  Plus,
  History,
  Trash2,
  AlertTriangle,
  Loader2,
  CalendarClock,
  Users,
  Trophy,
} from 'lucide-react'
import logger from '@/lib/browser-logger'

interface Season {
  _id: string
  seasonNumber: number
  name: string
  description?: string
  status: 'upcoming' | 'active' | 'completed'
  hideFromHistory?: boolean
  startDate: string
  scheduledEndDate: string
  actualEndDate?: string
  totalParticipants?: number
  daysRemaining?: number
  hoursRemaining?: number
  isExpired?: boolean
}

interface EndSummary {
  pendingSubmissions: number
  pendingRedemptions: number
  seasonName: string
  seasonNumber: number
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(startStr: string, endStr: string) {
  const start = new Date(startStr)
  const end = new Date(endStr)
  const diffMs = end.getTime() - start.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  return `${hours} hour${hours !== 1 ? 's' : ''}`
}

export default function SeasonManager() {
  const [activeTab, setActiveTab] = useState('current')
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null)
  const [allSeasons, setAllSeasons] = useState<Season[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [visibilityUpdating, setVisibilityUpdating] = useState<string | null>(null)

  // Form fields
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')

  // End season dialog
  const [endDialogOpen, setEndDialogOpen] = useState(false)
  const [endSummary, setEndSummary] = useState<EndSummary | null>(null)
  const [endingSeasonLoading, setEndingSeasonLoading] = useState(false)
  const [fetchingSummary, setFetchingSummary] = useState(false)

  // Extend season dialog
  const [extendDialogOpen, setExtendDialogOpen] = useState(false)
  const [extendDate, setExtendDate] = useState('')
  const [extending, setExtending] = useState(false)

  // Activating
  const [activating, setActivating] = useState<string | null>(null)
  // Deleting
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchCurrentSeason = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/seasons/current')
      if (res.ok) {
        const data = await res.json()
        setCurrentSeason(data.season)
      }
    } catch (error) {
      logger.error('Error fetching current season:', error)
    }
  }, [])

  const fetchAllSeasons = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/seasons')
      if (res.ok) {
        const data = await res.json()
        setAllSeasons(data)
      }
    } catch (error) {
      logger.error('Error fetching seasons:', error)
    }
  }, [])

  useEffect(() => {
    async function init() {
      setLoading(true)
      await Promise.all([fetchCurrentSeason(), fetchAllSeasons()])
      setLoading(false)
    }
    init()
  }, [fetchCurrentSeason, fetchAllSeasons])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName || !formStartDate || !formEndDate) {
      toast.error('Please fill in all required fields')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/admin/seasons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          description: formDescription || undefined,
          startDate: formStartDate,
          scheduledEndDate: formEndDate,
        }),
      })

      if (res.ok) {
        toast.success('Season created successfully')
        setFormName('')
        setFormDescription('')
        setFormStartDate('')
        setFormEndDate('')
        await fetchAllSeasons()
        setActiveTab('current')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to create season')
      }
    } catch (error) {
      toast.error('Failed to create season')
    } finally {
      setCreating(false)
    }
  }

  const handleStartSeason = async (seasonId: string) => {
    setActivating(seasonId)
    try {
      const res = await fetch(`/api/admin/seasons/${seasonId}/start`, {
        method: 'POST',
      })

      if (res.ok) {
        toast.success('Season activated!')
        await Promise.all([fetchCurrentSeason(), fetchAllSeasons()])
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to start season')
      }
    } catch (error) {
      toast.error('Failed to start season')
    } finally {
      setActivating(null)
    }
  }

  const handleOpenEndDialog = async () => {
    if (!currentSeason) return
    setFetchingSummary(true)
    setEndDialogOpen(true)

    try {
      const res = await fetch(`/api/admin/seasons/${currentSeason._id}/end`)
      if (res.ok) {
        const data = await res.json()
        setEndSummary(data)
      }
    } catch (error) {
      toast.error('Failed to fetch season summary')
    } finally {
      setFetchingSummary(false)
    }
  }

  const handleEndSeason = async () => {
    if (!currentSeason) return
    setEndingSeasonLoading(true)

    try {
      const res = await fetch(`/api/admin/seasons/${currentSeason._id}/end`, {
        method: 'POST',
      })

      if (res.ok) {
        const data = await res.json()
        toast.success(
          `Season ${data.seasonNumber} ended. ${data.totalArchived} users archived.`
        )
        setEndDialogOpen(false)
        setEndSummary(null)
        await Promise.all([fetchCurrentSeason(), fetchAllSeasons()])
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to end season')
      }
    } catch (error) {
      toast.error('Failed to end season')
    } finally {
      setEndingSeasonLoading(false)
    }
  }

  const handleExtendSeason = async () => {
    if (!currentSeason || !extendDate) return
    setExtending(true)

    try {
      const res = await fetch(`/api/admin/seasons/${currentSeason._id}/extend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEndDate: extendDate }),
      })

      if (res.ok) {
        toast.success('Season extended successfully')
        setExtendDialogOpen(false)
        setExtendDate('')
        await fetchCurrentSeason()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to extend season')
      }
    } catch (error) {
      toast.error('Failed to extend season')
    } finally {
      setExtending(false)
    }
  }

  const handleDeleteSeason = async (seasonId: string) => {
    setDeleting(seasonId)
    try {
      const res = await fetch(`/api/admin/seasons/${seasonId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Season deleted')
        await fetchAllSeasons()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete season')
      }
    } catch (error) {
      toast.error('Failed to delete season')
    } finally {
      setDeleting(null)
    }
  }

  const handleHistoryVisibilityChange = async (
    seasonId: string,
    hideFromHistory: boolean
  ) => {
    setVisibilityUpdating(seasonId)
    try {
      const res = await fetch(`/api/admin/seasons/${seasonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hideFromHistory }),
      })

      if (res.ok) {
        toast.success(
          hideFromHistory
            ? 'Season hidden from history'
            : 'Season visible in history'
        )
        await fetchAllSeasons()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update season visibility')
      }
    } catch (error) {
      toast.error('Failed to update season visibility')
    } finally {
      setVisibilityUpdating(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const upcomingSeasons = allSeasons.filter((s) => s.status === 'upcoming')
  const completedSeasons = allSeasons.filter((s) => s.status === 'completed')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Season Manager</h2>
          <p className="text-muted-foreground">
            Manage competitive seasons, view history, and control resets
          </p>
        </div>
        <CalendarClock className="h-8 w-8 text-primary" />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="current" className="flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Current
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Current Season Tab */}
        <TabsContent value="current" className="space-y-4 mt-6">
          {currentSeason ? (
            <Card className="border-green-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      Season {currentSeason.seasonNumber}: {currentSeason.name}
                    </CardTitle>
                    {currentSeason.description && (
                      <CardDescription className="mt-1">
                        {currentSeason.description}
                      </CardDescription>
                    )}
                  </div>
                  <Badge variant="default" className="bg-green-600 text-white">
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Dates & Countdown */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-700/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-400">Started</span>
                    </div>
                    <p className="text-sm font-medium">
                      {formatDate(currentSeason.startDate)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-700/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-400">Scheduled End</span>
                    </div>
                    <p className="text-sm font-medium">
                      {formatDate(currentSeason.scheduledEndDate)}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-700/50">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm text-gray-400">Time Remaining</span>
                    </div>
                    <p className="text-lg font-bold text-yellow-400">
                      {currentSeason.isExpired
                        ? 'Expired (auto-end pending)'
                        : `${currentSeason.daysRemaining}d ${(currentSeason.hoursRemaining || 0) % 24}h`}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="destructive"
                    onClick={handleOpenEndDialog}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    End Season Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setExtendDialogOpen(true)}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Extend Season
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Timer className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Active Season</h3>
                <p className="text-gray-400 mb-6">
                  There is no season currently running. Create or activate a season to begin.
                </p>

                {upcomingSeasons.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <p className="text-sm text-gray-400">Upcoming seasons:</p>
                    {upcomingSeasons.map((season) => (
                      <div
                        key={season._id}
                        className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/50 border border-zinc-700/50 max-w-md mx-auto"
                      >
                        <div className="text-left">
                          <p className="font-medium">
                            Season {season.seasonNumber}: {season.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            Starts {formatDate(season.startDate)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleStartSeason(season._id)}
                          disabled={activating === season._id}
                        >
                          {activating === season._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {upcomingSeasons.length === 0 && (
                  <Button onClick={() => setActiveTab('create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Season
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Create Season Tab */}
        <TabsContent value="create" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Season</CardTitle>
              <CardDescription>
                Set up a new competitive season. It will be created as &quot;upcoming&quot; until you
                activate it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4 max-w-lg">
                <div className="space-y-2">
                  <Label htmlFor="name">Season Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Genesis, Rising Storm"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description for the season"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="datetime-local"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date *</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {creating ? 'Creating...' : 'Create Season'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 mt-6">
          {/* Upcoming Seasons */}
          {upcomingSeasons.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-400" />
                Upcoming Seasons
              </h3>
              {upcomingSeasons.map((season) => (
                <Card key={season._id} className="border-blue-500/20">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          Season {season.seasonNumber}: {season.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {formatDate(season.startDate)} - {formatDate(season.scheduledEndDate)}
                          <span className="ml-2 text-gray-500">
                            ({formatDuration(season.startDate, season.scheduledEndDate)})
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                          Upcoming
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSeason(season._id)}
                          disabled={deleting === season._id}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          {deleting === season._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Completed Seasons */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              Completed Seasons
            </h3>
            {completedSeasons.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-400">
                  No completed seasons yet.
                </CardContent>
              </Card>
            ) : (
              completedSeasons.map((season) => (
                <Card key={season._id} className="border-zinc-700/50">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          Season {season.seasonNumber}: {season.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {formatDate(season.startDate)} -{' '}
                          {formatDate(season.actualEndDate || season.scheduledEndDate)}
                          <span className="ml-2 text-gray-500">
                            ({formatDuration(
                              season.startDate,
                              season.actualEndDate || season.scheduledEndDate
                            )})
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {season.totalParticipants !== undefined && (
                          <div className="flex items-center gap-1 text-sm text-gray-400">
                            <Users className="h-4 w-4" />
                            {season.totalParticipants}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>Hide from history</span>
                          <Switch
                            checked={Boolean(season.hideFromHistory)}
                            onCheckedChange={(checked) =>
                              handleHistoryVisibilityChange(season._id, checked)
                            }
                            disabled={visibilityUpdating === season._id}
                          />
                        </div>
                        <Badge variant="outline" className="text-gray-400 border-gray-600">
                          Completed
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* End Season Confirmation Dialog */}
      <Dialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              End Season?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Ending the season will:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {fetchingSummary ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : endSummary ? (
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">-</span>
                  <span>
                    Auto-reject <strong>{endSummary.pendingSubmissions}</strong> pending
                    mission submission{endSummary.pendingSubmissions !== 1 ? 's' : ''}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">-</span>
                  <span>
                    Cancel <strong>{endSummary.pendingRedemptions}</strong> pending
                    redemption{endSummary.pendingRedemptions !== 1 ? 's' : ''} (coins will
                    be refunded before reset)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">-</span>
                  <span>Archive all user stats and leaderboard positions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">-</span>
                  <span>
                    Reset <strong>all users</strong> to Rookie rank with 0 XP and 0 coins
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 mt-0.5">-</span>
                  <span>Clear all mission completion history</span>
                </li>
              </ul>
            ) : null}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEndDialogOpen(false)}
              disabled={endingSeasonLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleEndSeason}
              disabled={endingSeasonLoading || fetchingSummary}
              className="bg-red-600 hover:bg-red-700"
            >
              {endingSeasonLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Square className="h-4 w-4 mr-2" />
              )}
              {endingSeasonLoading ? 'Ending Season...' : 'End Season'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Season Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Season</DialogTitle>
            <DialogDescription>
              Set a new end date for the current season. Must be in the future.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="extendDate">New End Date</Label>
            <Input
              id="extendDate"
              type="datetime-local"
              value={extendDate}
              onChange={(e) => setExtendDate(e.target.value)}
              className="mt-2"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setExtendDialogOpen(false)}
              disabled={extending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExtendSeason}
              disabled={extending || !extendDate}
            >
              {extending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              {extending ? 'Extending...' : 'Extend Season'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
