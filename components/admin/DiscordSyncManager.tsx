'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertTriangle, RefreshCw, RotateCcw, Search, ShieldAlert } from 'lucide-react'

type FailedSyncJob = {
  id: string
  userId: string
  guildId: string
  discordId: string
  status: 'failed' | 'dead_letter' | string
  source: string
  targetRank: string
  targetRoleId: string
  attemptCount: number
  maxAttempts: number
  lastError: string | null
  lastErrorCode: string | null
  nextRetryAt: string | null
  failedAt: string | null
  updatedAt: string
}

type ReconcileSummary = {
  dryRun: boolean
  guildId: string
  scopedUserId: string | null
  eligibleCount: number
  mappedUsers: number
  queuedJobs: number
  skippedActiveJob: number
  skippedMissingMapping: number
}

export default function DiscordSyncManager() {
  const [jobs, setJobs] = useState<FailedSyncJob[]>([])
  const [loading, setLoading] = useState(true)
  const [runningReconcile, setRunningReconcile] = useState(false)
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null)

  const [guildFilter, setGuildFilter] = useState('')
  const [guildId, setGuildId] = useState('')
  const [userId, setUserId] = useState('')
  const [dryRun, setDryRun] = useState(true)
  const [lastSummary, setLastSummary] = useState<ReconcileSummary | null>(null)

  async function loadFailedJobs() {
    setLoading(true)
    try {
      const url = new URL('/api/admin/discord-sync/jobs/failed', window.location.origin)
      if (guildFilter.trim()) {
        url.searchParams.set('guildId', guildFilter.trim())
      }

      const res = await fetch(url.toString())
      if (!res.ok) {
        throw new Error('Failed to load failed sync jobs')
      }

      const payload = await res.json()
      setJobs(Array.isArray(payload.jobs) ? payload.jobs : [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load failed sync jobs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadFailedJobs()
  }, [])

  const deadLetterCount = useMemo(
    () => jobs.filter((job) => job.status === 'dead_letter').length,
    [jobs]
  )

  async function retryJob(jobId: string) {
    setRetryingJobId(jobId)
    try {
      const res = await fetch(`/api/admin/discord-sync/jobs/${jobId}/retry`, {
        method: 'POST',
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload.error || 'Failed to retry sync job')
      }

      toast.success('Sync job moved back to pending queue')
      await loadFailedJobs()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to retry sync job')
    } finally {
      setRetryingJobId(null)
    }
  }

  async function triggerReconcile() {
    if (!guildId.trim()) {
      toast.error('Guild ID is required to run reconcile')
      return
    }

    setRunningReconcile(true)
    try {
      const res = await fetch('/api/admin/discord-sync/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guildId: guildId.trim(),
          userId: userId.trim() || undefined,
          dryRun,
          reason: 'admin_phase6_control',
        }),
      })

      const payload = await res.json()
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to run reconcile')
      }

      setLastSummary(payload.data)
      toast.success(dryRun ? 'Dry-run reconcile completed' : 'Reconcile enqueued successfully')
      if (!dryRun) {
        await loadFailedJobs()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to run reconcile')
    } finally {
      setRunningReconcile(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-zinc-700/40 bg-zinc-900/40">
          <CardHeader className="pb-3">
            <CardDescription>Failed Jobs</CardDescription>
            <CardTitle className="text-2xl">{jobs.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-amber-500/30 bg-amber-500/10">
          <CardHeader className="pb-3">
            <CardDescription>Dead Letter</CardDescription>
            <CardTitle className="text-2xl text-amber-300">{deadLetterCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-zinc-700/40 bg-zinc-900/40">
          <CardHeader className="pb-3">
            <CardDescription>Active Filter</CardDescription>
            <CardTitle className="text-sm text-zinc-200">
              {guildFilter.trim() ? `Guild: ${guildFilter.trim()}` : 'All guilds'}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-zinc-700/40 bg-zinc-900/40">
        <CardHeader>
          <CardTitle className="text-xl">Reconcile Controls</CardTitle>
          <CardDescription>Run dry-run checks or enqueue corrective sync jobs.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              value={guildId}
              onChange={(event) => setGuildId(event.target.value)}
              placeholder="Guild ID"
            />
            <Input
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Optional User ID"
            />
            <label className="flex items-center gap-2 rounded-md border border-zinc-700/50 px-3 py-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(event) => setDryRun(event.target.checked)}
              />
              Dry run mode
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={triggerReconcile} disabled={runningReconcile}>
              {runningReconcile ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : dryRun ? (
                'Run Dry-Run Reconcile'
              ) : (
                'Run Reconcile + Enqueue'
              )}
            </Button>
            <Button
              variant="secondary"
              onClick={loadFailedJobs}
              disabled={loading}
              className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh Jobs
            </Button>
          </div>

          {lastSummary && (
            <div className="rounded-xl border border-zinc-700/40 bg-zinc-950/40 p-4 text-sm text-zinc-300">
              <p className="mb-2 font-medium text-white">Latest Reconcile Summary</p>
              <div className="grid gap-1 sm:grid-cols-2">
                <p>Eligible: {lastSummary.eligibleCount}</p>
                <p>Mapped: {lastSummary.mappedUsers}</p>
                <p>Queued: {lastSummary.queuedJobs}</p>
                <p>Skipped Active: {lastSummary.skippedActiveJob}</p>
                <p>Missing Mapping: {lastSummary.skippedMissingMapping}</p>
                <p>Mode: {lastSummary.dryRun ? 'Dry run' : 'Enqueue'}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-zinc-700/40 bg-zinc-900/40">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">Failed Sync Jobs</CardTitle>
              <CardDescription>Inspect failures and manually retry queued work.</CardDescription>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <Input
                value={guildFilter}
                onChange={(event) => setGuildFilter(event.target.value)}
                placeholder="Filter by guild"
                className="sm:w-64"
              />
              <Button onClick={loadFailedJobs} variant="outline" className="border-zinc-700">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-zinc-400">Loading failed jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-6 text-center text-emerald-300">
              <ShieldAlert className="mx-auto mb-2 h-6 w-6" />
              No failed or dead-letter sync jobs found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-700/40">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Guild</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <Badge
                          className={
                            job.status === 'dead_letter'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-red-500/20 text-red-300 border-red-500/40'
                          }
                        >
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-300">{job.guildId}</TableCell>
                      <TableCell>
                        <div className="text-sm text-zinc-100">{job.targetRank}</div>
                        <div className="text-xs text-zinc-400">Role: {job.targetRoleId}</div>
                      </TableCell>
                      <TableCell className="text-sm text-zinc-300">
                        {job.attemptCount}/{job.maxAttempts}
                      </TableCell>
                      <TableCell>
                        {job.lastError ? (
                          <p className="max-w-[280px] text-xs text-red-200">{job.lastError}</p>
                        ) : (
                          <span className="text-xs text-zinc-500">No error details</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-400">
                        {new Date(job.updatedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-zinc-600"
                          disabled={retryingJobId === job.id}
                          onClick={() => retryJob(job.id)}
                        >
                          {retryingJobId === job.id ? (
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="mr-2 h-4 w-4" />
                          )}
                          Retry
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {jobs.length > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              Retry changes job status back to pending so the bot can claim it again.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
