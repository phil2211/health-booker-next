import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

/**
 * Helper function to create detailed error responses
 */
function createErrorResponse(error: unknown, functionName: string, statusCode: number = 500): { error: string; details?: { function: string; message?: string; stack?: string } } {
  let errorMessage: string
  if (statusCode === 500) {
    errorMessage = 'Internal server error'
  } else if (statusCode === 404) {
    errorMessage = 'Not found'
  } else if (statusCode === 401) {
    errorMessage = 'Unauthorized'
  } else if (statusCode === 400) {
    errorMessage = 'Bad request'
  } else {
    errorMessage = 'Request failed'
  }

  const baseResponse = {
    error: errorMessage,
    details: {
      function: functionName,
    } as { function: string; message?: string; stack?: string }
  }

  if (error instanceof Error) {
    baseResponse.details.message = error.message
    if (process.env.NODE_ENV === 'development') {
      baseResponse.details.stack = error.stack
    }
  } else {
    baseResponse.details.message = String(error)
  }

  return baseResponse
}

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

