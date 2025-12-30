'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Upload, FileVideo, X, CheckCircle2, Target, Loader2, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useUploadThing } from '@/lib/uploadthing'

interface Mission {
  _id: string
  name: string
  description?: string
  points: number
  category?: string
  difficulty?: string
  isTimeLimited?: boolean
  daysRemaining?: number | null
  isAvailable?: boolean
  isCompleted?: boolean
  isPending?: boolean
}

/**
 * MissionUploader Component
 * Allows users to upload proof for completed missions.
 * Handles file validation, UploadThing upload, and submission tracking.
 */
export default function MissionUploader() {
  const [missions, setMissions] = useState<Mission[]>([])
  const [selectedMission, setSelectedMission] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const router = useRouter()

  // UploadThing hook
  const { startUpload } = useUploadThing("missionProofUploader")

  useEffect(() => {
    // Fetch available missions on component mount
    async function fetchMissions() {
      try {
        const response = await fetch('/api/ze-club/missions')
        if (response.ok) {
          const fetchedMissions = await response.json()
          // Only show missions that are available (not completed or pending)
          const availableMissions = fetchedMissions.filter(
            (m: Mission) => !m.isCompleted && !m.isPending
          )
          setMissions(availableMissions)
        } else {
          console.error('Failed to fetch missions')
        }
      } catch (error) {
        console.error('Error fetching missions:', error)
      }
    }
    fetchMissions()
  }, [])

  useEffect(() => {
    // Cleanup preview URL
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview)
      }
    }
  }, [preview])

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return

    // Validate file size (64MB for UploadThing free tier)
    if (selectedFile.size > 64 * 1024 * 1024) {
      alert('File size must be less than 64MB')
      return
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'video/mp4']
    if (!validTypes.includes(selectedFile.type)) {
      alert('Only JPG, PNG, and MP4 files are allowed')
      return
    }

    setFile(selectedFile)
    setUploadSuccess(false)

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    
    // Validate form inputs
    if (!file || !selectedMission) {
      alert('Please select a mission and a file.')
      return
    }

    setIsUploading(true)

    try {
      // Step 1: Upload file to UploadThing
      const uploadedFiles = await startUpload([file])
      
      if (!uploadedFiles || uploadedFiles.length === 0) {
        throw new Error('File upload failed')
      }

      const fileUrl = uploadedFiles[0].url

      // Step 2: Save submission to database
      const response = await fetch('/api/ze-club/missions/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          missionId: selectedMission,
          fileUrl: fileUrl,
        }),
      })

      if (response.ok) {
        setUploadSuccess(true)
        setTimeout(() => {
          // Reset form state
          setSelectedMission('')
          setFile(null)
          setPreview(null)
          setUploadSuccess(false)
          // Refresh the page to show the new submission
          router.refresh()
        }, 2000)
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Submission failed'
        alert(errorMessage)
        
        // If mission is already completed/pending, remove it from the list
        if (errorMessage.includes('already')) {
          setMissions(prev => prev.filter(m => m._id !== selectedMission))
          setSelectedMission('')
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('An unexpected error occurred during upload.')
    } finally {
      setIsUploading(false)
    }
  }

  const selectedMissionData = missions.find(m => m._id === selectedMission)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-gradient-to-br from-black/90 to-black/80 border-white/10 backdrop-blur-xl text-white">
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-600">
              <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl text-white">Submit Mission Proof</CardTitle>
              <CardDescription className="text-xs sm:text-sm text-gray-400">
                Upload your proof to earn points
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Mission Selection */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Label htmlFor="mission" className="text-white text-sm sm:text-base mb-2 block">
                Select Mission
              </Label>
              {missions.length === 0 ? (
                <Alert className="bg-blue-500/10 border-blue-500/30">
                  <AlertCircle className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-200 text-sm">
                    No missions available. You may have completed all current missions or have pending submissions.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select
                  value={selectedMission}
                  onValueChange={setSelectedMission}
                  required
                >
                  <SelectTrigger id="mission" className="bg-black/60 border-white/10 text-white">
                    <SelectValue placeholder="Choose a mission to complete" />
                  </SelectTrigger>
                  <SelectContent>
                    {missions.map((mission) => (
                      <SelectItem key={mission._id} value={mission._id}>
                        <div className="flex items-center justify-between w-full gap-4">
                          <span>{mission.name}</span>
                          <Badge variant="secondary" className="bg-red-600/20 text-red-400">
                            {mission.points} pts
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {selectedMissionData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30"
                >
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-300">Mission Details</p>
                      {selectedMissionData.description && (
                        <p className="text-xs text-gray-400 mt-1">{selectedMissionData.description}</p>
                      )}
                      <p className="text-sm text-blue-400 mt-2 font-semibold">
                        Reward: {selectedMissionData.points} points
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* File Upload */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Label className="text-white text-sm sm:text-base mb-2 block">
                Upload Proof
              </Label>
              <div
                className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 md:p-8 transition-all ${
                  dragActive
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-white/10 hover:border-red-400 bg-black/30'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  id="file"
                  type="file"
                  accept="image/jpeg,image/png,video/mp4"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileChange(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
                {!file ? (
                  <div className="text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 mb-2">
                      <span className="font-semibold text-red-400">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      JPG, PNG, or MP4 (max 64MB)
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -top-4 -right-4 z-20 bg-red-600 hover:bg-red-700 text-white rounded-full"
                      onClick={() => {
                        setFile(null)
                        setPreview(null)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    
                    {preview ? (
                      <div className="relative rounded-lg overflow-hidden">
                        <img
                          src={preview}
                          alt="Preview"
                          className="max-h-64 mx-auto rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 p-4 bg-black/60 rounded-lg">
                        <FileVideo className="h-10 w-10 text-purple-400" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{file.name}</p>
                          <p className="text-xs text-gray-400">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Info Alert */}
            <Alert className="bg-yellow-500/10 border-yellow-500/30">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-200 text-sm">
                Make sure your proof clearly shows completion of the mission. Submissions are reviewed by admins.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Button 
                type="submit" 
                disabled={isUploading || !file || !selectedMission}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold py-4 sm:py-6 text-base sm:text-lg shadow-lg hover:shadow-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Uploading...
                  </span>
                ) : uploadSuccess ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Submitted Successfully!
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Submit Mission
                  </span>
                )}
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
