import type { Metadata } from 'next'

const SITE_NAME = 'Zero Error Esports'
const SITE_URL = 'https://zeroerroresports.com'
const DEFAULT_IMAGE = '/images/banner.jpg'

interface PageMetadataOptions {
  title: string
  description: string
  path: string
  noIndex?: boolean
}

interface EventSchemaInput {
  name: string
  description: string
  urlPath: string
  locationName?: string
  locationAddress?: string
  startDate?: string
  endDate?: string
  imagePath?: string
}

interface BreadcrumbItemInput {
  name: string
  path: string
}

interface FaqItemInput {
  question: string
  answer: string
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`
}

export function createPageMetadata({
  title,
  description,
  path,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const canonical = absoluteUrl(path)

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: 'en_IN',
      type: 'website',
      images: [
        {
          url: DEFAULT_IMAGE,
          width: 1200,
          height: 630,
          alt: `${SITE_NAME} cover image`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@ZeroErrorESports',
      images: [DEFAULT_IMAGE],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
        }
      : undefined,
  }
}

export function createOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/images/favicon.png'),
    sameAs: [
      'https://x.com/ZeroErrorES',
      'https://www.instagram.com/zero_error_esports',
      'https://www.youtube.com/@ZeroErrorEsports/videos',
      'https://discord.gg/zJfncArJMT',
    ],
  }
}

export function createEventSchema(input: EventSchemaInput) {
  const event: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.urlPath),
    organizer: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }

  if (input.startDate) {
    event.startDate = input.startDate
  }

  if (input.endDate) {
    event.endDate = input.endDate
  }

  if (input.imagePath) {
    event.image = [absoluteUrl(input.imagePath)]
  }

  if (input.locationName || input.locationAddress) {
    event.location = {
      '@type': 'Place',
      ...(input.locationName ? { name: input.locationName } : {}),
      ...(input.locationAddress
        ? {
            address: {
              '@type': 'PostalAddress',
              streetAddress: input.locationAddress,
              addressCountry: 'IN',
            },
          }
        : {}),
    }
  }

  return event
}

export function createBreadcrumbSchema(items: BreadcrumbItemInput[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function createFaqSchema(items: FaqItemInput[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export function toJsonLd(schema: unknown): string {
  return JSON.stringify(schema)
}
