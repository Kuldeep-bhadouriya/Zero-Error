import { describe, expect, it } from 'vitest'
import { deriveDiscordSyncUiState } from '@/lib/ze-club/discordSyncUi'

describe('discord sync dashboard UI state', () => {
  it('returns unlinked defaults when payload is missing', () => {
    const state = deriveDiscordSyncUiState(undefined)

    expect(state.linkLabel).toBe('Unlinked')
    expect(state.verifiedLabel).toBe('Not verified')
    expect(state.lastSyncText).toBe('Never synced')
    expect(state.showError).toBe(false)
  })

  it('returns linked and verified states for eligible synced users', () => {
    const state = deriveDiscordSyncUiState({
      linked: true,
      verified: true,
      eligibleForRoleSync: true,
      sync: {
        linkStatus: 'linked_verified',
        lastSyncedAt: '2026-04-01T12:00:00.000Z',
        lastSyncStatus: 'succeeded',
        lastSyncError: null,
        lastSyncErrorAt: null,
      },
    })

    expect(state.linkLabel).toBe('Linked')
    expect(state.verifiedLabel).toBe('Verified')
    expect(state.lastSyncText).not.toBe('Never synced')
    expect(state.showError).toBe(false)
  })

  it('surfaces last sync error text when sync failed', () => {
    const state = deriveDiscordSyncUiState({
      linked: true,
      verified: true,
      eligibleForRoleSync: false,
      sync: {
        linkStatus: 'linked_verified',
        lastSyncedAt: null,
        lastSyncStatus: 'failed',
        lastSyncError: 'Missing role mapping for Vanguard',
        lastSyncErrorAt: '2026-04-03T10:15:00.000Z',
      },
    })

    expect(state.showError).toBe(true)
    expect(state.lastErrorText).toContain('Missing role mapping for Vanguard')
  })
})
