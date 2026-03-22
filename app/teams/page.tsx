import TeamsPageClient from './teams-client'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Our Team | Zero Error Esports Leadership',
  description:
    'Meet the leadership team powering Zero Error Esports and shaping a high-performance esports ecosystem for India.',
  path: '/teams',
})

export default function TeamsPage() {
  return <TeamsPageClient />
}
