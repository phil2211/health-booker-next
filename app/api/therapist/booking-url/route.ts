import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

import { createErrorResponse } from '@/lib/utils/api';

// Ensure this route runs in Node.js runtime (not Edge) to support MongoDB
export const runtime = 'nodejs'

/**
 * GET /api/therapist/booking-url
 * Get booking URL for authenticated therapist
 * 
 * Requires: Authentication
 * Returns: Unique booking URL for the therapist
 */
export async function GET(request: Request) {
  try {
    // Require authentication
    const session = await requireAuth()

    // Extract therapist ID from session
    const therapistId = session.user.id

    // Get base URL dynamically from request headers (Vercel provides this automatically)
    let baseUrl: string
    
    // Check for Vercel environment variables first
    if (process.env.VERCEL_URL) {
      // Vercel provides VERCEL_URL in the format: your-app.vercel.app
      baseUrl = `https://${process.env.VERCEL_URL}`
    } else if (process.env.NEXT_PUBLIC_BASE_URL) {
      // Use explicitly set base URL
      baseUrl = process.env.NEXT_PUBLIC_BASE_URL
    } else {
      // Fallback: try to get from request headers
      const url = new URL(request.url)
      baseUrl = `${url.protocol}//${url.host}`
    }
    
    // Remove trailing slash if present to avoid double slashes
    baseUrl = baseUrl.replace(/\/+$/, '')
    
    const bookingUrl = `${baseUrl}/book/${therapistId}`

    return NextResponse.json({
      bookingUrl,
      therapistId,
    })
  } catch (error) {
    console.error('Booking URL error:', error)

    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        createErrorResponse(error, 'requireAuth', 401),
        { status: 401 }
      )
    }

    return NextResponse.json(
      createErrorResponse(error, 'GET /api/therapist/booking-url'),
      { status: 500 }
    )
  }
}

