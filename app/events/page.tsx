import EventsPageClient from './events-client'
import {
  absoluteUrl,
  createEventSchema,
  createFaqSchema,
  createPageMetadata,
  toJsonLd,
} from '@/lib/seo'
import dbConnect from '@/lib/mongodb'
import Event from '@/models/event'

export const revalidate = 300

export const metadata = createPageMetadata({
  title: 'Esports Events and Tournaments | Zero Error Esports India',
  description:
    'Track upcoming and past Zero Error Esports tournaments, LAN events, and community competitions designed for India-first esports players and fans.',
  path: '/events',
})

const listedEventSchemas = [
  createEventSchema({
    name: 'ZE SLAMMANIA',
    description:
      'WWE 2K25 1v1 event hosted by Zero Error Esports at Lost Village Cafe, Gwalior. Winner: Aniraj.',
    urlPath: '/events',
    locationName: 'Lost Village Cafe, Gwalior',
    imagePath: '/images/ZE_slammania.png',
  }),
  createEventSchema({
    name: 'EAFC SHOWDOWN',
    description:
      'EAFC 25 1v1 event hosted by Zero Error Esports at Lost Village Cafe, Gwalior. Winner: Harshit.',
    urlPath: '/events',
    locationName: 'Lost Village Cafe, Gwalior',
    imagePath: '/images/EAFC_showdown.png',
  }),
  createEventSchema({
    name: 'ZE FFM SHOWDOWN',
    description:
      'Free Fire Max 4v4 squad battle royale event hosted online by Zero Error Esports. Winner: Team Tag Elite.',
    urlPath: '/events',
    locationName: 'Online',
    imagePath: '/images/ZE_FFM_Showdown.png',
  }),
  createEventSchema({
    name: 'ZE FACEOFF Invitational',
    description:
      'BGMI 1v1 TDM invitational hosted online by Zero Error Esports. Winner: Zoldyck Playz.',
    urlPath: '/events',
    locationName: 'Online',
    imagePath: '/images/ZE_faceoff.png',
  }),
]

const eventsListingSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Zero Error Esports Events',
  description:
    'Upcoming and past Zero Error Esports tournaments, LAN events, and community competitions.',
  url: absoluteUrl('/events'),
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: listedEventSchemas.map((eventSchema, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: eventSchema,
    })),
  },
}

const eventsFaqSchema = createFaqSchema([
  {
    question: 'How do I register for upcoming Zero Error tournaments?',
    answer:
      'Use the Register button on upcoming event cards. If registration is open, you will be redirected to the official signup link.',
  },
  {
    question: 'Are Zero Error events online or offline?',
    answer:
      'Both. Zero Error hosts online brackets and offline LAN-style events, including venue-based competitions in Gwalior.',
  },
  {
    question: 'Where can I track rankings and missions after events?',
    answer:
      'Visit ZE Club for missions, seasonal progress, and leaderboard updates connected to community participation.',
  },
])

type EventCardData = {
  _id: string
  title: string
  description: string
  eventDate: string
  eventType: 'upcoming' | 'past' | 'current'
  imageUrl?: string
  location?: string
  registrationLink?: string
  featured: boolean
  games: string[]
  organizer: string
  winner?: string
  gameCategory?: string
}

async function getInitialEvents(): Promise<{
  upcomingEvents: EventCardData[]
  pastEvents: EventCardData[]
}> {
  try {
    await dbConnect()

    const [upcomingEvents, pastEvents] = await Promise.all([
      Event.find({ status: 'published', eventType: 'upcoming' })
        .select('-createdBy')
        .sort({ eventDate: 1 })
        .lean(),
      Event.find({ status: 'published', eventType: 'past' })
        .select('-createdBy')
        .sort({ eventDate: -1 })
        .lean(),
    ])

    const serialize = (event: any): EventCardData => ({
      _id: String(event._id),
      title: String(event.title ?? ''),
      description: String(event.description ?? ''),
      eventDate: new Date(event.eventDate).toISOString(),
      eventType: event.eventType,
      imageUrl: event.imageUrl,
      location: event.location,
      registrationLink: event.registrationLink,
      featured: Boolean(event.featured),
      games: Array.isArray(event.games) ? event.games : [],
      organizer: String(event.organizer ?? 'Zero Error Esports'),
      winner: typeof event.winner === 'string' ? event.winner : undefined,
      gameCategory: typeof event.gameCategory === 'string' ? event.gameCategory : undefined,
    })

    return {
      upcomingEvents: upcomingEvents.map(serialize),
      pastEvents: pastEvents.map(serialize),
    }
  } catch {
    return {
      upcomingEvents: [],
      pastEvents: [],
    }
  }
}

export default async function EventsPage() {
  const { upcomingEvents, pastEvents } = await getInitialEvents()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: toJsonLd({
            '@context': 'https://schema.org',
            '@graph': [eventsListingSchema, ...listedEventSchemas, eventsFaqSchema],
          }),
        }}
      />
      <EventsPageClient
        initialUpcomingEvents={upcomingEvents}
        initialPastEvents={pastEvents}
      />
    </>
  )
}
