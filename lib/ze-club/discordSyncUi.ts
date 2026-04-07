export type DiscordSyncDashboardPayload = {
  linked: boolean
  verified: boolean
  eligibleForRoleSync: boolean
  sync: {
    linkStatus: string
    lastSyncedAt: string | null
    lastSyncStatus: string
    lastSyncError: string | null
    lastSyncErrorAt: string | null
  }
}

export type DiscordSyncUiState = {
  linkLabel: string
  verifiedLabel: string
  lastSyncText: string
  lastErrorText: string
  showError: boolean
}

export function deriveDiscordSyncUiState(
  discord: DiscordSyncDashboardPayload | null | undefined
): DiscordSyncUiState {
  if (!discord) {
    return {
      linkLabel: 'Unlinked',
      verifiedLabel: 'Not verified',
      lastSyncText: 'Never synced',
      lastErrorText: 'No recent sync errors',
      showError: false,
    }
  }

  const linkLabel = discord.linked ? 'Linked' : 'Unlinked'
  const verifiedLabel = discord.verified ? 'Verified' : 'Not verified'
  const lastSyncText = discord.sync.lastSyncedAt
    ? new Date(discord.sync.lastSyncedAt).toLocaleString()
    : 'Never synced'

  const hasError = Boolean(discord.sync.lastSyncError)
  const lastErrorText = hasError
    ? discord.sync.lastSyncError || 'Unknown sync error'
    : 'No recent sync errors'

  return {
    linkLabel,
    verifiedLabel,
    lastSyncText,
    lastErrorText,
    showError: hasError,
  }
}
