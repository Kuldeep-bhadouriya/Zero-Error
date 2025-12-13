'use client'

import { useMemo, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { CalendarIcon, Bold, Italic, Link as LinkIcon, Loader2, Eye } from 'lucide-react'

const TYPE_OPTIONS = [
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warning' },
  { label: 'Success', value: 'success' },
  { label: 'Urgent', value: 'urgent' },
]

const TARGET_PAGE_OPTIONS = [
  { label: 'All Pages', value: 'all' },
  { label: 'Home', value: 'home' },
  { label: 'About', value: 'about' },
  { label: 'Events', value: 'events' },
  { label: 'Teams', value: 'teams' },
  { label: 'Contact', value: 'contact' },
  { label: 'ZE Club Dashboard', value: 'ze-club' },
  { label: 'ZE Club Missions', value: 'ze-club/missions' },
  { label: 'ZE Club Leaderboard', value: 'ze-club/leaderboard' },
  { label: 'ZE Club Rewards', value: 'ze-club/rewards' },
  { label: 'Support', value: 'support' },
]

const TYPE_GRADIENTS: Record<string, string> = {
  info: 'from-blue-600/80 via-sky-500/70 to-cyan-500/70 border-blue-500/40',
  warning: 'from-amber-500/80 via-orange-500/80 to-yellow-500/70 border-amber-500/40',
  success: 'from-emerald-500/80 via-green-500/70 to-lime-500/70 border-emerald-500/40',
  urgent: 'from-rose-600/80 via-red-600/80 to-orange-600/80 border-rose-500/40',
}

const CALENDAR_CLASSNAMES = {
  caption_label: 'text-white font-semibold text-sm',
  head_cell: 'text-gray-400 text-[0.7rem] font-semibold',
  nav_button: 'h-7 w-7 rounded-md border border-white/20 text-white hover:bg-white/10',
  table: 'w-full border-collapse space-y-1 text-white',
  day: 'h-9 w-9 rounded-lg text-sm font-medium text-gray-100 hover:bg-white/10',
  day_selected: 'bg-red-600 text-white hover:bg-red-500 hover:text-white focus:bg-red-600 focus:text-white',
  day_today: 'border border-white/40 text-white',
  day_outside: 'text-gray-500 opacity-40',
  day_range_middle: 'bg-white/10 text-white',
}

const announcementSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(100, 'Keep it under 100 characters'),
    message: z.string().min(1, 'Message is required').max(500, '500 characters max'),
    type: z.enum(['info', 'warning', 'success', 'urgent']),
    priority: z.number().min(1).max(10),
    active: z.boolean().default(true),
    link: z
      .union([z.string().url('Enter a valid URL'), z.literal(''), z.undefined()])
      .optional()
      .transform((value) => (value === '' ? undefined : value)),
    linkText: z
      .union([z.string().max(50, 'CTA text too long'), z.literal(''), z.undefined()])
      .optional()
      .transform((value) => (value === '' ? undefined : value)),
    targetPages: z.array(z.string()).min(1, 'Choose at least one page'),
    dismissible: z.boolean().default(true),
  })
  .superRefine((values, ctx) => {
    if (values.link && !values.linkText) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Add button text when link is set', path: ['linkText'] })
    }
  })

type AnnouncementFormValues = z.infer<typeof announcementSchema>

interface AnnouncementFormProps {
  announcement?: any
  onSuccess: () => void
  onCancel: () => void
}

