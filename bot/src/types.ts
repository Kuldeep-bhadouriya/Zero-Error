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
