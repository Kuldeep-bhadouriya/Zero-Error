'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { useUploadThing } from '@/lib/uploadthing'

interface EventImageUploaderProps {
  eventId?: string
  currentImage?: string
  onImageUpload: (url: string) => void
}

function EventImageUploader({ eventId, currentImage, onImageUpload }: EventImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentImage || '')

  async function persistImage(url: string) {
    if (!eventId) {
      alert('Please save the event details before uploading an image.')
      return false
    }

    try {
      const response = await fetch('/api/admin/events/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, imageUrl: url }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to attach the image to this event')
      }

      return true
    } catch (error: any) {
      console.error('Error saving event image:', error)
      alert(error.message || 'Failed to link the uploaded image to this event')
      return false
    }
  }

  const { startUpload } = useUploadThing('eventImageUploader', {
    onClientUploadComplete: async (res) => {
      if (res && res[0]) {
        const uploadedUrl = res[0].url
        const saved = await persistImage(uploadedUrl)

        if (saved) {
          onImageUpload(uploadedUrl)
          setPreview(uploadedUrl)
          alert('Image uploaded successfully')
        } else {
          setPreview(currentImage || '')
        }
      }
      setUploading(false)
    },
    onUploadError: (error) => {
      console.error('Upload error:', error)
      alert(error.message || 'Failed to upload image')
      setPreview(currentImage || '')
      setUploading(false)
    },
  })

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!eventId) {
      alert('Please save the event details before uploading an image.')
      return
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Only JPG, PNG, and WebP are allowed.')
      return
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      alert('File too large. Maximum size is 10MB.')
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
    try {
      await startUpload([file], { eventId })
    } catch (error: any) {
      console.error('Upload error:', error)
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
            alt="Event banner preview"
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
          id="event-image"
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />
        <Label htmlFor="event-image">
          <Button
            type="button"
            variant="outline"
            disabled={uploading || !eventId}
            className="w-full bg-zinc-800 border-zinc-700 text-gray-300 hover:text-white hover:bg-zinc-700"
            onClick={() => document.getElementById('event-image')?.click()}
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
        {!eventId && (
          <p className="text-xs text-yellow-500 mt-1">
            Save the event to enable image uploads.
          </p>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Supported formats: JPG, PNG, WebP • Max size: 10MB
      </p>
    </div>
  )
}

export default EventImageUploader
