import { createHash } from 'node:crypto'

type CacheStatus = 'HIT' | 'MISS' | 'BYPASS'

const DEFAULT_PUBLIC_TTL_SECONDS = 120
const MAX_PUBLIC_TTL_SECONDS = 3600
const NO_STORE_VALUE = 'private, no-store, no-cache, must-revalidate'

function parseTtl(rawValue: string | undefined, fallbackSeconds: number): number {
  if (!rawValue || rawValue.trim().length === 0) {
    return fallbackSeconds
  }

  const parsed = Number.parseInt(rawValue, 10)
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallbackSeconds
  }

  return Math.min(parsed, MAX_PUBLIC_TTL_SECONDS)
}

export function isCacheDebugEnabled(): boolean {
  return process.env.PUBLIC_API_CACHE_DEBUG === 'true' || process.env.NODE_ENV !== 'production'
}

export function resolvePublicCacheTtl(endpointEnvKey: string, fallbackSeconds: number): number {
  if (process.env.PUBLIC_API_CACHE_DISABLED === 'true') {
    return 0
  }

  const fallbackWithGlobal = parseTtl(
    process.env.PUBLIC_API_CACHE_TTL_SECONDS,
    fallbackSeconds || DEFAULT_PUBLIC_TTL_SECONDS
  )

  return parseTtl(process.env[endpointEnvKey], fallbackWithGlobal)
}

export function createWeakEtag(payload: unknown): string {
  const serialized = JSON.stringify(payload)
  const hash = createHash('sha1').update(serialized).digest('base64url')
  return `W/"${hash}"`
}

function normalizeEtag(value: string): string {
  return value.trim().replace(/^W\//, '')
}

export function isFreshRequest(request: Request, etag: string, lastModified: Date): boolean {
  const ifNoneMatch = request.headers.get('if-none-match')
  if (ifNoneMatch) {
    const candidates = ifNoneMatch.split(',').map((part) => part.trim())
    const normalizedCurrent = normalizeEtag(etag)
    if (candidates.includes('*')) {
      return true
    }

    if (candidates.some((candidate) => normalizeEtag(candidate) === normalizedCurrent)) {
      return true
    }
  }

  const ifModifiedSince = request.headers.get('if-modified-since')
  if (ifModifiedSince) {
    const parsed = Date.parse(ifModifiedSince)
    if (!Number.isNaN(parsed) && lastModified.getTime() <= parsed) {
      return true
    }
  }

  return false
}

export function createPublicCacheHeaders(params: {
  ttlSeconds: number
  etag: string
  lastModified: Date
  cacheStatus: CacheStatus
  includeDebugHeaders?: boolean
}): Headers {
  const { ttlSeconds, etag, lastModified, cacheStatus, includeDebugHeaders } = params
  const headers = new Headers()

  headers.set(
    'Cache-Control',
    `public, max-age=0, s-maxage=${ttlSeconds}, stale-while-revalidate=${Math.min(ttlSeconds, 60)}`
  )
  headers.set('ETag', etag)
  headers.set('Last-Modified', lastModified.toUTCString())

  if (includeDebugHeaders) {
    headers.set('X-ZE-Cache-Status', cacheStatus)
    headers.set('X-ZE-Cache-TTL', String(ttlSeconds))
  }

  return headers
}

export function createNoStoreHeaders(cacheStatus?: CacheStatus): Headers {
  const headers = new Headers()
  headers.set('Cache-Control', NO_STORE_VALUE)
  headers.set('Pragma', 'no-cache')
  headers.set('Expires', '0')

  if (cacheStatus) {
    headers.set('X-ZE-Cache-Status', cacheStatus)
    headers.set('X-ZE-Cache-TTL', '0')
  }

  return headers
}

export function resolveLastModified(
  records: ReadonlyArray<Record<string, unknown>>,
  dateKeys: ReadonlyArray<string>,
  fallbackDate: Date
): Date {
  let latestMs = 0

  for (const record of records) {
    for (const key of dateKeys) {
      const value = record[key]
      if (!value) {
        continue
      }

      const asDate = value instanceof Date ? value : new Date(value as string | number)
      const asTime = asDate.getTime()
      if (!Number.isNaN(asTime) && asTime > latestMs) {
        latestMs = asTime
      }
    }
  }

  return latestMs > 0 ? new Date(latestMs) : fallbackDate
}