function AnnouncementForm({ announcement, onSuccess, onCancel }: AnnouncementFormProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const initialRange: DateRange | undefined = useMemo(() => {
    if (!announcement?.startDate && !announcement?.endDate) {
      return undefined
    }

    return {
      from: announcement?.startDate ? new Date(announcement.startDate) : undefined,
      to: announcement?.endDate ? new Date(announcement.endDate) : undefined,
    }
  }, [announcement?.startDate, announcement?.endDate])
  const [dateRange, setDateRange] = useState<DateRange | undefined>(initialRange)
  const messageRef = useRef<HTMLTextAreaElement | null>(null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    setValue,
  } = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: announcement?.title || '',
      message: announcement?.message || '',
      type: announcement?.type || 'info',
      priority: announcement?.priority || 5,
      active: announcement?.active ?? true,
      link: announcement?.link || '',
      linkText: announcement?.linkText || '',
      targetPages: announcement?.targetPages || ['all'],
      dismissible: announcement?.dismissible ?? true,
    },
  })

  const currentType = watch('type')
  const messageValue = watch('message')
  const selectedPages = watch('targetPages') ?? ['all']
  const linkValue = watch('link')
  const linkTextValue = watch('linkText')
  const { ref: messageFieldRef, ...messageField } = register('message')

  function togglePage(page: string) {
    if (page === 'all') {
      setValue('targetPages', ['all'], { shouldValidate: true })
      return
    }

    const cleansedSelection = (selectedPages || []).filter((entry) => entry !== 'all')
    const exists = cleansedSelection.includes(page)
    const next = exists ? cleansedSelection.filter((p) => p !== page) : [...cleansedSelection, page]
    setValue('targetPages', next.length ? next : ['all'], { shouldValidate: true })
  }

  function insertFormatting(prefix: string, suffix?: string) {
    const textarea = messageRef.current
    if (!textarea) {
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = textarea.value
    const selected = value.slice(start, end)
    const formatted = `${value.slice(0, start)}${prefix}${selected}${suffix ?? prefix}${value.slice(end)}`

    setValue('message', formatted, { shouldValidate: true })

    requestAnimationFrame(() => {
      textarea.focus()
      const cursor = start + prefix.length + selected.length + (suffix?.length ?? prefix.length)
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  async function onSubmit(values: AnnouncementFormValues) {
    setSubmitting(true)

    try {
      const payload = {
        ...values,
        targetPages: values.targetPages.includes('all') ? ['all'] : values.targetPages,
        startDate: dateRange?.from ? dateRange.from.toISOString() : undefined,
        endDate: dateRange?.to ? dateRange.to.toISOString() : undefined,
      }

      const endpoint = announcement ? '/api/admin/announcements/update' : '/api/admin/announcements/create'
      const method = announcement ? 'PATCH' : 'POST'
      const body = announcement ? { id: announcement._id, ...payload } : payload

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || 'Failed to save announcement')
      }

      toast({
        title: announcement ? 'Announcement updated' : 'Announcement created',
        description: 'Changes will be live within a few seconds.',
      })

      onSuccess()
    } catch (error: any) {
      console.error('Error saving announcement:', error)
      toast({ title: 'Something went wrong', description: error.message || 'Unable to save announcement' })
    } finally {
      setSubmitting(false)
    }
  }

  const gradientClass = TYPE_GRADIENTS[currentType] || TYPE_GRADIENTS.info
  const rangeLabel = useMemo(() => {
    if (!dateRange?.from && !dateRange?.to) {
      return 'Always on'
    }

    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, 'MMM d, yyyy')} → ${format(dateRange.to, 'MMM d, yyyy')}`
    }

    if (dateRange?.from) {
      return `${format(dateRange.from, 'MMM d, yyyy')} onward`
    }

    return 'Always on'
  }, [dateRange])

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-8 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 shadow-2xl shadow-black/30"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-sm font-semibold text-gray-200">
              Announcement title
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="e.g., ZE Carnival registrations close soon"
              className="mt-2 bg-zinc-900 text-white placeholder:text-zinc-500"
            />
            {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>}
          </div>

          <div>
            <Label className="text-sm font-semibold text-gray-200">Announcement type</Label>
            <Select onValueChange={(value) => setValue('type', value as AnnouncementFormValues['type'])} value={currentType}>
              <SelectTrigger className="mt-2 bg-zinc-900 text-white">
                <SelectValue placeholder="Choose type" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 text-white">
                {TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="link" className="text-sm font-semibold text-gray-200">
              Call-to-action link
            </Label>
            <Input
              id="link"
              {...register('link')}
              placeholder="https://"
              className="mt-2 bg-zinc-900 text-white placeholder:text-zinc-500"
            />
            {errors.link && <p className="mt-1 text-xs text-red-400">{errors.link.message}</p>}
          </div>

          <div>
            <Label htmlFor="linkText" className="text-sm font-semibold text-gray-200">
              Button text
            </Label>
            <Input
              id="linkText"
              {...register('linkText')}
              placeholder="View details"
              className="mt-2 bg-zinc-900 text-white placeholder:text-zinc-500"
            />
            {errors.linkText && <p className="mt-1 text-xs text-red-400">{errors.linkText.message}</p>}
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-sm font-semibold text-gray-200">Message (supports markdown-style formatting)</Label>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900">
            <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2 text-xs text-gray-400">
              <button
                type="button"
                onClick={() => insertFormatting('**')}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-gray-300 transition hover:bg-zinc-800"
              >
                <Bold className="h-3.5 w-3.5" /> Bold
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*')}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-gray-300 transition hover:bg-zinc-800"
              >
                <Italic className="h-3.5 w-3.5" /> Italic
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('[', '](https://)')}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-gray-300 transition hover:bg-zinc-800"
              >
                <LinkIcon className="h-3.5 w-3.5" /> Link
              </button>
            </div>
            <Textarea
              {...messageField}
              ref={(element) => {
                messageFieldRef(element)
                messageRef.current = element
              }}
              rows={8}
              maxLength={500}
              className="border-0 bg-transparent text-white placeholder:text-zinc-600"
              placeholder="Share the important details in 2-3 sentences."
            />
            <div className="flex items-center justify-between border-t border-zinc-800 px-3 py-2 text-xs text-gray-400">
              <span>Use up to 500 characters</span>
              <span>
                {messageValue?.length || 0}/500
              </span>
            </div>
          </div>
          {errors.message && <p className="text-xs text-red-400">{errors.message.message}</p>}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <Label className="text-sm font-semibold text-gray-200">Display window</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-between bg-zinc-900 text-left font-normal text-white hover:bg-zinc-800',
                  !dateRange?.from && !dateRange?.to && 'text-gray-400'
                )}
              >
                <span>{rangeLabel}</span>
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto rounded-xl border border-zinc-800 bg-zinc-950 p-0">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 text-white"
                classNames={CALENDAR_CLASSNAMES}
              />
            </PopoverContent>
          </Popover>
          <p className="text-xs text-gray-400">
            Leave empty to keep the announcement visible until it is manually turned off.
          </p>

          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
            <div>
              <p className="text-sm font-semibold text-gray-100">Active</p>
              <p className="text-xs text-gray-500">Toggle visibility without deleting</p>
            </div>
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
            <div>
              <p className="text-sm font-semibold text-gray-100">Dismissible</p>
              <p className="text-xs text-gray-500">Allow users to hide this announcement</p>
            </div>
            <Controller
              name="dismissible"
              control={control}
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          <div>
            <Label className="text-sm font-semibold text-gray-200">Priority</Label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <div className="mt-3 space-y-3">
                  <Slider
                    value={[field.value]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={(value) => field.onChange(value[0])}
                  />
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Low</span>
                    <span className="text-sm font-semibold text-white">{field.value}</span>
                    <span>High</span>
                  </div>
                </div>
              )}
            />
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <Label className="text-sm font-semibold text-gray-200">Target pages</Label>
          <div className="flex flex-wrap gap-2">
            {TARGET_PAGE_OPTIONS.map((option) => (
              <Badge
                key={option.value}
                variant={selectedPages.includes(option.value) ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer border border-zinc-700 text-xs transition',
                  selectedPages.includes(option.value)
                    ? 'bg-red-600 text-white hover:bg-red-500'
                    : 'bg-transparent text-gray-300 hover:bg-zinc-800'
                )}
                onClick={() => togglePage(option.value)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
          {errors.targetPages && (
            <p className="text-xs text-red-400">{errors.targetPages.message as string}</p>
          )}

          <div className="rounded-xl border border-zinc-800 bg-gradient-to-r p-4 text-white shadow-inner shadow-black/30">
            <div
              className={cn(
                'rounded-xl border px-4 py-5 text-white shadow-lg transition-all',
                'bg-gradient-to-r',
                gradientClass
              )}
            >
              <div className="flex items-center gap-2 text-sm uppercase tracking-wide text-white/80">
                <Eye className="h-4 w-4" /> Live preview
              </div>
              <h3 className="mt-3 text-lg font-bold">{watch('title') || 'Announcement title'}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/90 whitespace-pre-line">
                {messageValue || 'Your message preview will appear here.'}
              </p>
              {linkValue && linkTextValue && (
                <span className="mt-3 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
                  {linkTextValue}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-900 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onCancel} className="bg-zinc-800 border-zinc-700 text-gray-300 hover:text-white hover:bg-zinc-800">
          Cancel
        </Button>
        <Button type="submit" disabled={submitting} className="bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-500/40">
          {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {announcement ? 'Update announcement' : 'Publish announcement'}
        </Button>
      </div>
    </form>
  )
}

export default AnnouncementForm
