import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Proxy configuration for Next.js 16
// This replaces the deprecated middleware.ts file
export function proxy(request: NextRequest) {
  // Allow the request to pass through
  // Admin authentication will be checked in each API route
  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
