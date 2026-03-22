import JoinUsPageClient from './join-us-client'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Join ZE Club | Sign In to Zero Error Esports',
  description:
    'Sign in to ZE Club and access your Zero Error Esports account for missions, rewards, and India esports community experiences.',
  path: '/join-us',
  noIndex: true,
})

export default function JoinUsPage() {
  return <JoinUsPageClient />
}
