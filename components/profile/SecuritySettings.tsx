'use client'

import { useEffect, useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Key, AlertTriangle, Loader2, Link2, CheckCircle2, Unlink } from 'lucide-react'
import { toast } from 'sonner'

type DiscordStatusPayload = {
  linked: boolean
  verified: boolean
  eligibleForRoleSync: boolean
  discord?: {
    id?: string | null
    username?: string | null
    globalName?: string | null
    avatar?: string | null
  }
  sync?: {
    linkStatus?: string
    linkedAt?: string | null
    verifiedAt?: string | null
    lastSyncedAt?: string | null
    lastSyncStatus?: string
    lastSyncError?: string | null
    lastSyncErrorAt?: string | null
  }
}

export function SecuritySettings() {
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [discordStatus, setDiscordStatus] = useState<DiscordStatusPayload | null>(null)
  const [isDiscordLoading, setIsDiscordLoading] = useState(true)
  const [isDiscordLinkStarting, setIsDiscordLinkStarting] = useState(false)
  const [isDiscordUnlinking, setIsDiscordUnlinking] = useState(false)

  useEffect(() => {
    void refreshDiscordStatus()
  }, [])

  async function refreshDiscordStatus() {
    setIsDiscordLoading(true)
    try {
      const response = await fetch('/api/user/discord/status', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to fetch Discord status')
      }

      const payload = (await response.json()) as DiscordStatusPayload
      setDiscordStatus(payload)
    } catch {
      toast.error('Unable to load Discord verification status')
    } finally {
      setIsDiscordLoading(false)
    }
  }

  async function handleStartDiscordLink() {
    setIsDiscordLinkStarting(true)
    try {
      const response = await fetch('/api/user/discord/link/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ redirectTo: '/profile' }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to start Discord verification')
      }

      const authorizationUrl = payload?.authorizationUrl as string | undefined
      if (!authorizationUrl) {
        throw new Error('Missing Discord authorization URL')
      }

      window.location.assign(authorizationUrl)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start Discord verification'
      toast.error(message)
      setIsDiscordLinkStarting(false)
    }
  }

  async function handleUnlinkDiscord() {
    const confirmed = window.confirm('Unlink your Discord account from ZE Club?')
    if (!confirmed) {
      return
    }

    setIsDiscordUnlinking(true)
    try {
      const response = await fetch('/api/user/discord/unlink', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ confirm: true }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to unlink Discord account')
      }

      toast.success('Discord account unlinked')
      await refreshDiscordStatus()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unlink Discord account'
      toast.error(message)
    } finally {
      setIsDiscordUnlinking(false)
    }
  }

  async function handlePasswordChange() {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setIsChangingPassword(true)
    try {
      const res = await fetch('/api/user/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (res.ok) {
        toast.success('Password updated successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update password')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <GlassCard variant="subtle" className="p-5 sm:p-6 h-full">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-red-500/10 p-2.5 rounded-xl border border-red-500/20">
            <Shield className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Security Settings</h2>
            <p className="text-gray-400 text-sm mt-0.5">
              Manage your account security and authentication
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Discord Verification */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Link2 className="w-4 h-4 text-indigo-400" />
            <h3 className="font-semibold text-white text-base">Discord Verification</h3>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-3">
            {isDiscordLoading ? (
              <p className="text-sm text-gray-300 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading Discord status...
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {discordStatus?.eligibleForRoleSync ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified for role sync
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5" /> Discord not verified
                    </span>
                  )}
                </div>

                {discordStatus?.linked ? (
                  <p className="text-sm text-gray-300">
                    Linked as{' '}
                    <span className="text-white font-medium">
                      {discordStatus.discord?.globalName || discordStatus.discord?.username || 'Discord user'}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">
                    Connect Discord to enable automatic ZE Club role sync.
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    onClick={handleStartDiscordLink}
                    disabled={isDiscordLinkStarting || isDiscordUnlinking}
                    className="bg-indigo-500 text-white hover:bg-indigo-400 font-medium h-9 px-4 rounded-lg transition-all disabled:opacity-50"
                  >
                    {isDiscordLinkStarting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {discordStatus?.linked ? 'Re-verify Discord' : 'Connect Discord'}
                  </Button>

                  {discordStatus?.linked && (
                    <Button
                      variant="outline"
                      onClick={handleUnlinkDiscord}
                      disabled={isDiscordUnlinking || isDiscordLinkStarting}
                      className="border-red-500/40 text-red-300 hover:bg-red-500/10 hover:text-red-200 h-9 px-4 rounded-lg"
                    >
                      {isDiscordUnlinking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {!isDiscordUnlinking && <Unlink className="mr-2 h-4 w-4" />}
                      Unlink Discord
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Change Password */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-4 h-4 text-red-400" />
            <h3 className="font-semibold text-white text-base">Change Password</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-gray-300 font-medium text-xs uppercase tracking-wider">
                Current Password
              </Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 h-10 text-sm rounded-lg"
                placeholder="Enter current password"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-gray-300 font-medium text-xs uppercase tracking-wider">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 h-10 text-sm rounded-lg"
                  placeholder="Min 8 characters"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-300 font-medium text-xs uppercase tracking-wider">
                  Confirm Password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-black/40 border-white/10 text-white placeholder:text-zinc-600 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 h-10 text-sm rounded-lg"
                  placeholder="Re-enter password"
                />
              </div>
            </div>

            {(newPassword && newPassword.length < 8) && (
              <p className="text-xs text-yellow-400 flex items-center gap-1.5 mt-2">
                <AlertTriangle className="w-3 h-3" />
                Password must be at least 8 characters
              </p>
            )}

            {(confirmPassword && newPassword !== confirmPassword) && (
              <p className="text-xs text-red-400 flex items-center gap-1.5 mt-2">
                <AlertTriangle className="w-3 h-3" />
                Passwords do not match
              </p>
            )}

            <div className="pt-2">
              <Button
                onClick={handlePasswordChange}
                disabled={isChangingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 8}
                className="w-full sm:w-auto bg-white text-black hover:bg-gray-200 font-medium h-10 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isChangingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </div>
        </div>

        {/* Future Features */}
        <div className="border-t border-white/5 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-zinc-500" />
            <h3 className="font-semibold text-zinc-400 text-base">Enhanced Security</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 text-zinc-500 bg-zinc-900/30 p-3 rounded-lg border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 flex-shrink-0"></div>
              <span className="text-sm">Two-factor authentication (2FA)</span>
            </div>
            <div className="flex items-center gap-3 text-zinc-500 bg-zinc-900/30 p-3 rounded-lg border border-white/5">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 flex-shrink-0"></div>
              <span className="text-sm">Session management</span>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  )
}
