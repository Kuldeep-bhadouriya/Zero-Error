export type ClaimedSyncJob = {
  id: string
  userId: string
  guildId: string
  discordId: string
  targetRank: string
  targetRoleId: string
  source: string
  attemptCount: number
  maxAttempts: number
  idempotencyKey: string
  claimedAt?: string
  correlationId?: string
  rankRoleIds?: string[]
}

export type ClaimJobsResponse = {
  jobs: ClaimedSyncJob[]
  claimedCount: number
}

export type ReconcileCandidate = {
  userId: string
  discordId: string
  guildId: string
  expectedRank: string
  expectedRoleId: string
  rankRoleIds: string[]
}

export type ReconcileScanResponse = {
  guildId: string
  scopedUserId: string | null
  scannedUsers: number
  candidates: ReconcileCandidate[]
  skippedMissingMapping: number
}

export type ReconcileExecuteResponse = {
  mode: 'scheduled' | 'targeted' | 'manual'
  dryRun: boolean
  guildId: string
  scopedUserId: string | null
  eligibleCount: number
  mappedUsers: number
  queuedJobs: number
  skippedActiveJob: number
  skippedMissingMapping: number
}

export type ReconcileRunMetrics = {
  mode: 'scheduled' | 'targeted'
  dryRun: boolean
  guildId: string
  scopedUserId: string | null
  scannedUsers: number
  mismatchesFound: number
  correctedCount: number
  failedCount: number
}

export type CompleteJobPayload = {
  note?: string
}

export type FailJobPayload = {
  error: string
  errorCode?: string
  retryDelaySeconds: number
  deadLetter: boolean
}

export type InternalApiEnvelope<T> = {
  success: boolean
  data?: T
  error?: string
}
