import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Announcement from '@/models/announcement'
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

// Force dynamic rendering since we need to read query parameters
export const dynamic = 'force-dynamic'

const MAX_PER_PAGE = 3
const ACTIVE_ANNOUNCEMENTS_TTL_SECONDS = resolvePublicCacheTtl(
  'ANNOUNCEMENTS_ACTIVE_CACHE_TTL_SECONDS',
  45
)

function buildDateFilter(now: Date) {
  return {
    $and: [
      {
        $or: [
          { startDate: { $lte: now } },
          { startDate: { $exists: false } },
          { startDate: null },
        ],
      },
      {
        $or: [
          { endDate: { $gte: now } },
          { endDate: { $exists: false } },
          { endDate: null },
        ],
      },
    ],
  }
}

export async function GET(req: Request) {
  await dbConnect()

  try {
    const cacheDebug = isCacheDebugEnabled()
    const { searchParams } = new URL(req.url)
    const page = Math.max(Number(searchParams.get('page')) || 1, 1)
    const targetPage = searchParams.get('targetPage') || 'all'
    const now = new Date()
    const skip = (page - 1) * MAX_PER_PAGE

    const filter: Record<string, unknown> = {
      active: true,
      ...buildDateFilter(now),
    }

    if (targetPage && targetPage !== 'all') {
      filter.targetPages = { $in: ['all', targetPage] }
    }

    const [announcements, total] = await Promise.all([
      Announcement.find(filter)
        .sort({ priority: -1, updatedAt: -1 })
        .skip(skip)
        .limit(MAX_PER_PAGE)
        .lean(),
      Announcement.countDocuments(filter),
    ])

    const payload = {
      announcements,
      pagination: {
        page,
        limit: MAX_PER_PAGE,
        total,
        totalPages: Math.ceil(total / MAX_PER_PAGE) || 1,
        hasMore: page * MAX_PER_PAGE < total,
      },
    }

    if (ACTIVE_ANNOUNCEMENTS_TTL_SECONDS <= 0) {
      if (cacheDebug) {
        logger.debug(
          { route: '/api/announcements/active', cacheStatus: 'BYPASS', ttl: 0 },
          'Public API cache disabled'
        )
      }

      return NextResponse.json(payload, {
        headers: createNoStoreHeaders(cacheDebug ? 'BYPASS' : undefined),
      })
    }

    const lastModified = resolveLastModified(
      announcements as Array<Record<string, unknown>>,
      ['updatedAt', 'startDate', 'endDate'],
      now
    )
    const etag = createWeakEtag(payload)

    if (isFreshRequest(req, etag, lastModified)) {
      if (cacheDebug) {
        logger.debug(
          {
            route: '/api/announcements/active',
            cacheStatus: 'HIT',
            ttl: ACTIVE_ANNOUNCEMENTS_TTL_SECONDS,
          },
          'Returning 304 from conditional cache check'
        )
      }

      return new NextResponse(null, {
        status: 304,
        headers: createPublicCacheHeaders({
          ttlSeconds: ACTIVE_ANNOUNCEMENTS_TTL_SECONDS,
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
          route: '/api/announcements/active',
          cacheStatus: 'MISS',
          ttl: ACTIVE_ANNOUNCEMENTS_TTL_SECONDS,
        },
        'Returning cached public response with validators'
      )
    }

    return NextResponse.json(payload, {
      headers: createPublicCacheHeaders({
        ttlSeconds: ACTIVE_ANNOUNCEMENTS_TTL_SECONDS,
        etag,
        lastModified,
        cacheStatus: 'MISS',
        includeDebugHeaders: cacheDebug,
      }),
    })
  } catch (error) {
    logger.error('Error fetching active announcements:', error)
    return new NextResponse('Internal Server Error', {
      status: 500,
      headers: createNoStoreHeaders(),
    })
  }
}
