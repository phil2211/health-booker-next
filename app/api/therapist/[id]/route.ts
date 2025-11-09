import { NextResponse } from 'next/server'
import { findTherapistById } from '@/models/Therapist'
import { ObjectId } from 'mongodb'

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
 * GET /api/therapist/[id]
 * Get public therapist profile
 * 
 * Requires: Therapist ID as URL parameter
 * Returns: Therapist public profile (name, specialization, bio, photoUrl)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate ID format (MongoDB ObjectId)
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid therapist ID format' },
        { status: 404 }
      )
    }

    // Find therapist by ID
    const therapist = await findTherapistById(id)

    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Return public profile without password
    const { password: _, ...publicProfile } = therapist

    return NextResponse.json({
      therapist: publicProfile,
    })
  } catch (error) {
    console.error('Therapist profile error:', error)
    return NextResponse.json(
      createErrorResponse(error, 'GET /api/therapist/[id]'),
      { status: 500 }
    )
  }
}

