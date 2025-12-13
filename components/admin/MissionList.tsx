'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Edit, 
  Trash2, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Search,
  Star,
  Users,
  AlertCircle
} from 'lucide-react'
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
import { cn } from '@/lib/utils'

interface MissionListProps {
  missions: any[]
  onEdit: (mission: any) => void
  onRefresh: () => void
}

export default function MissionList({ missions, onEdit, onRefresh }: MissionListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [timeLimitedOnly, setTimeLimitedOnly] = useState(false)
  const [featuredOnly, setFeaturedOnly] = useState(false)
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [missionToDelete, setMissionToDelete] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Get unique categories - filter out empty/undefined values
  const categories = Array.from(
    new Set(missions.map((m) => m.category).filter((cat) => cat && cat.trim() !== ''))
  )

  // Filter missions
  const filteredMissions = missions.filter((mission) => {
    // Hide deleted missions (soft deleted with deactivatedAt)
    if (mission.deactivatedAt) {
      return false
    }
    
    if (searchQuery && !mission.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !mission.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (categoryFilter !== 'all' && mission.category !== categoryFilter) {
      return false
    }
    if (difficultyFilter !== 'all' && mission.difficulty !== difficultyFilter) {
      return false
    }
    if (statusFilter === 'active' && !mission.active) {
      return false
    }
    if (statusFilter === 'inactive' && mission.active) {
      return false
    }
    if (timeLimitedOnly && !mission.isTimeLimited) {
      return false
    }
    if (featuredOnly && !mission.featured) {
      return false
    }
    return true
  })

  async function handleToggleActive(mission: any) {
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/admin/missions/toggle-active', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId: mission._id,
          active: !mission.active,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to toggle status')
      }

      onRefresh()
    } catch (err: any) {
      console.error('Error toggling mission status:', err)
      setError(err.message || 'Failed to toggle mission status')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!missionToDelete) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/missions/delete?id=${missionToDelete._id}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete mission')
      }

      setDeleteDialogOpen(false)
      setMissionToDelete(null)
      onRefresh()
    } catch (err: any) {
      console.error('Error deleting mission:', err)
      setError(err.message || 'Failed to delete mission')
    } finally {
      setLoading(false)
    }
  }

  function getDifficultyColor(difficulty: string) {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-500'
      case 'Medium':
        return 'bg-yellow-500'
      case 'Hard':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card className="bg-zinc-900/50 border-zinc-700">
        <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
          <CardTitle className="text-white text-sm sm:text-base">Filters</CardTitle>
          <CardDescription className="text-gray-400 text-xs sm:text-sm">Filter and search missions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 px-3 pb-3 sm:px-6 sm:pb-6">
          <div className="flex gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search missions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-sm bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
            <div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all" className="text-white hover:bg-zinc-700 text-sm">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-white hover:bg-zinc-700 text-sm">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all" className="text-white hover:bg-zinc-700 text-sm">All Difficulties</SelectItem>
                  <SelectItem value="Easy" className="text-white hover:bg-zinc-700 text-sm">Easy</SelectItem>
                  <SelectItem value="Medium" className="text-white hover:bg-zinc-700 text-sm">Medium</SelectItem>
                  <SelectItem value="Hard" className="text-white hover:bg-zinc-700 text-sm">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white text-sm">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="all" className="text-white hover:bg-zinc-700 text-sm">All Status</SelectItem>
                  <SelectItem value="active" className="text-white hover:bg-zinc-700 text-sm">Active Only</SelectItem>
                  <SelectItem value="inactive" className="text-white hover:bg-zinc-700 text-sm">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={timeLimitedOnly}
                onCheckedChange={setTimeLimitedOnly}
                id="time-limited"
                className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-zinc-700"
              />
              <label htmlFor="time-limited" className="text-sm cursor-pointer text-gray-300">
                Time-limited only
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={featuredOnly}
                onCheckedChange={setFeaturedOnly}
                id="featured"
                className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-zinc-700"
              />
              <label htmlFor="featured" className="text-sm cursor-pointer text-gray-300">
                Featured only
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mission Table */}
      <Card className="bg-zinc-900/50 border-zinc-700">
        <CardHeader className="px-3 py-3 sm:px-6 sm:py-4">
          <CardTitle className="text-white text-sm sm:text-base">
            Missions ({filteredMissions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full">
            <div className="min-w-[900px]">
              <Table>
              <TableHeader>
                <TableRow className="border-zinc-700 hover:bg-zinc-800/50">
                  <TableHead className="w-[200px] text-gray-300 text-xs sm:text-sm">Name</TableHead>
                  <TableHead className="w-[100px] text-gray-300 text-xs sm:text-sm">Category</TableHead>
                  <TableHead className="w-[100px] text-gray-300 text-xs sm:text-sm">Difficulty</TableHead>
                  <TableHead className="w-[80px] text-gray-300 text-xs sm:text-sm">Points</TableHead>
                  <TableHead className="w-[100px] text-gray-300 text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="w-[120px] text-gray-300 text-xs sm:text-sm">Completions</TableHead>
                  <TableHead className="w-[120px] text-gray-300 text-xs sm:text-sm">Time Limit</TableHead>
                  <TableHead className="w-[100px] text-gray-300 text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMissions.length === 0 ? (
                  <TableRow className="border-zinc-700">
                    <TableCell colSpan={8} className="text-center text-gray-400">
                      No missions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMissions.map((mission) => (
                    <TableRow key={mission._id} className="border-zinc-700 hover:bg-zinc-800/30">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2">
                          {mission.featured && (
                            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-white text-xs sm:text-sm truncate max-w-[160px]">{mission.name}</div>
                            <div className="text-xs text-gray-400 line-clamp-1">
                              {mission.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className="border-zinc-600 text-gray-300 text-xs">{mission.category}</Badge>
                      </TableCell>
                      <TableCell className="text-gray-300 py-3">
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <div className={cn('h-2 w-2 rounded-full flex-shrink-0', getDifficultyColor(mission.difficulty))} />
                          {mission.difficulty}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 py-3">
                        <div className="flex items-center gap-1 text-xs sm:text-sm">
                          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
                          {mission.points}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-1">
                          <Switch
                            checked={mission.active}
                            onCheckedChange={() => handleToggleActive(mission)}
                            disabled={loading}
                            className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-zinc-700"
                          />
                          {mission.isExpired && (
                            <Badge variant="destructive" className="text-xs bg-red-600/20 text-red-400 border-red-600/50">
                              Expired
                            </Badge>
                          )}
                          {mission.isMaxedOut && (
                            <Badge variant="secondary" className="text-xs bg-zinc-700 text-gray-300">
                              Full
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 py-3">
                        <div className="flex items-center gap-1 text-xs sm:text-sm">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                          <span>
                            {mission.currentCompletions}
                            {mission.maxCompletions ? `/${mission.maxCompletions}` : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-300 py-3">
                        {mission.isTimeLimited ? (
                          <div className="flex items-center gap-1 text-xs sm:text-sm">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 flex-shrink-0" />
                            {mission.daysRemaining !== null ? (
                              <span>{mission.daysRemaining}d left</span>
                            ) : mission.isExpired ? (
                              <span className="text-red-500">Expired</span>
                            ) : (
                              <span>Active</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => onEdit(mission)}
                            disabled={loading}
                            className="text-gray-300 hover:text-white hover:bg-zinc-800 h-8 w-8"
                          >
                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setMissionToDelete(mission)
                              setDeleteDialogOpen(true)
                            }}
                            disabled={loading}
                            className="text-red-400 hover:text-red-300 hover:bg-zinc-800 h-8 w-8"
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{missionToDelete?.name}"? This will deactivate the
              mission and prevent new submissions. Existing submissions will be preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={loading}
              className="bg-red-500 hover:bg-red-600"
            >
              {loading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
