import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Check for any NextAuth session cookies
  const allCookies = request.cookies.getAll()
  const hasSessionToken = allCookies.some(
    cookie => cookie.name.includes('session-token')
  )

  // Only protect /dashboard routes - therapist and book pages are public
  if (!hasSessionToken && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

// Protect these paths - only dashboard needs authentication
export const config = {
  matcher: ['/dashboard/:path*'],
}

