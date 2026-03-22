import AboutPageClient from './about-client'
import { createFaqSchema, createPageMetadata, toJsonLd } from '@/lib/seo'

export const metadata = createPageMetadata({
  title: 'About Zero Error Esports | India-First Esports Vision',
  description:
    'Learn how Zero Error Esports is building India-first esports opportunities from Gwalior through tournaments, talent development, and creator growth.',
  path: '/about',
})

const aboutFaqSchema = createFaqSchema([
  {
    question: 'What does Zero Error Esports do in India?',
    answer:
      'Zero Error Esports runs tournaments, develops player talent, supports creators, and builds esports opportunities from Gwalior for a wider India-first community.',
  },
  {
    question: 'How can I participate in Zero Error events?',
    answer:
      'You can follow upcoming competitions on the Events page, register for open brackets, and contact the team for campus or local community tournament participation.',
  },
  {
    question: 'Can brands or colleges collaborate with Zero Error?',
    answer:
      'Yes. Zero Error works with brands, colleges, and gaming cafes through esports activations, sponsorship campaigns, and custom engagement programs.',
  },
])

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd(aboutFaqSchema),
        }}
      />
      <AboutPageClient />
    </>
  )
}
