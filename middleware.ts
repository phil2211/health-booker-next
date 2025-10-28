import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/route'

export default auth((req: NextRequest & { auth: any }) => {
  // If accessing a protected route without authentication
  if (!req.auth) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
})

// Protect these paths
export const config = {
  matcher: ['/dashboard/:path*', '/therapist/:path*'],
}

