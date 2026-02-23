'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { useUploadThing } from '@/lib/uploadthing'
import logger from '@/lib/browser-logger'

interface RewardImageUploaderProps {
  rewardId?: string
  currentImage?: string
  onImageUpload: (url: string) => void
}

function RewardImageUploader({ rewardId, currentImage, onImageUpload }: RewardImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentImage || '')

  const { startUpload } = useUploadThing('rewardImageUploader', {
    onClientUploadComplete: async (res) => {
      if (res && res[0]) {
        const uploadedUrl = res[0].url
        logger.info('✅ Upload complete! URL:', uploadedUrl, 'RewardID:', rewardId)
        // Update parent component's state
        onImageUpload(uploadedUrl)
        setPreview(uploadedUrl)
        alert('✅ Image uploaded and saved successfully!')
      }
      setUploading(false)
    },
    onUploadError: (error) => {
      logger.error('❌ Upload error:', error)
      alert('❌ ' + (error.message || 'Failed to upload image'))
      setPreview(currentImage || '')
      setUploading(false)
    },
  })

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!rewardId) {
      alert('Please save the reward details before uploading an image.')
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPG, PNG, and WebP are allowed.')
      return
    }

    // Validate file size (4MB)
    const maxSize = 4 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File too large. Maximum size is 4MB.')
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload via UploadThing
    setUploading(true)
    logger.info('🚀 Starting upload for rewardId:', rewardId)
    try {
      await startUpload([file], { rewardId })
    } catch (error: any) {
      logger.error('Upload error:', error)
      alert(error.message || 'Failed to upload image')
      setPreview(currentImage || '')
      setUploading(false)
    }
  }

  function handleRemove() {
    setPreview('')
    onImageUpload('')
  }

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Reward image preview"
            className="w-full h-48 object-cover rounded-lg border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No image uploaded yet
          </p>
        </div>
      )}

      <div>
        <Input
          id="reward-image"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
        <Label htmlFor="reward-image">
          <Button
            type="button"
            variant="outline"
            disabled={uploading || !rewardId}
            className="w-full bg-zinc-800 border-zinc-700 text-gray-300 hover:text-white hover:bg-zinc-700"
            onClick={() => document.getElementById('reward-image')?.click()}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {preview ? 'Replace Image' : 'Upload Image'}
              </>
            )}
          </Button>
        </Label>
        {!rewardId && (
          <p className="text-xs text-yellow-500 mt-1">
            Save the reward to enable image uploads.
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Supported formats: JPG, PNG, WebP • Max size: 4MB
      </p>
    </div>
  )
}

export default RewardImageUploader
