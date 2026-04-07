import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('discord sync flags', () => {
  const envBackup = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...envBackup }
    delete process.env.DISCORD_SYNC_ENABLED
    delete process.env.DISCORD_SYNC_DRY_RUN
    delete process.env.DISCORD_RECONCILE_ENABLED
  })

  it('uses backward compatible defaults when flags are absent', async () => {
    const { getDiscordSyncFlags } = await import('@/lib/discord-sync-flags')

    expect(getDiscordSyncFlags()).toEqual({
      syncEnabled: true,
      dryRun: false,
      reconcileEnabled: false,
    })
  })

  it('parses explicit true/false flag values', async () => {
    process.env.DISCORD_SYNC_ENABLED = 'false'
    process.env.DISCORD_SYNC_DRY_RUN = 'true'
    process.env.DISCORD_RECONCILE_ENABLED = 'true'

    const { getDiscordSyncFlags } = await import('@/lib/discord-sync-flags')

    expect(getDiscordSyncFlags()).toEqual({
      syncEnabled: false,
      dryRun: true,
      reconcileEnabled: true,
    })
  })
})
