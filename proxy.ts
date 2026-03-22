import { NextRequest, NextResponse } from 'next/server'
import {
  buildRateLimitHeaders,
  checkRateLimit,
  getClientIp,
  getRateLimitRule,
} from '@/lib/rate-limit'

const CSRF_COOKIE_NAME = 'ze_csrf_token'
const MUTATING_METHODS = new Set(['POST', 'PATCH', 'DELETE', 'PUT'])
const CSRF_EXEMPT_PREFIXES = ['/api/auth/', '/api/uploadthing']

const DEFAULT_API_LIMIT = getRateLimitRule('apiDefault')
const AUTH_LIMIT = getRateLimitRule('apiAuth')

const AUTH_READ_EXEMPT_PATHS = new Set([
  '/api/auth/session',
  '/api/auth/providers',
  '/api/auth/csrf',
])

const CONTACT_LIMIT = getRateLimitRule('apiContact')

// CSP rollout checklist:
// 1) Default CSP_ENFORCE=false uses Content-Security-Policy-Report-Only.
// 2) Confirm low/expected violation volume from production telemetry.
// 3) Set CSP_ENFORCE=true only after policy exceptions are encoded via CSP_*_SRC_EXTRA.
const CSP_ENFORCED = process.env.CSP_ENFORCE === 'true'
// Switch path for API responses: this key flips from Report-Only to enforce.
const CSP_HEADER_KEY = CSP_ENFORCED
  ? 'Content-Security-Policy'
  : 'Content-Security-Policy-Report-Only'

function parseCspExtras(rawValue: string | undefined): string[] {
  if (!rawValue) {
    return []
  }

  return rawValue
    .split(/[\s,]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function buildCspValue() {
  const scriptExtras = parseCspExtras(process.env.CSP_SCRIPT_SRC_EXTRA)
  const styleExtras = parseCspExtras(process.env.CSP_STYLE_SRC_EXTRA)

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "font-src 'self' data:",
    ["style-src", "'self'", "'unsafe-inline'", ...styleExtras].join(' '),
    ["script-src", "'self'", "'unsafe-inline'", "'unsafe-eval'", "'strict-dynamic'", ...scriptExtras].join(' '),
    "connect-src 'self' https: wss:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ].join('; ')
}

const SECURITY_HEADERS = {
  [CSP_HEADER_KEY]: buildCspValue(),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy':
    'accelerometer=(), autoplay=(), camera=(), display-capture=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), fullscreen=(self)',
} as const

function applySecurityHeaders(response: NextResponse) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!response.headers.has(key)) {
      response.headers.set(key, value)
    }
  }

  return response
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
      return applySecurityHeaders(
        NextResponse.json(
        { error: 'Invalid request origin.' },
        { status: 403 }
        )
      )
    }

    const csrfCookie = request.cookies.get(CSRF_COOKIE_NAME)?.value
    const csrfHeader = request.headers.get('x-csrf-token')

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return applySecurityHeaders(
        NextResponse.json(
        { error: 'Invalid CSRF token.' },
        { status: 403 }
        )
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
    return applySecurityHeaders(ensureCsrfCookie(request, response))
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
      return applySecurityHeaders(ensureCsrfCookie(request, response))
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
      return applySecurityHeaders(ensureCsrfCookie(request, response))
    }
  }

  const response = NextResponse.next()
  return applySecurityHeaders(ensureCsrfCookie(request, response))
}

export const config = {
  matcher: ['/api/:path*'],
}
