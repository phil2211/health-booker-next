import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { locales, defaultLocale, type Locale } from './lib/i18n'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  
  // Skip middleware for API routes, static files, and Next.js internals
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next()
  }
  
  // Check for locale in URL path
  const pathSegments = pathname.split('/').filter(Boolean)
  const firstSegment = pathSegments[0]
  
  let locale: Locale = defaultLocale
  let rewritePathname = pathname
  let hasLocaleInUrl = false
  
  // If first segment is a locale, extract it and prepare rewrite
  if (locales.includes(firstSegment as Locale)) {
    locale = firstSegment as Locale
    hasLocaleInUrl = true
    // Remove locale from path for internal routing
    const remainingPath = pathSegments.slice(1).join('/')
    rewritePathname = remainingPath ? `/${remainingPath}` : '/'
  } else {
    // Check cookie
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value as Locale | undefined
    if (cookieLocale && locales.includes(cookieLocale)) {
      locale = cookieLocale
    } else {
      // Check Accept-Language header
      const acceptLanguage = request.headers.get('accept-language')
      if (acceptLanguage) {
        const browserLang = acceptLanguage.split(',')[0].split('-')[0]
        if (locales.includes(browserLang as Locale)) {
          locale = browserLang as Locale
        }
      }
    }
  }
  
  // Check for any NextAuth session cookies
  const allCookies = request.cookies.getAll()
  const hasSessionToken = allCookies.some(
    cookie => cookie.name.includes('session-token')
  )

  // Only protect /dashboard routes - therapist and book pages are public
  // Use rewritePathname for checking protected routes
  if (!hasSessionToken && (rewritePathname.startsWith('/dashboard') || pathname.startsWith('/dashboard'))) {
    const url = request.nextUrl.clone()
    // Redirect to login with locale prefix if locale was in original URL
    url.pathname = hasLocaleInUrl ? `/${locale}/login` : '/login'
    return NextResponse.redirect(url)
  }
  
  // If locale was in URL, rewrite to remove it for internal routing
  if (hasLocaleInUrl) {
    const url = request.nextUrl.clone()
    url.pathname = rewritePathname
    const response = NextResponse.rewrite(url)
    
    // Set locale cookie
    response.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })
    response.headers.set('x-locale', locale)
    
    return response
  }
  
  // No locale in URL - set cookie and header, continue normally
  const response = NextResponse.next()
  if (!request.cookies.get('NEXT_LOCALE')) {
    response.cookies.set('NEXT_LOCALE', locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  }
  response.headers.set('x-locale', locale)
  
  return response
}

// Protect these paths - only dashboard needs authentication
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

