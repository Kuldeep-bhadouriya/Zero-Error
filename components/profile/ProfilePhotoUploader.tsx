'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Upload, Loader2 } from 'lucide-react'
import { useUploadThing } from '@/lib/uploadthing'

interface ProfilePhotoUploaderProps {
  isOpen: boolean
  onClose: () => void
  currentPhotoUrl: string
  onSuccess: () => void
}

export function ProfilePhotoUploader({
  isOpen,
  onClose,
  currentPhotoUrl,
  onSuccess,
}: ProfilePhotoUploaderProps) {
  const router = useRouter()
  const { update } = useSession()
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { startUpload, isUploading } = useUploadThing('profilePhotoUploader', {
    onClientUploadComplete: async (res) => {
      toast.success('Profile photo updated successfully')
      setPreview(null)
      setSelectedFile(null)
      onClose()
      
      // Update the session with the new profile photo
      await update()
      
      // Refresh the page to update all components
      router.refresh()
      onSuccess()
    },
    onUploadError: (error) => {
      toast.error(error.message || 'Failed to upload photo')
    },
  })

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPG, PNG, and WebP are allowed')
      return
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB')
      return
    }

    setSelectedFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleUpload() {
    if (!selectedFile) return

    try {
      await startUpload([selectedFile])
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    }
  }

  function handleClose() {
    if (!isUploading) {
      setPreview(null)
      setSelectedFile(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gradient-to-br from-zinc-950 to-black border border-white/10 text-white shadow-2xl rounded-2xl max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">Update Profile Photo</DialogTitle>
          <DialogDescription className="text-gray-400 text-sm mt-2">
            Upload a new profile photo (max 5MB • JPG, PNG, or WebP)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border-2 border-red-500/40 shadow-xl shadow-red-500/20 bg-black/60">
              <Image
                src={preview || currentPhotoUrl}
                alt="Profile preview"
                fill
                className="object-cover"
                priority
              />
              {preview && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                  <span className="text-xs text-white/80 font-medium">Preview</span>
                </div>
              )}
            </div>
          </div>

          {/* File Info */}
          {selectedFile && (
            <div className="bg-black/40 border border-white/10 rounded-xl p-3 backdrop-blur-sm">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Selected file:</span>
                <span className="text-white font-medium truncate ml-2 max-w-[200px]">{selectedFile.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-400">File size:</span>
                <span className="text-white font-medium">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            </div>
          )}

          {/* File Input */}
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            id="photo-upload-input"
          />

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            {!selectedFile ? (
              <Button
                onClick={() => document.getElementById('photo-upload-input')?.click()}
                variant="outline"
                className="w-full border-white/20 hover:bg-white/5 text-white h-11 rounded-xl font-medium transition-all"
                disabled={isUploading}
              >
                <Upload className="mr-2 h-5 w-5" />
                Choose Photo
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 border-white/20 hover:bg-white/5 text-white h-11 rounded-xl font-medium transition-all"
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold h-11 shadow-lg shadow-red-500/30 rounded-xl transition-all hover:shadow-red-500/50 disabled:opacity-50"
                >
                  {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isUploading ? 'Uploading...' : 'Upload Photo'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
