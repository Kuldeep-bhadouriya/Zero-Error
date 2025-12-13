'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Upload, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useUploadThing } from '@/lib/uploadthing'

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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points: 100,
    category: 'General',
    difficulty: 'Easy',
    requiredProofType: 'image',
    maxFileSize: 50,
    instructions: '',
    exampleImageUrl: '',
    isTimeLimited: false,
    startDate: null as Date | null,
    endDate: null as Date | null,
    daysAvailable: 0,
    active: true,
    featured: false,
    maxCompletions: 0,
  })

  const [exampleImage, setExampleImage] = useState<File | null>(null)
  const [exampleImagePreview, setExampleImagePreview] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // UploadThing hook for example image uploads
  const { startUpload } = useUploadThing('missionExampleUploader')

  useEffect(() => {
    if (mission) {
      setFormData({
        name: mission.name || '',
        description: mission.description || '',
        points: mission.points || 100,
        category: mission.category || 'General',
        difficulty: mission.difficulty || 'Easy',
        requiredProofType: mission.requiredProofType || 'image',
        maxFileSize: mission.maxFileSize || 50,
        instructions: mission.instructions || '',
        exampleImageUrl: mission.exampleImageUrl || '',
        isTimeLimited: mission.isTimeLimited || false,
        startDate: mission.startDate ? new Date(mission.startDate) : null,
        endDate: mission.endDate ? new Date(mission.endDate) : null,
        daysAvailable: mission.daysAvailable || 0,
        active: mission.active ?? true,
        featured: mission.featured || false,
        maxCompletions: mission.maxCompletions || 0,
      })
      if (mission.exampleImageUrl) {
        setExampleImagePreview(mission.exampleImageUrl)
      }
    }
  }, [mission])

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
      console.error('Error uploading image:', err)
      throw err
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
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
            throw new Error('End date must be after start date')
          }
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

      setSuccess(`Mission ${mission ? 'updated' : 'created'} successfully!`)
      setTimeout(() => {
        onSuccess?.()
      }, 1500)
    } catch (err: any) {
      console.error('Mission form error:', err)
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 text-green-500">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
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
                onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
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
      <Card>
        <CardHeader>
          <CardTitle>Points & Limits</CardTitle>
          <CardDescription>Configure points awarded and completion limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="points">Points: {formData.points}</Label>
            <Slider
              id="points"
              min={10}
              max={10000}
              step={10}
              value={[formData.points]}
              onValueChange={([value]) => setFormData({ ...formData, points: value })}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Easy: 50-200 | Medium: 200-500 | Hard: 500+
            </p>
          </div>

          <div>
            <Label htmlFor="maxCompletions">Max Completions (0 = unlimited)</Label>
            <Input
              id="maxCompletions"
              type="number"
              min="0"
              value={formData.maxCompletions}
              onChange={(e) => setFormData({ ...formData, maxCompletions: parseInt(e.target.value) || 0 })}
              placeholder="0"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Limit total number of users who can complete this mission
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Proof Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Proof Requirements</CardTitle>
          <CardDescription>What type of proof users need to submit</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="requiredProofType">Proof Type</Label>
              <Select
                value={formData.requiredProofType}
                onValueChange={(value) => setFormData({ ...formData, requiredProofType: value })}
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
      <Card>
        <CardHeader>
          <CardTitle>Time Limits</CardTitle>
          <CardDescription>Set when this mission is available</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Time Limited Mission</Label>
              <p className="text-sm text-muted-foreground">
                Mission will only be available during specified dates
              </p>
            </div>
            <Switch
              checked={formData.isTimeLimited}
              onCheckedChange={(checked) => setFormData({ ...formData, isTimeLimited: checked })}
            />
          </div>

          {formData.isTimeLimited && (
            <div className="space-y-4 pl-4 border-l-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal bg-zinc-800 border-zinc-700 hover:bg-zinc-700',
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
                  <Label>End Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal bg-zinc-800 border-zinc-700 hover:bg-zinc-700',
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
                <Label htmlFor="daysAvailable">Or Days Available (from start date)</Label>
                <Input
                  id="daysAvailable"
                  type="number"
                  min="0"
                  value={formData.daysAvailable}
                  onChange={(e) => setFormData({ ...formData, daysAvailable: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Mission will auto-expire after this many days. Overrides end date.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
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
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={loading || uploading}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
        >
          {loading ? 'Saving...' : mission ? 'Update Mission' : 'Create Mission'}
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
    </form>
  )
}
