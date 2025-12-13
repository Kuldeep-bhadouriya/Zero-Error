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
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }).optional(),
  bio: z.string().max(200, {
    message: 'Bio must not be longer than 200 characters.',
  }).optional(),
})

interface EditProfileFormProps {
  profile: {
    name?: string
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
      name: profile.name || '',
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
    <Card className="border-0 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black shadow-2xl">
      <CardHeader className="px-4 py-4 sm:px-6 sm:py-6">
        <CardTitle className="text-xl sm:text-2xl font-bold text-white">Edit Profile</CardTitle>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">Update your personal information</p>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-semibold text-sm">Display Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your name"
                      className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500/20 h-10 sm:h-11 text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-semibold text-sm">Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself..."
                      className="bg-black/60 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500 focus:ring-red-500/20 resize-none text-sm"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-gray-500 text-xs">
                    {form.watch('bio')?.length || 0}/200 characters
                  </FormDescription>
                  <FormMessage className="text-red-400 text-xs" />
                </FormItem>
              )}
            />

            <div className="bg-black/40 p-3 sm:p-4 rounded-lg border border-white/10">
              <FormLabel className="text-white font-semibold text-sm">Email Address</FormLabel>
              <Input
                value={profile.email}
                disabled
                className="bg-black/60 border-white/10 text-gray-400 cursor-not-allowed mt-2 h-10 sm:h-11 text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">Email address cannot be changed</p>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-semibold h-10 sm:h-11 shadow-lg shadow-red-500/20 text-sm"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
