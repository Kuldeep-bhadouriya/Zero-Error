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

// Make this route dynamic to prevent caching issues
export const dynamic = 'force-dynamic'
export const revalidate = 0

const EVENTS_CURRENT_TTL_SECONDS = resolvePublicCacheTtl('EVENTS_CURRENT_CACHE_TTL_SECONDS', 30)

export async function GET(req: Request) {
  try {
    const cacheDebug = isCacheDebugEnabled()
    await dbConnect()

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    // Find events that are happening today or are currently ongoing
    // This includes events that started today or events that are multi-day
    const events = await Event.find({
      status: 'published',
      eventDate: {
        $gte: todayStart,
        $lt: todayEnd,
      },
    })
      .select('-createdBy')
      .sort({ eventDate: 1 })
      .limit(6)
      .lean()

    const payload = {
      success: true,
      events,
      count: events.length,
    }

    if (EVENTS_CURRENT_TTL_SECONDS <= 0) {
      if (cacheDebug) {
        logger.debug(
          { route: '/api/events/current', cacheStatus: 'BYPASS', ttl: 0 },
          'Public API cache disabled'
        )
      }

      return NextResponse.json(payload, {
        headers: createNoStoreHeaders(cacheDebug ? 'BYPASS' : undefined),
      })
    }

    const lastModified = resolveLastModified(
      events as Array<Record<string, unknown>>,
      ['updatedAt', 'eventDate'],
      now
    )
    const etag = createWeakEtag(payload)

    if (isFreshRequest(req, etag, lastModified)) {
      if (cacheDebug) {
        logger.debug(
          {
            route: '/api/events/current',
            cacheStatus: 'HIT',
            ttl: EVENTS_CURRENT_TTL_SECONDS,
          },
          'Returning 304 from conditional cache check'
        )
      }

      return new NextResponse(null, {
        status: 304,
        headers: createPublicCacheHeaders({
          ttlSeconds: EVENTS_CURRENT_TTL_SECONDS,
          etag,
          lastModified,
          cacheStatus: 'HIT',
          includeDebugHeaders: cacheDebug,
        }),
      })
    }

    if (cacheDebug) {
      logger.debug(
        {
          route: '/api/events/current',
          cacheStatus: 'MISS',
          ttl: EVENTS_CURRENT_TTL_SECONDS,
        },
        'Returning cached public response with validators'
      )
    }

    return NextResponse.json(payload, {
      headers: createPublicCacheHeaders({
        ttlSeconds: EVENTS_CURRENT_TTL_SECONDS,
        etag,
        lastModified,
        cacheStatus: 'MISS',
        includeDebugHeaders: cacheDebug,
      }),
    })
  } catch (error: unknown) {
    logger.error('Error fetching current events:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch current events' },
      {
        status: 500,
        headers: createNoStoreHeaders(),
      }
    )
  }
}
