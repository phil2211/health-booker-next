import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

// Ensure this route runs in Node.js runtime (not Edge) to support MongoDB
export const runtime = 'nodejs'

/**
 * GET /api/therapist/booking-url
 * Get booking URL for authenticated therapist
 * 
 * Requires: Authentication
 * Returns: Unique booking URL for the therapist
 */
export async function GET() {
  try {
    // Require authentication
    const session = await requireAuth()

    // Extract therapist ID from session
    const therapistId = session.user.id

    // Get base URL from environment variable
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
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
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

