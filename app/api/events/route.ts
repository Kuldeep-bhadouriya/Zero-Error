import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Event from '@/models/event'
import logger from '@/lib/logger'
import {
  createNoStoreHeaders,
  createPublicCacheHeaders,
  createWeakEtag,
  isCacheDebugEnabled,
  isFreshRequest,
  resolveLastModified,
  resolvePublicCacheTtl,
} from '@/lib/http-cache'

// Force dynamic rendering for client-side fetches
export const dynamic = 'force-dynamic'
export const revalidate = 0

const EVENTS_LIST_TTL_SECONDS = resolvePublicCacheTtl('EVENTS_LIST_CACHE_TTL_SECONDS', 180)

export async function GET(req: Request) {
  try {
    const cacheDebug = isCacheDebugEnabled()
    const { searchParams } = new URL(req.url)
    const eventType = searchParams.get('eventType') // 'upcoming' | 'past'
    const featured = searchParams.get('featured') // 'true' | 'false'
    const limit = parseInt(searchParams.get('limit') || '0')

    await dbConnect()

    // Build query - only show published events
    const query: any = { status: 'published' }

    // Use the eventType field directly if specified
    // This allows admins to manually override date-based categorization
    if (eventType) {
      query.eventType = eventType
    }

    if (featured) {
      query.featured = featured === 'true'
    }

    let eventsQuery = Event.find(query).select('-createdBy')

    // Sort upcoming events by date (ascending - soonest first)
    // Sort past events by date (descending - most recent first)
    if (eventType === 'upcoming') {
      eventsQuery = eventsQuery.sort({ eventDate: 1 })
    } else if (eventType === 'past') {
      eventsQuery = eventsQuery.sort({ eventDate: -1 })
    } else {
      eventsQuery = eventsQuery.sort({ eventDate: -1 })
    }

    if (limit > 0) {
      eventsQuery = eventsQuery.limit(limit)
    }

    const events = await eventsQuery.lean()
    logger.info({ route: '/api/events', count: events.length }, 'Fetched events')

    const payload = {
      success: true,
      events,
      count: events.length,
    }

    if (EVENTS_LIST_TTL_SECONDS <= 0) {
      if (cacheDebug) {
        logger.debug({ route: '/api/events', cacheStatus: 'BYPASS', ttl: 0 }, 'Public API cache disabled')
      }

      return NextResponse.json(payload, {
        headers: createNoStoreHeaders(cacheDebug ? 'BYPASS' : undefined),
      })
    }

    const lastModified = resolveLastModified(
      events as Array<Record<string, unknown>>,
      ['updatedAt', 'eventDate'],
      new Date()
    )
    const etag = createWeakEtag(payload)

    if (isFreshRequest(req, etag, lastModified)) {
      if (cacheDebug) {
        logger.debug(
          { route: '/api/events', cacheStatus: 'HIT', ttl: EVENTS_LIST_TTL_SECONDS },
          'Returning 304 from conditional cache check'
        )
      }

      return new NextResponse(null, {
        status: 304,
        headers: createPublicCacheHeaders({
          ttlSeconds: EVENTS_LIST_TTL_SECONDS,
          etag,
          lastModified,
          cacheStatus: 'HIT',
          includeDebugHeaders: cacheDebug,
        }),
      })
    }

    if (cacheDebug) {
      logger.debug(
        { route: '/api/events', cacheStatus: 'MISS', ttl: EVENTS_LIST_TTL_SECONDS },
        'Returning cached public response with validators'
      )
    }

    return NextResponse.json(payload, {
      headers: createPublicCacheHeaders({
        ttlSeconds: EVENTS_LIST_TTL_SECONDS,
        etag,
        lastModified,
        cacheStatus: 'MISS',
        includeDebugHeaders: cacheDebug,
      }),
    })
  } catch (error) {
    logger.error({ route: '/api/events', err: error }, 'Error fetching events')
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch events',
      },
      {
        status: 500,
        headers: createNoStoreHeaders(),
      }
    )
  }
}
