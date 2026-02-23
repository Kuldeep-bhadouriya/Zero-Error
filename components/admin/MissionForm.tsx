'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  CalendarIcon, Upload, X, AlertCircle, CheckCircle2, AlertTriangle,
  Clock, Target, FileImage, Star, Settings2, RotateCcw, Info, Layers, ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useUploadThing } from '@/lib/uploadthing'
import logger from '@/lib/browser-logger'

interface MissionFormProps {
  mission?: any
  onSuccess?: () => void
  onCancel?: () => void
}

const CATEGORIES = [
  'Social Media',
  'Gameplay',
  'Community',
  'Content Creation',
  'Tournament',
  'Event Participation',
  'General',
]

const DIFFICULTIES = [
  { value: 'Easy', label: 'Easy', color: 'bg-green-500' },
  { value: 'Medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'Hard', label: 'Hard', color: 'bg-red-500' },
]

export default function MissionForm({ mission, onSuccess, onCancel }: MissionFormProps) {
  const { toast } = useToast()
  
  // Initialize formData - if mission exists, use its data, otherwise use defaults
  const getInitialFormData = (missionData?: any) => {
    if (missionData) {
      return {
        name: missionData.name || '',
        description: missionData.description || '',
        points: missionData.points || 100,
        category: missionData.category || 'General',
        difficulty: (missionData.difficulty || 'Easy') as 'Easy' | 'Medium' | 'Hard',
        requiredProofType: (missionData.requiredProofType || 'image') as 'image' | 'video' | 'both',
        maxFileSize: missionData.maxFileSize || 50,
        instructions: missionData.instructions || '',
        exampleImageUrl: missionData.exampleImageUrl || '',
        isTimeLimited: missionData.isTimeLimited || false,
        startDate: missionData.startDate ? new Date(missionData.startDate) : null,
        endDate: missionData.endDate ? new Date(missionData.endDate) : null,
        daysAvailable: missionData.daysAvailable || 0,
        isHourlyScheduled: missionData.isHourlyScheduled || false,
        hourlySchedule: missionData.hourlySchedule || { startHour: 9, endHour: 17, timezone: 'UTC' },
        isWeeklyMission: missionData.isWeeklyMission || false,
        weeklyDay: missionData.weeklyDay !== undefined ? missionData.weeklyDay : 1, // Default to Monday
        active: missionData.active ?? true,
        featured: missionData.featured || false,
        maxCompletions: missionData.maxCompletions || 0,
      }
    }
    return {
      name: '',
      description: '',
      points: 100,
      category: 'General',
      difficulty: 'Easy' as 'Easy' | 'Medium' | 'Hard',
      requiredProofType: 'image' as 'image' | 'video' | 'both',
      maxFileSize: 50,
      instructions: '',
      exampleImageUrl: '',
      isTimeLimited: false,
      startDate: null as Date | null,
      endDate: null as Date | null,
      daysAvailable: 0,
      isHourlyScheduled: false,
      hourlySchedule: { startHour: 9, endHour: 17, timezone: 'UTC' },
      isWeeklyMission: false,
      weeklyDay: 1, // Default to Monday
      active: true,
      featured: false,
      maxCompletions: 0,
    }
  }
  
  // Initialize state with mission data if available
  const [formData, setFormData] = useState(() => getInitialFormData(mission))
  const [exampleImage, setExampleImage] = useState<File | null>(null)
  const [exampleImagePreview, setExampleImagePreview] = useState<string>(mission?.exampleImageUrl || '')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDateWarningDialog, setShowDateWarningDialog] = useState(false)
  const [dateWarningMessage, setDateWarningMessage] = useState('')

  // UploadThing hook for example image uploads
  const { startUpload } = useUploadThing('missionExampleUploader')

  // Effect to update form when mission prop changes (for when switching between missions)
  useEffect(() => {
    logger.info('MissionForm: useEffect triggered, mission:', mission?._id, mission?.name)
    
    if (mission) {
      // Editing mode: populate form with mission data
      const newFormData = getInitialFormData(mission)
      logger.info('MissionForm: Setting form data for editing:', newFormData)
      setFormData(newFormData)
      setExampleImagePreview(mission.exampleImageUrl || '')
      setExampleImage(null)
    } else {
      // Create mode: reset form to initial values
      logger.info('MissionForm: Resetting form for new mission')
      const emptyFormData = getInitialFormData()
      setFormData(emptyFormData)
      setExampleImagePreview('')
      setExampleImage(null)
    }
  }, [mission?._id])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setExampleImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setExampleImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  async function uploadExampleImage() {
    if (!exampleImage) return formData.exampleImageUrl

    setUploading(true)
    try {
      // Upload via UploadThing instead of S3
      const uploadedFiles = await startUpload([exampleImage], {
        missionId: mission?._id
      })

      if (!uploadedFiles || uploadedFiles.length === 0) {
        throw new Error('Failed to upload image')
      }

      return uploadedFiles[0].url
    } catch (err: any) {
      logger.error('Error uploading image:', err)
      throw err
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Client-side validation
      if (!formData.name.trim()) {
        throw new Error('Mission name is required')
      }
      if (!formData.description.trim()) {
        throw new Error('Mission description is required')
      }
      if (!formData.instructions.trim()) {
        throw new Error('Mission instructions are required')
      }
      if (formData.points <= 0) {
        throw new Error('Points must be greater than 0')
      }
      if (formData.isTimeLimited) {
        if (formData.startDate && formData.endDate) {
          if (new Date(formData.endDate) <= new Date(formData.startDate)) {
            setDateWarningMessage('End date must be after start date. Please adjust the dates.')
            setShowDateWarningDialog(true)
            setLoading(false)
            return
          }
        }
      }
      
      // Validate hourly schedule
      if (formData.isHourlyScheduled) {
        const { startHour, endHour } = formData.hourlySchedule
        if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
          throw new Error('Hours must be between 0 and 23')
        }
        // endHour is inclusive, so startHour=9 endHour=9 is a valid 1-hour window (9:00–9:59)
        if (endHour < startHour) {
          throw new Error('End hour cannot be before start hour')
        }
      }

      // Validate weekly mission fields
      if (formData.isWeeklyMission) {
        if (formData.weeklyDay === undefined || formData.weeklyDay === null || formData.weeklyDay < 0 || formData.weeklyDay > 6) {
          throw new Error('Please select a valid day of the week for the weekly mission')
        }
      }

      // Upload example image if selected
      let exampleImageUrl = formData.exampleImageUrl
      if (exampleImage) {
        try {
          exampleImageUrl = await uploadExampleImage()
        } catch (uploadError: any) {
          throw new Error(`Image upload failed: ${uploadError.message}`)
        }
      }

      const url = mission
        ? '/api/admin/missions/update'
        : '/api/admin/missions/create'

      const payload: any = {
        ...formData,
        exampleImageUrl,
        maxCompletions: formData.maxCompletions || undefined,
        daysAvailable: formData.daysAvailable || undefined,
      }

      if (mission) {
        payload.missionId = mission._id
      }

      const res = await fetch(url, {
        method: mission ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.error || `Failed to ${mission ? 'update' : 'create'} mission`)
      }

      toast({
        title: 'Success',
        description: `Mission ${mission ? 'updated' : 'created'} successfully!`,
      })
      setTimeout(() => {
        onSuccess?.()
      }, 1500)
    } catch (err: any) {
      logger.error('Mission form error:', err)
      toast({
        title: 'Error',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Scheduling feature summary badges */}
      {(formData.isTimeLimited || formData.isHourlyScheduled || formData.isWeeklyMission) && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-zinc-800/60 border border-zinc-700">
          <span className="text-xs text-zinc-400 self-center mr-1">Active constraints:</span>
          {formData.isTimeLimited && (
            <Badge variant="outline" className="border-purple-500/60 text-purple-300 bg-purple-500/10 flex items-center gap-1 text-xs">
              <CalendarIcon className="h-3 w-3" /> Date Range
            </Badge>
          )}
          {formData.isHourlyScheduled && (
            <Badge variant="outline" className="border-orange-500/60 text-orange-300 bg-orange-500/10 flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {formData.hourlySchedule.startHour.toString().padStart(2,'0')}:00–{formData.hourlySchedule.endHour.toString().padStart(2,'0')}:59 {formData.hourlySchedule.timezone}
            </Badge>
          )}
          {formData.isWeeklyMission && (
            <Badge variant="outline" className="border-green-500/60 text-green-300 bg-green-500/10 flex items-center gap-1 text-xs">
              <RotateCcw className="h-3 w-3" /> Weekly
            </Badge>
          )}
          {formData.isTimeLimited && formData.isHourlyScheduled && (
            <Badge variant="outline" className="border-indigo-500/60 text-indigo-300 bg-indigo-500/10 flex items-center gap-1 text-xs">
              <Layers className="h-3 w-3" /> Combined (AND)
            </Badge>
          )}
        </div>
      )}
      <Card className="border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-red-400" />
            Basic Information
          </CardTitle>
          <CardDescription>Mission name, description, and category</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Mission Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Follow us on Instagram"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Short Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Follow our Instagram page and submit a screenshot"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="instructions">Detailed Instructions *</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="1. Visit instagram.com/zeroerror_esports&#10;2. Click the Follow button&#10;3. Take a screenshot showing you're following&#10;4. Upload the screenshot as proof"
              rows={5}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value) => setFormData({ ...formData, difficulty: value as 'Easy' | 'Medium' | 'Hard' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((diff) => (
                    <SelectItem key={diff.value} value={diff.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn('h-2 w-2 rounded-full', diff.color)} />
                        {diff.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Points & Rewards */}
      <Card className="border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400" />
            Points & Limits
          </CardTitle>
          <CardDescription>Configure points awarded and completion limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="points">Points Awarded *</Label>
            <Input
              id="points"
              type="number"
              min="10"
              max="10000"
              step="10"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 100 })}
              placeholder="100"
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              Easy: 50-200 | Medium: 200-500 | Hard: 500+
            </p>
          </div>

          <div>
            <Label htmlFor="maxCompletions">Max Completions</Label>
            <Input
              id="maxCompletions"
              type="number"
              min="0"
              value={formData.maxCompletions}
              onChange={(e) => setFormData({ ...formData, maxCompletions: parseInt(e.target.value) || 0 })}
              placeholder="0 (unlimited)"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Set to 0 for unlimited completions, or specify a limit
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Proof Requirements */}
      <Card className="border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5 text-blue-400" />
            Proof Requirements
          </CardTitle>
          <CardDescription>What type of proof users need to submit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="requiredProofType">Proof Type</Label>
              <Select
                value={formData.requiredProofType}
                onValueChange={(value) => setFormData({ ...formData, requiredProofType: value as 'image' | 'video' | 'both' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image Only</SelectItem>
                  <SelectItem value="video">Video Only</SelectItem>
                  <SelectItem value="both">Image or Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="maxFileSize">Max File Size (MB)</Label>
              <Input
                id="maxFileSize"
                type="number"
                min="1"
                max="100"
                value={formData.maxFileSize}
                onChange={(e) => setFormData({ ...formData, maxFileSize: parseInt(e.target.value) || 50 })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="exampleImage">Example Proof Image (Optional)</Label>
            <div className="mt-2 space-y-2">
              {exampleImagePreview && (
                <div className="relative w-full max-w-md">
                  <img
                    src={exampleImagePreview}
                    alt="Example"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setExampleImage(null)
                      setExampleImagePreview('')
                      setFormData({ ...formData, exampleImageUrl: '' })
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Input
                id="exampleImage"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageSelect}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Limits */}
      <Card className="border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-purple-400" />
            Date Range (Time Limit)
          </CardTitle>
          <CardDescription>Restrict this mission to a specific date window</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Date-Range Limit</Label>
              <p className="text-sm text-muted-foreground">
                Mission will only be available between the chosen dates
              </p>
            </div>
            <Switch
              checked={formData.isTimeLimited}
              onCheckedChange={(checked) => setFormData({ ...formData, isTimeLimited: checked })}
            />
          </div>

          {formData.isTimeLimited && (
            <div className="space-y-4 pl-4 border-l-2 border-purple-500/40">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date <span className="text-zinc-500 font-normal">(optional)</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal bg-zinc-800 border-zinc-700 hover:bg-zinc-700 mt-1.5',
                          !formData.startDate ? 'text-gray-400' : 'text-white'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(formData.startDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate || undefined}
                        onSelect={(date) => setFormData({ ...formData, startDate: date || null })}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>End Date <span className="text-zinc-500 font-normal">(optional)</span></Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal bg-zinc-800 border-zinc-700 hover:bg-zinc-700 mt-1.5',
                          !formData.endDate ? 'text-gray-400' : 'text-white'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(formData.endDate, 'PPP') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate || undefined}
                        onSelect={(date) => setFormData({ ...formData, endDate: date || null })}
                        disabled={(date) =>
                          formData.startDate ? date < formData.startDate : false
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div>
                <Label htmlFor="daysAvailable">
                  Or specify duration in days{' '}
                  <span className="text-zinc-500 font-normal">(from start date)</span>
                </Label>
                <Input
                  id="daysAvailable"
                  type="number"
                  min="0"
                  value={formData.daysAvailable}
                  onChange={(e) => setFormData({ ...formData, daysAvailable: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-1.5"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  If set, auto-calculates the end date. Overrides the end date picker above.
                </p>
              </div>

              {formData.isHourlyScheduled && (
                <div className="flex items-start gap-2 rounded-md bg-purple-500/10 border border-purple-500/30 p-3">
                  <Layers className="h-4 w-4 text-purple-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-purple-200">
                    <span className="font-medium">Works with Hourly Schedule</span> — users will only see this mission within the date range <span className="font-medium">and</span> during the active hours defined below.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hourly Schedule */}
      <Card className="border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-400" />
            Hourly Schedule
          </CardTitle>
          <CardDescription>Limit this mission to specific hours of the day</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Hourly Schedule</Label>
              <p className="text-sm text-muted-foreground">
                Mission will only appear during the specified hours each day
              </p>
            </div>
            <Switch
              checked={formData.isHourlyScheduled}
              onCheckedChange={(checked) => setFormData({ ...formData, isHourlyScheduled: checked })}
            />
          </div>

          {formData.isHourlyScheduled && (
            <div className="space-y-5 pl-4 border-l-2 border-orange-500/40">
              {/* Hour inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startHour">
                    Start Hour{' '}
                    <span className="text-zinc-500 font-normal">(0–23, 24h)</span>
                  </Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Select
                      value={formData.hourlySchedule.startHour.toString()}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          hourlySchedule: {
                            ...formData.hourlySchedule,
                            startHour: parseInt(value),
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[280px]">
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {i.toString().padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="endHour">
                    End Hour{' '}
                    <span className="text-zinc-500 font-normal">(0–23, inclusive)</span>
                  </Label>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Select
                      value={formData.hourlySchedule.endHour.toString()}
                      onValueChange={(value) =>
                        setFormData({
                          ...formData,
                          hourlySchedule: {
                            ...formData.hourlySchedule,
                            endHour: parseInt(value),
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[280px]">
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem
                            key={i}
                            value={i.toString()}
                            disabled={i < formData.hourlySchedule.startHour}
                          >
                            {i.toString().padStart(2, '0')}:00
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {formData.hourlySchedule.endHour < formData.hourlySchedule.startHour && (
                    <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> End hour must be ≥ start hour
                    </p>
                  )}
                </div>
              </div>

              {/* Timezone */}
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.hourlySchedule.timezone}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      hourlySchedule: {
                        ...formData.hourlySchedule,
                        timezone: value,
                      },
                    })
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                    <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                    <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                    <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                    <SelectItem value="Europe/Paris">Paris (CET/CEST)</SelectItem>
                    <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                    <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                    <SelectItem value="Asia/Shanghai">China (CST)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Japan (JST)</SelectItem>
                    <SelectItem value="Australia/Sydney">Sydney (AEDT/AEST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Visual 24-hour timeline bar */}
              {formData.hourlySchedule.endHour >= formData.hourlySchedule.startHour && (
                <div className="space-y-2">
                  <Label className="text-xs text-zinc-400 uppercase tracking-wider">Daily Active Window</Label>
                  <div className="relative h-7 w-full rounded-md overflow-hidden bg-zinc-800 border border-zinc-700">
                    {/* Active segment */}
                    <div
                      className="absolute top-0 h-full bg-orange-500/70 border-r border-l border-orange-400/60 flex items-center justify-center"
                      style={{
                        left: `${(formData.hourlySchedule.startHour / 24) * 100}%`,
                        width: `${((formData.hourlySchedule.endHour - formData.hourlySchedule.startHour + 1) / 24) * 100}%`,
                      }}
                    >
                      <span className="text-[10px] font-semibold text-white drop-shadow px-1 truncate">
                        {formData.hourlySchedule.startHour.toString().padStart(2, '0')}:00 –{' '}
                        {formData.hourlySchedule.endHour.toString().padStart(2, '0')}:59
                      </span>
                    </div>
                  </div>
                  {/* Hour markers */}
                  <div className="flex justify-between text-[10px] text-zinc-600 px-0.5">
                    {[0, 6, 12, 18, 23].map((h) => (
                      <span key={h}>{h.toString().padStart(2, '0')}h</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Active window summary */}
              <div className="rounded-md bg-orange-500/10 border border-orange-500/30 p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-400 shrink-0" />
                  <p className="text-sm font-medium text-orange-200">Active each day:</p>
                </div>
                <p className="text-sm text-orange-300/80 pl-6">
                  {formData.hourlySchedule.startHour.toString().padStart(2, '0')}:00 –{' '}
                  {formData.hourlySchedule.endHour.toString().padStart(2, '0')}:59{' '}
                  <span className="font-medium">{formData.hourlySchedule.timezone}</span>
                  {' '}
                  <span className="text-orange-400/60">
                    ({formData.hourlySchedule.endHour - formData.hourlySchedule.startHour + 1}{' '}
                    hour{formData.hourlySchedule.endHour - formData.hourlySchedule.startHour + 1 !== 1 ? 's' : ''} per day)
                  </span>
                </p>
                <p className="text-xs text-orange-400/60 pl-6">
                  End hour is <strong>inclusive</strong> — the mission is active throughout the end hour (e.g. 17:00 means active until 17:59).
                </p>
              </div>

              {/* Combined hint when time limit is also active */}
              {formData.isTimeLimited && (
                <div className="flex items-start gap-2 rounded-md bg-indigo-500/10 border border-indigo-500/30 p-3">
                  <Layers className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                  <div className="text-sm text-indigo-200 space-y-0.5">
                    <p className="font-medium">Combined Schedule Active</p>
                    <p className="text-indigo-300/80">
                      Both conditions must be met:{' '}
                      {formData.startDate && (
                        <span>from <strong>{format(formData.startDate, 'PPP')}</strong></span>
                      )}
                      {formData.endDate && (
                        <span> to <strong>{format(formData.endDate, 'PPP')}</strong></span>
                      )}
                      {(!formData.startDate && !formData.endDate) && (
                        <span>within the configured date range</span>
                      )}
                      {' '}<span className="text-indigo-400">AND</span>{' '}
                      between{' '}
                      <strong>
                        {formData.hourlySchedule.startHour.toString().padStart(2, '0')}:00 –{' '}
                        {formData.hourlySchedule.endHour.toString().padStart(2, '0')}:59{' '}
                        {formData.hourlySchedule.timezone}
                      </strong>{' '}
                      each day.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Repeating Mission */}
      <Card className="border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-green-400" />
            Weekly Repeating Mission
          </CardTitle>
          <CardDescription>Set this mission to repeat every week on a specific day</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Repeating Mission</Label>
              <p className="text-sm text-muted-foreground">
                Mission will automatically reset and reappear every week
              </p>
            </div>
            <Switch
              checked={formData.isWeeklyMission}
              onCheckedChange={(checked) => setFormData({ ...formData, isWeeklyMission: checked })}
            />
          </div>

          {formData.isWeeklyMission && (
            <div className="space-y-4 pl-4 border-l-2">
              <div>
                <Label htmlFor="weeklyDay">Day of Week</Label>
                <Select
                  value={formData.weeklyDay.toString()}
                  onValueChange={(value) => setFormData({ ...formData, weeklyDay: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Sunday</SelectItem>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5" />
                  <div className="text-sm text-green-200">
                    <p className="font-medium">Weekly Mission Info</p>
                    <p className="text-green-300/80 mt-1">
                      Users who complete this mission will see it again next week on the same day. Users who don't complete it will continue to see it until they do.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status */}
      <Card className="border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-zinc-400" />
            Status
          </CardTitle>
          <CardDescription>Control mission visibility and features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Active</Label>
              <p className="text-sm text-muted-foreground">
                Mission is visible to users
              </p>
            </div>
            <Switch
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Featured</Label>
              <p className="text-sm text-muted-foreground">
                Show mission at the top of the list
              </p>
            </div>
            <Switch
              checked={formData.featured}
              onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {uploading && (
          <div className="flex items-center gap-2 text-sm text-orange-300 bg-orange-500/10 border border-orange-500/30 rounded-md px-3 py-2">
            <Upload className="h-4 w-4 animate-pulse" />
            Uploading example image…
          </div>
        )}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={loading || uploading}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold"
          >
            {loading
              ? (mission ? 'Updating…' : 'Creating…')
              : (mission ? 'Update Mission' : 'Create Mission')}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading || uploading}
              className="bg-zinc-800 border-zinc-700 text-gray-300 hover:text-white hover:bg-zinc-700"
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Date Validation Dialog */}
      <Dialog open={showDateWarningDialog} onOpenChange={setShowDateWarningDialog}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Date Validation Error
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              {dateWarningMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowDateWarningDialog(false)}
              className="bg-red-600 hover:bg-red-700"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  )
}
