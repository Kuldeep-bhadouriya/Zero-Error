import { NextRequest, NextResponse } from 'next/server'
import { buildRateLimitHeaders, checkRateLimit, getClientIp } from '@/lib/rate-limit'

const CSRF_COOKIE_NAME = 'ze_csrf_token'
const MUTATING_METHODS = new Set(['POST', 'PATCH', 'DELETE', 'PUT'])
const CSRF_EXEMPT_PREFIXES = ['/api/auth/', '/api/uploadthing']

const DEFAULT_API_LIMIT = {
  limit: 120,
  windowSeconds: 60,
  prefix: 'rl:api:default',
}

const AUTH_LIMIT = {
  limit: 20,
  windowSeconds: 600,
  prefix: 'rl:api:auth',
}

const AUTH_READ_EXEMPT_PATHS = new Set([
  '/api/auth/session',
  '/api/auth/providers',
  '/api/auth/csrf',
])

const CONTACT_LIMIT = {
  limit: 5,
  windowSeconds: 600,
  prefix: 'rl:api:contact',
}

function isCsrfExemptPath(path: string) {
  return CSRF_EXEMPT_PREFIXES.some((prefix) => path.startsWith(prefix))
}

function shouldApplyAuthRateLimit(path: string, method: string) {
  if (!path.startsWith('/api/auth/')) {
    return false
  }

  // Session/provider/csrf polling are low-risk reads and can be called often.
  if (method === 'GET' && AUTH_READ_EXEMPT_PATHS.has(path)) {
    return false
  }

  return true
}

function isValidSameOriginRequest(request: NextRequest) {
  const requestOrigin = request.nextUrl.origin
  const originHeader = request.headers.get('origin')

  if (originHeader) {
    return originHeader === requestOrigin
  }

  const refererHeader = request.headers.get('referer')
  if (refererHeader) {
    try {
      return new URL(refererHeader).origin === requestOrigin
    } catch {
      return false
    }
  }

  return true
}

function ensureCsrfCookie(request: NextRequest, response: NextResponse) {
  const existing = request.cookies.get(CSRF_COOKIE_NAME)?.value
  if (existing) {
    return response
  }

  const token = crypto.randomUUID().replace(/-/g, '')
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  })

  return response
}

export async function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const ip = getClientIp(request)
  const path = request.nextUrl.pathname
  const method = request.method.toUpperCase()

  if (MUTATING_METHODS.has(method) && !isCsrfExemptPath(path)) {
    if (!isValidSameOriginRequest(request)) {
      return NextResponse.json(
        { error: 'Invalid request origin.' },
        { status: 403 }
      )
    }

    const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value
    const csrfHeader = request.headers.get('x-csrf-token')

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return NextResponse.json(
        { error: 'Invalid CSRF token.' },
        { status: 403 }
      )
    }
  }

  const defaultResult = await checkRateLimit({
    key: ip,
    ...DEFAULT_API_LIMIT,
  })

  if (!defaultResult.success) {
    const response = NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: buildRateLimitHeaders(defaultResult) }
    )
    return ensureCsrfCookie(request, response)
  }

  if (shouldApplyAuthRateLimit(path, method)) {
    const authResult = await checkRateLimit({
      key: ip,
      ...AUTH_LIMIT,
    })

    if (!authResult.success) {
      const response = NextResponse.json(
        { error: 'Too many authentication requests. Please try again later.' },
        { status: 429, headers: buildRateLimitHeaders(authResult) }
      )
      return ensureCsrfCookie(request, response)
    }
  }

  if (path === '/api/contact') {
    const contactResult = await checkRateLimit({
      key: ip,
      ...CONTACT_LIMIT,
    })

    if (!contactResult.success) {
      const response = NextResponse.json(
        { error: 'Too many contact requests. Please try again later.' },
        { status: 429, headers: buildRateLimitHeaders(contactResult) }
      )
      return ensureCsrfCookie(request, response)
    }
  }

  const response = NextResponse.next()
  return ensureCsrfCookie(request, response)
}

export const config = {
  matcher: ['/api/:path*'],
}
