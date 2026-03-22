import ContactPageClient from './contact-client'
import { createPageMetadata } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Contact Zero Error Esports | Partnerships and Community',
  description:
    'Contact Zero Error Esports for tournament partnerships, team queries, brand collaborations, and esports community support across India.',
  path: '/contact',
})

export default function ContactPage() {
  return <ContactPageClient />
}
