export type DiscordSyncFlags = {
  syncEnabled: boolean
  dryRun: boolean
  reconcileEnabled: boolean
}

export type DiscordActivityFlags = {
  activityPointsEnabled: boolean
}

function parseBooleanEnv(rawValue: string | undefined, fallback: boolean) {
  if (typeof rawValue !== 'string') {
    return fallback
  }

  const normalized = rawValue.trim().toLowerCase()
  if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
    return true
  }

  if (normalized === 'false' || normalized === '0' || normalized === 'no') {
    return false
  }

  return fallback
}

export function getDiscordActivityFlags(): DiscordActivityFlags {
  return {
    // Optional Phase 9 is disabled by default and must be explicitly enabled.
    activityPointsEnabled: parseBooleanEnv(process.env.DISCORD_ACTIVITY_POINTS_ENABLED, false),
  }
}

export function getDiscordSyncFlags(): DiscordSyncFlags {
  return {
    // Keep backward compatibility: existing deployments continue to process unless explicitly disabled.
    syncEnabled: parseBooleanEnv(process.env.DISCORD_SYNC_ENABLED, true),
    dryRun: parseBooleanEnv(process.env.DISCORD_SYNC_DRY_RUN, false),
    // Reconcile flag defaults to false to preserve explicit opt-in behavior from earlier phases.
    reconcileEnabled: parseBooleanEnv(process.env.DISCORD_RECONCILE_ENABLED, false),
  }
}
