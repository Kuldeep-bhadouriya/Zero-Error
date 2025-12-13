'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon, Upload, X, Loader2 } from 'lucide-react'
import EventImageUploader from './EventImageUploader'

interface EventFormData {
  title: string
  description: string
  eventDate: Date
  eventType: 'upcoming' | 'past'
  imageUrl?: string
  location?: string
  registrationLink?: string
  featured: boolean
  games: string[]
  organizer: string
  maxParticipants?: number
  status: 'draft' | 'published' | 'cancelled'
}

interface EventFormProps {
  event?: any
  onSuccess: () => void
  onCancel: () => void
}

const GAME_OPTIONS = [
  'Valorant',
  'BGMI',
  'Free Fire',
  'Call of Duty Mobile',
  'CS:GO',
  'League of Legends',
  'Dota 2',
  'Apex Legends',
  'Fortnite',
  'Other',
]

function EventForm({ event, onSuccess, onCancel }: EventFormProps) {
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState(event?.imageUrl || '')
  const [selectedGames, setSelectedGames] = useState<string[]>(event?.games || [])
  const [eventDate, setEventDate] = useState<Date | undefined>(
    event?.eventDate ? new Date(event.eventDate) : undefined
  )
  const [savedEventId, setSavedEventId] = useState(event?._id || null)

  // Sync imageUrl when event prop changes
  useEffect(() => {
    if (event?.imageUrl) {
      setImageUrl(event.imageUrl)
    }
  }, [event?.imageUrl])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EventFormData>({
    defaultValues: event
      ? {
          title: event.title,
          description: event.description,
          eventType: event.eventType,
          location: event.location,
          registrationLink: event.registrationLink,
          featured: event.featured,
          organizer: event.organizer,
          maxParticipants: event.maxParticipants,
          status: event.status,
        }
      : {
          featured: false,
          organizer: 'Zero Error Esports',
          status: 'draft',
          eventType: 'upcoming',
        },
  })

  const featured = watch('featured')

  // Refresh event data from server to get updated imageUrl
  async function refreshEventData() {
    if (savedEventId) {
      try {
        const response = await fetch(`/api/admin/events/list?search=&page=1&limit=100`)
        const result = await response.json()
        const updatedEvent = result.events?.find((e: any) => e._id === savedEventId)
        if (updatedEvent?.imageUrl) {
          setImageUrl(updatedEvent.imageUrl)
        }
      } catch (error) {
        console.error('Error refreshing event data:', error)
      }
    }
  }

  const toggleGame = (game: string) => {
    setSelectedGames((prev) =>
      prev.includes(game) ? prev.filter((g) => g !== game) : [...prev, game]
    )
  }

  async function onSubmit(data: EventFormData) {
    if (!eventDate) {
      alert('Please select an event date')
      return
    }

    setLoading(true)

    try {
      const payload: any = {
        ...data,
        eventDate: eventDate.toISOString(),
        games: selectedGames,
      }

      // Only include imageUrl if it's not empty (don't overwrite with empty string)
      if (imageUrl) {
        payload.imageUrl = imageUrl
      }

      // Use savedEventId for newly created events that need updating
      const eventIdToUpdate = event?._id || savedEventId
      const endpoint = eventIdToUpdate
        ? '/api/admin/events/update'
        : '/api/admin/events/create'

      const response = await fetch(endpoint, {
        method: eventIdToUpdate ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventIdToUpdate ? { eventId: eventIdToUpdate, ...payload } : payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save event')
      }

      // Save eventId for new events to enable image upload
      if (!event && result.event?._id) {
        setSavedEventId(result.event._id)
        alert(result.message + ' You can now upload an image.')
      } else {
        alert(result.message)
        // Only call onSuccess if we're done (not waiting for image upload)
        if (eventIdToUpdate) {
          onSuccess()
        }
      }
    } catch (error: any) {
      console.error('Error saving event:', error)
      alert(error.message || 'Failed to save event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="title" className="text-white font-medium">
          Event Title <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          {...register('title', { required: 'Title is required' })}
          placeholder="Enter event title"
          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
        />
        {errors.title && (
          <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description" className="text-white font-medium">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          {...register('description', { required: 'Description is required' })}
          placeholder="Enter event description"
          rows={4}
          className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
        />
        {errors.description && (
          <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
        )}
      </div>

      {/* Event Date */}
      <div>
        <Label className="text-white font-medium">
          Event Date <span className="text-red-500">*</span>
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700',
                !eventDate && 'text-gray-500'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {eventDate ? format(eventDate, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar mode="single" selected={eventDate} onSelect={setEventDate} initialFocus />
          </PopoverContent>
        </Popover>
      </div>

      {/* Event Type & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="eventType" className="text-white font-medium">
            Event Type <span className="text-red-500">*</span>
          </Label>
          <Select
            onValueChange={(value) =>
              setValue('eventType', value as 'upcoming' | 'past')
            }
            defaultValue={event?.eventType || 'upcoming'}
          >
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
              <SelectValue placeholder="Select event type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status" className="text-gray-300">Status</Label>
          <Select
            onValueChange={(value) =>
              setValue('status', value as 'draft' | 'published' | 'cancelled')
            }
            defaultValue={event?.status || 'draft'}
          >
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location & Registration Link */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="location" className="text-white font-medium">Location</Label>
          <Input 
            id="location" 
            {...register('location')} 
            placeholder="e.g., Online" 
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
          />
        </div>

        <div>
          <Label htmlFor="registrationLink" className="text-white font-medium">Registration Link</Label>
          <Input
            id="registrationLink"
            {...register('registrationLink')}
            placeholder="https://..."
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Organizer & Max Participants */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="organizer" className="text-white font-medium">Organizer</Label>
          <Input
            id="organizer"
            {...register('organizer')}
            placeholder="Zero Error Esports"
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
          />
        </div>

        <div>
          <Label htmlFor="maxParticipants" className="text-white font-medium">Max Participants</Label>
          <Input
            id="maxParticipants"
            type="number"
            {...register('maxParticipants', { valueAsNumber: true })}
            placeholder="Optional"
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Games */}
      <div>
        <Label className="text-white font-medium">Games</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {GAME_OPTIONS.map((game) => (
            <Badge
              key={game}
              variant={selectedGames.includes(game) ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer transition-colors",
                selectedGames.includes(game) 
                  ? "bg-red-600 hover:bg-red-700 text-white" 
                  : "bg-zinc-800 border-zinc-600 text-gray-300 hover:bg-zinc-700"
              )}
              onClick={() => toggleGame(game)}
            >
              {game}
              {selectedGames.includes(game) && (
                <X className="ml-1 h-3 w-3" />
              )}
            </Badge>
          ))}
        </div>
      </div>

      {/* Image Upload */}
      <div className="space-y-4">
        <div>
          <Label className="text-white font-medium">Event Banner Image</Label>
          <EventImageUploader
            eventId={savedEventId}
            currentImage={imageUrl}
            onImageUpload={(url: string) => {
              setImageUrl(url)
              // Refresh to get the updated data from DB
              setTimeout(refreshEventData, 1000)
            }}
          />
        </div>
        
        {/* Manual Image URL Input */}
        <div>
          <Label htmlFor="imageUrlInput" className="text-white font-medium">Or Enter Image URL</Label>
          <Input
            id="imageUrlInput"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Featured Toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id="featured"
          checked={featured}
          onCheckedChange={(checked) => setValue('featured', checked)}
        />
        <Label htmlFor="featured" className="cursor-pointer text-gray-300">
          Mark as Featured Event
        </Label>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {savedEventId ? 'Update Event' : (event ? 'Update Event' : 'Create Event')}
        </Button>
        {savedEventId && !event && (
          <Button type="button" onClick={() => onSuccess()} className="bg-green-600 hover:bg-green-700">
            Done
          </Button>
        )}
      </div>
    </form>
  )
}

export default EventForm
