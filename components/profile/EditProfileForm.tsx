'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const formSchema = z.object({
  bio: z.string().max(200, {
    message: 'Bio must not be longer than 200 characters.',
  }).optional(),
})

interface EditProfileFormProps {
  profile: {
    email?: string
    bio?: string
  }
  onSuccess: () => void
}

export function EditProfileForm({ profile, onSuccess }: EditProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      bio: profile.bio || '',
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/user/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (res.ok) {
        toast.success('Profile updated successfully')
        onSuccess()
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-0 bg-zinc-900/50 backdrop-blur-sm shadow-xl rounded-xl">
      <CardHeader className="px-4 py-4 sm:px-6 sm:py-6 border-b border-white/5">
        <CardTitle className="text-xl sm:text-2xl font-bold text-white">Profile Settings</CardTitle>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">Customize your personal information</p>
      </CardHeader>
      <CardContent className="px-4 py-4 sm:px-6 sm:py-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-semibold text-sm flex items-center justify-between">
                    <span>Bio</span>
                    <span className="text-xs font-normal text-gray-500">
                      {form.watch('bio')?.length || 0}/200
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share a bit about yourself, your interests, or your gaming achievements..."
                      className="bg-black/40 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 resize-none text-sm min-h-[100px] rounded-xl transition-all"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />

            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
              <FormLabel className="text-white font-semibold text-sm mb-2 block">Email Address</FormLabel>
              <Input
                value={profile.email}
                disabled
                className="bg-black/40 border-white/5 text-gray-400 cursor-not-allowed h-11 text-sm rounded-lg w-full"
              />
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                Email address cannot be changed
              </p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !form.formState.isDirty}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold h-11 shadow-lg shadow-red-500/25 text-sm rounded-xl transition-all hover:shadow-red-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
