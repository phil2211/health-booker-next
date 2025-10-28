import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Check for any NextAuth session cookies
  const allCookies = request.cookies.getAll()
  const hasSessionToken = allCookies.some(
    cookie => cookie.name.includes('session-token')
  )

  // Only protect /dashboard routes
  // /therapist/[id] should be public (for viewing therapist profiles)
  // /book/[id] should be public (for booking appointments)
  if (!hasSessionToken && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Protect these paths
// Note: matcher still includes /therapist to run middleware
// but the actual protection logic only guards /dashboard
export const config = {
  matcher: ['/dashboard/:path*', '/therapist/:path*', '/book/:path*'],
}

