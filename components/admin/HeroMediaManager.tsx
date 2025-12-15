"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { UploadButton } from "@/lib/uploadthing"
import { Loader2, Upload, Video, Image as ImageIcon, Check, X, Undo2, AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Default media URLs
const DEFAULT_HERO_VIDEO = "/images/background.mp4"
const DEFAULT_HERO_POSTER = "/images/hero-background.jpg"

interface HeroSettings {
  heroVideoUrl: string
  heroPosterUrl: string
  previousHeroVideoUrl?: string
  previousHeroPosterUrl?: string
  updatedAt?: string
  updatedBy?: string
}

export default function HeroMediaManager() {
  const [settings, setSettings] = useState<HeroSettings>({
    heroVideoUrl: "",
    heroPosterUrl: "",
    previousHeroVideoUrl: "",
    previousHeroPosterUrl: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [videoUploading, setVideoUploading] = useState(false)
  const [posterUploading, setPosterUploading] = useState(false)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch current settings on mount
  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/marketing/hero")
      
      if (!response.ok) {
        throw new Error("Failed to fetch settings")
      }

      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error("Error fetching settings:", error)
      toast({
        title: "Error",
        description: "Failed to load hero media settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)

      const response = await fetch("/api/admin/marketing/hero", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          heroVideoUrl: settings.heroVideoUrl,
          heroPosterUrl: settings.heroPosterUrl,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save settings")
      }

      const data = await response.json()
      setSettings(data)

      toast({
        title: "Success",
        description: "Hero media settings updated successfully",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save hero media settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  function handleClearVideo() {
    setSettings((prev) => ({ ...prev, heroVideoUrl: "" }))
    setVideoPreview(null)
  }

  function handleClearPoster() {
    setSettings((prev) => ({ ...prev, heroPosterUrl: "" }))
  }

  function handleUndoVideo() {
    if (settings.previousHeroVideoUrl) {
      setSettings((prev) => ({
        ...prev,
        heroVideoUrl: prev.previousHeroVideoUrl || "",
      }))
      setVideoPreview(settings.previousHeroVideoUrl)
      toast({
        title: "Video Restored",
        description: "Previous hero video has been restored",
      })
    }
  }

  function handleUndoPoster() {
    if (settings.previousHeroPosterUrl) {
      setSettings((prev) => ({
        ...prev,
        heroPosterUrl: prev.previousHeroPosterUrl || "",
      }))
      toast({
        title: "Poster Restored",
        description: "Previous hero poster has been restored",
      })
    }
  }

  function validateVideoFile(file: File): string | null {
    // Check file type
    const allowedTypes = ['video/mp4', 'video/webm']
    if (!allowedTypes.includes(file.type)) {
      return 'Invalid file type. Only MP4 and WebM are allowed.'
    }

    // Check file size (100MB)
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      return 'Video file too large. Maximum size is 100MB.'
    }

    return null
  }

  if (loading) {
    return (
      <Card className="bg-zinc-900/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Hero Media Manager</CardTitle>
          <CardDescription className="text-gray-400">Manage home page hero video and fallback image</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-red-500" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-700">
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-lg sm:text-xl text-white">Hero Media Manager</CardTitle>
        <CardDescription className="text-xs sm:text-sm text-gray-400">
          Manage home page hero video and fallback image. Changes will appear immediately after saving.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6 pb-4 sm:pb-6">
        {/* Hero Video Section */}
        <div className="space-y-3">
          <Label htmlFor="heroVideo" className="flex items-center gap-2 text-gray-300">
            <Video className="h-4 w-4" />
            Hero Video (Desktop)
          </Label>
          
          <Alert className="bg-zinc-800/50 border-zinc-700">
            <AlertCircle className="h-4 w-4 text-gray-400" />
            <AlertDescription className="text-gray-400">
              Recommended: MP4 or WebM format, max 100MB, 1920x1080 resolution
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Input
              id="heroVideo"
              type="url"
              placeholder="https://utfs.io/..."
              value={settings.heroVideoUrl}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, heroVideoUrl: e.target.value }))
              }
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
            />
            
            <div className="flex flex-col sm:flex-row gap-2">
              <UploadButton
                endpoint="heroMediaUploader"
                onClientUploadComplete={(res: any) => {
                  if (res?.[0]?.url) {
                    setSettings((prev) => ({ ...prev, heroVideoUrl: res[0].url }))
                    setVideoPreview(res[0].url)
                    toast({
                      title: "Upload Complete",
                      description: "Video uploaded successfully",
                    })
                  }
                  setVideoUploading(false)
                }}
                onUploadError={(error: Error) => {
                  toast({
                    title: "Upload Failed",
                    description: error.message,
                    variant: "destructive",
                  })
                  setVideoUploading(false)
                }}
                onUploadBegin={() => {
                  setVideoUploading(true)
                }}
                appearance={{
                  button: "bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium",
                  allowedContent: "text-xs text-muted-foreground",
                }}
                content={{
                  button: videoUploading ? "Uploading..." : "Upload Video",
                  allowedContent: "MP4, WebM (max 128MB)",
                }}
              />
              
              {settings.heroVideoUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearVideo}
                  className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}

              {settings.previousHeroVideoUrl && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleUndoVideo}
                  className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                >
                  <Undo2 className="h-4 w-4 mr-1" />
                  Undo to Previous
                </Button>
              )}
            </div>

            {/* Current Video Preview */}
            <div className="mt-2">
              <p className="text-sm text-gray-400 mb-2">
                {settings.heroVideoUrl ? "Current Video:" : "Default Video (will be used):"}
              </p>
              <video
                src={videoPreview || settings.heroVideoUrl || DEFAULT_HERO_VIDEO}
                controls
                className="w-full max-w-md rounded-md border border-zinc-700"
                style={{ maxHeight: "200px" }}
              />
              {!settings.heroVideoUrl && (
                <Alert className="bg-blue-900/20 border-blue-700 mt-2">
                  <Info className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-400 text-xs">
                    This is the default hero video. Upload a custom video to replace it.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {settings.previousHeroVideoUrl && (
              <div className="mt-2">
                <p className="text-sm text-gray-400 mb-2">Previous Video:</p>
                <video
                  src={settings.previousHeroVideoUrl}
                  controls
                  className="w-full max-w-md rounded-md border border-zinc-700 opacity-60"
                  style={{ maxHeight: "150px" }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Hero Poster Section */}
        <div className="space-y-3">
          <Label htmlFor="heroPoster" className="flex items-center gap-2 text-gray-300">
            <ImageIcon className="h-4 w-4" />
            Hero Poster Image (Mobile Fallback)
          </Label>
          
          <Alert className="bg-zinc-800/50 border-zinc-700">
            <AlertCircle className="h-4 w-4 text-gray-400" />
            <AlertDescription className="text-gray-400">
              Recommended: JPG or PNG format, 1920x1080 resolution
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Input
              id="heroPoster"
              type="url"
              placeholder="https://utfs.io/..."
              value={settings.heroPosterUrl}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, heroPosterUrl: e.target.value }))
              }
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
            />
            
            <div className="flex flex-col sm:flex-row gap-2">
              <UploadButton
                endpoint="heroMediaUploader"
                onClientUploadComplete={(res: any) => {
                  if (res?.[0]?.url) {
                    setSettings((prev) => ({ ...prev, heroPosterUrl: res[0].url }))
                    toast({
                      title: "Upload Complete",
                      description: "Poster image uploaded successfully",
                    })
                  }
                  setPosterUploading(false)
                }}
                onUploadError={(error: Error) => {
                  toast({
                    title: "Upload Failed",
                    description: error.message,
                    variant: "destructive",
                  })
                  setPosterUploading(false)
                }}
                onUploadBegin={() => {
                  setPosterUploading(true)
                }}
                appearance={{
                  button: "bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium",
                  allowedContent: "text-xs text-muted-foreground",
                }}
                content={{
                  button: posterUploading ? "Uploading..." : "Upload Image",
                  allowedContent: "JPG, PNG (max 16MB)",
                }}
              />
              
              {settings.heroPosterUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearPoster}
                  className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}

              {settings.previousHeroPosterUrl && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleUndoPoster}
                  className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                >
                  <Undo2 className="h-4 w-4 mr-1" />
                  Undo to Previous
                </Button>
              )}
            </div>

            {/* Current Poster Preview */}
            <div className="mt-2">
              <p className="text-sm text-gray-400 mb-2">
                {settings.heroPosterUrl ? "Current Poster:" : "Default Poster (will be used):"}
              </p>
              <img
                src={settings.heroPosterUrl || DEFAULT_HERO_POSTER}
                alt="Hero poster preview"
                className="w-full max-w-md rounded-md border border-zinc-700"
                style={{ maxHeight: "200px", objectFit: "cover" }}
              />
              {!settings.heroPosterUrl && (
                <Alert className="bg-blue-900/20 border-blue-700 mt-2">
                  <Info className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-400 text-xs">
                    This is the default poster image. Upload a custom image to replace it.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {settings.previousHeroPosterUrl && (
              <div className="mt-2">
                <p className="text-sm text-gray-400 mb-2">Previous Poster:</p>
                <img
                  src={settings.previousHeroPosterUrl}
                  alt="Previous hero poster"
                  className="w-full max-w-md rounded-md border border-zinc-700 opacity-60"
                  style={{ maxHeight: "150px", objectFit: "cover" }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-zinc-700">
          <Button
            onClick={handleSave}
            disabled={saving || videoUploading || posterUploading}
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {/* Last Updated Info */}
        {settings.updatedAt && (
          <div className="text-xs text-gray-400 pt-2 border-t border-zinc-700">
            Last updated: {new Date(settings.updatedAt).toLocaleString()}
            {settings.updatedBy && ` by ${settings.updatedBy}`}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
