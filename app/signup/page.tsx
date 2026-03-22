import SignupPageClient from './signup-client'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Create ZE Club Account | Zero Error Esports',
  description:
    'Create your ZE Club account to join missions, earn points, and participate in India-focused esports challenges with Zero Error Esports.',
  path: '/signup',
  noIndex: true,
})

export default function SignupPage() {
  return <SignupPageClient />
}
