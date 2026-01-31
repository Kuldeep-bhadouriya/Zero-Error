'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Shield, Key, AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function SecuritySettings() {
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

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
