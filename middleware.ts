import createMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const nextIntlMiddleware = createMiddleware({
  locales: ['en', 'de'],
  defaultLocale: 'en',
  localeDetection: true, // Enable automatic locale detection
})

export default function middleware(request: NextRequest) {
  // Run next-intl middleware first to handle locale routing
  const response = nextIntlMiddleware(request)

  const pathname = request.nextUrl.pathname

  // Check for any NextAuth session cookies
  const allCookies = request.cookies.getAll()
  const hasSessionToken = allCookies.some(
    cookie => cookie.name.includes('session-token')
  )

  // Only protect /dashboard routes - therapist and book pages are public
  // Note: pathname will now include locale prefix like /en/dashboard
  if (!hasSessionToken && pathname.includes('/dashboard')) {
    const url = request.nextUrl.clone()
    // Redirect to login with the same locale
    const locale = pathname.split('/')[1] || 'en'
    url.pathname = `/${locale}/login`
    return NextResponse.redirect(url)
  }

  return response
}

// Match all paths except static files and API routes
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}

