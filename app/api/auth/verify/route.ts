import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { findTherapistById } from '@/models/Therapist'

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
    (baseResponse.details as any).message = error.message
    if (process.env.NODE_ENV === 'development') {
      (baseResponse.details as any).stack = error.stack
    }
  } else {
    (baseResponse.details as any).message = String(error)
  }

  return baseResponse
}

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
    const session = await getAuthSession()

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get therapist from database to return full profile
    const therapist = await findTherapistById(session.user.id)
    
    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Return therapist profile without password
    const { password: _, ...therapistProfile } = therapist

    return NextResponse.json({
      therapist: therapistProfile,
      authenticated: true,
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      createErrorResponse(error, 'GET /api/auth/verify'),
      { status: 500 }
    )
  }
}

