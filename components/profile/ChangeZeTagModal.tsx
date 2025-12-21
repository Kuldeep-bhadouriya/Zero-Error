'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDebounce } from '@/hooks/useDebounce'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface ChangeZeTagModalProps {
  isOpen: boolean
  onClose: () => void
  currentZeTag?: string
  onSuccess: () => void
}

export function ChangeZeTagModal({
  isOpen,
  onClose,
  currentZeTag,
  onSuccess,
}: ChangeZeTagModalProps) {
  const [zeTag, setZeTag] = useState(currentZeTag || '')
  const debouncedZeTag = useDebounce(zeTag, 500)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (debouncedZeTag.length >= 3 && debouncedZeTag !== currentZeTag) {
      setIsChecking(true)
      setError(null)
      fetch(`/api/user/profile/check-zetag?zeTag=${debouncedZeTag}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error)
            setIsAvailable(false)
          } else {
            setIsAvailable(data.available)
          }
          setIsChecking(false)
        })
        .catch(() => {
          setError('Failed to check availability')
          setIsChecking(false)
        })
    } else if (debouncedZeTag === currentZeTag) {
      setIsAvailable(null)
      setError(null)
    } else {
      setIsAvailable(null)
      setError(null)
    }
  }, [debouncedZeTag, currentZeTag])

  async function handleSave() {
    if (!zeTag || zeTag === currentZeTag) return

    setIsSaving(true)
    try {
      const res = await fetch('/api/user/profile/change-zetag', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ zeTag }),
      })

      if (res.ok) {
        toast.success('Username updated successfully')
        onSuccess()
        onClose()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update username')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/95 border-white/10 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Change Username</DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            Choose a unique username (3-20 characters: letters, numbers, and underscores only)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="zetag" className="text-white font-semibold">
              Username
            </Label>
            <Input
              id="zetag"
              placeholder="Enter your username"
              value={zeTag}
              onChange={(e) => setZeTag(e.target.value)}
              className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500/20 h-11 font-mono"
              maxLength={20}
            />
          </div>

          {/* Availability Status */}
          <div className="min-h-[32px] bg-black/60 rounded-lg p-3 border border-white/10">
            {isChecking && debouncedZeTag.length >= 3 && (
              <div className="flex items-center gap-2 text-gray-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Checking availability...</span>
              </div>
            )}
            {!isChecking && isAvailable === true && debouncedZeTag.length >= 3 && (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">This username is available!</span>
              </div>
            )}
            {!isChecking && isAvailable === false && debouncedZeTag.length >= 3 && (
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{error || 'This username is not available'}</span>
              </div>
            )}
            {debouncedZeTag.length > 0 && debouncedZeTag.length < 3 && (
              <div className="flex items-center gap-2 text-yellow-400">
                <span className="text-sm font-medium">Username must be at least 3 characters</span>
              </div>
            )}
            {!zeTag && (
              <div className="flex items-center gap-2 text-gray-500">
                <span className="text-sm">Enter a username to check availability</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-white/10 hover:bg-black/60 text-white h-11"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isAvailable || isSaving || zeTag === currentZeTag}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold h-11 shadow-lg shadow-red-500/20"
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
