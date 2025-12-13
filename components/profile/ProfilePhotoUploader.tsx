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
      <DialogContent className="bg-black/95 border-white/10 text-white shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Update Profile Photo</DialogTitle>
          <DialogDescription className="text-gray-400 text-sm">
            Upload a new profile photo (max 5MB, JPG/PNG/WebP)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preview */}
          <div className="flex justify-center">
            <div className="relative w-56 h-56 rounded-2xl overflow-hidden border-4 border-red-500 shadow-lg shadow-red-500/20 bg-black/80">
              <Image
                src={preview || currentPhotoUrl}
                alt="Profile preview"
                fill
                className="object-cover"
              />
            </div>
          </div>

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
            <Button
              onClick={() => document.getElementById('photo-upload-input')?.click()}
              variant="outline"
              className="w-full border-white/10 hover:bg-black/60 text-white h-11"
              disabled={isUploading}
            >
              <Upload className="mr-2 h-5 w-5" />
              Choose Photo
            </Button>

            {selectedFile && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 border-white/10 hover:bg-black/60 text-white h-11"
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold h-11 shadow-lg shadow-red-500/20"
                >
                  {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Upload Photo
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
