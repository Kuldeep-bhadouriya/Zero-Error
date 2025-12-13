'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, RefreshCw, AlertCircle } from 'lucide-react'
import MissionForm from './MissionForm'
import MissionList from './MissionList'

export default function MissionManager() {
  const [missions, setMissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('list')
  const [editingMission, setEditingMission] = useState<any>(null)

  useEffect(() => {
    fetchMissions()
  }, [])

  async function fetchMissions() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/missions/list')
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch missions')
      }

      const data = await res.json()
      setMissions(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleCreateNew() {
    setEditingMission(null)
    setActiveTab('form')
  }

  function handleEdit(mission: any) {
    setEditingMission(mission)
    setActiveTab('form')
  }

  function handleFormSuccess() {
    setEditingMission(null)
    setActiveTab('list')
    fetchMissions()
  }

  function handleFormCancel() {
    setEditingMission(null)
    setActiveTab('list')
  }

  // Calculate stats
  const stats = {
    total: missions.length,
    active: missions.filter((m) => m.active).length,
    inactive: missions.filter((m) => !m.active).length,
    timeLimited: missions.filter((m) => m.isTimeLimited).length,
    featured: missions.filter((m) => m.featured).length,
    expired: missions.filter((m) => m.isExpired).length,
    maxedOut: missions.filter((m) => m.isMaxedOut).length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Mission Management</h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Create, edit, and manage ZE Club missions
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={fetchMissions}
            disabled={loading}
            className="flex-1 sm:flex-none bg-zinc-800 border-zinc-700 text-gray-300 hover:text-white hover:bg-zinc-700"
          >
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button onClick={handleCreateNew} className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">New Mission</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <Card className="bg-zinc-900/50 border-zinc-700">
          <CardHeader className="pb-2 px-3 pt-3 sm:pb-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">Total Missions</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-gray-400">
              {stats.active} active, {stats.inactive} inactive
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-700">
          <CardHeader className="pb-2 px-3 pt-3 sm:pb-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">Time-Limited</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-white">{stats.timeLimited}</div>
            <p className="text-xs text-gray-400">
              {stats.expired} expired
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-700">
          <CardHeader className="pb-2 px-3 pt-3 sm:pb-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">Featured</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-white">{stats.featured}</div>
            <p className="text-xs text-gray-400">
              Shown at top of list
            </p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-zinc-700">
          <CardHeader className="pb-2 px-3 pt-3 sm:pb-3 sm:px-6 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-medium text-white">At Capacity</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-white">{stats.maxedOut}</div>
            <p className="text-xs text-gray-400">
              Max completions reached
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-zinc-900 border border-zinc-700">
          <TabsTrigger value="list" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-300">Mission List</TabsTrigger>
          <TabsTrigger value="form" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-gray-300">
            {editingMission ? 'Edit Mission' : 'Create Mission'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="mt-6">
          {loading && missions.length === 0 ? (
            <Card className="bg-zinc-900/50 border-zinc-700">
              <CardContent className="pt-6">
                <div className="text-center text-gray-400">
                  Loading missions...
                </div>
              </CardContent>
            </Card>
          ) : (
            <MissionList
              missions={missions}
              onEdit={handleEdit}
              onRefresh={fetchMissions}
            />
          )}
        </TabsContent>

        <TabsContent value="form" className="mt-6">
          <Card className="bg-zinc-900/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">
                {editingMission ? 'Edit Mission' : 'Create New Mission'}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {editingMission
                  ? 'Update mission details and settings'
                  : 'Configure a new mission for ZE Club members'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MissionForm
                mission={editingMission}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
