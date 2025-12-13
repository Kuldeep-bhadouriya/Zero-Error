import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// This is a simple middleware that will be replaced with proper NextAuth middleware
// For now, we'll handle admin checks in the API routes themselves
export function middleware(request: NextRequest) {
  // Allow the request to pass through
  // Admin authentication will be checked in each API route
  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
