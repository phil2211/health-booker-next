import { NextResponse } from 'next/server'
import { getAuthenticatedTherapist } from '@/lib/auth'
import { createErrorResponse } from '@/lib/utils/api';

// Ensure this route runs in Node.js runtime (not Edge) to support MongoDB
export const runtime = 'nodejs'

/**
 * GET /api/auth/verify
 * Verify authentication token and return current therapist profile
 * 
 * Returns: Current therapist profile (without password)
 */
export async function GET() {
  try {
    const therapist = await getAuthenticatedTherapist();

    // Return therapist profile without password
    const { password: _, ...therapistProfile } = therapist

    return NextResponse.json({
      therapist: therapistProfile,
      authenticated: true,
    })
  } catch (error) {
    console.error('Verification error:', error)
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          createErrorResponse(error, 'requireAuth', 401),
          { status: 401 }
        )
      }
      if (error.message.includes('Therapist not found')) {
        return NextResponse.json(
          createErrorResponse(error, 'getAuthenticatedTherapist', 404),
          { status: 404 }
        )
      }
    }
    return NextResponse.json(
      createErrorResponse(error, 'GET /api/auth/verify'),
      { status: 500 }
    )
  }
}

