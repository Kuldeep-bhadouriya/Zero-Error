import ServicesPageClient from './services-client'
import { createFaqSchema, createPageMetadata, toJsonLd } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'Esports Services in India | Zero Error Esports',
  description:
    'Explore Zero Error Esports services including tournament operations, player development, creator collaborations, and campus esports programs in India.',
  path: '/services',
})

const servicesFaqSchema = createFaqSchema([
  {
    question: 'Which esports services are best for colleges and campuses?',
    answer:
      'Campus leagues, gaming club support, workshop-led talent programs, and tournament operations are strong fits for colleges starting esports programs.',
  },
  {
    question: 'Can Zero Error help brands activate sponsorship campaigns?',
    answer:
      'Yes. Zero Error builds sponsorship experiences through tournament integrations, creator collaborations, and youth-focused esports storytelling.',
  },
  {
    question: 'How do we start a service engagement with Zero Error Esports?',
    answer:
      'Use the contact page to share goals, timelines, and audience details. The team maps a custom plan across events, creators, and competitive formats.',
  },
])

export default function ServicesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd(servicesFaqSchema),
        }}
      />
      <ServicesPageClient />
    </>
  )
}
