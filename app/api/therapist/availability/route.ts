import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import {
  findTherapistById,
  updateTherapistAvailability,
  validateAvailabilityEntry,
  validateBlockedSlot,
} from '@/models/Therapist'
import { AvailabilityEntry, BlockedSlot } from '@/lib/types'
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

export const runtime = 'nodejs'

/**
 * PUT /api/therapist/availability
 * Update therapist's weekly availability and/or blocked slots
 * 
 * Requires: Authentication
 * Returns: Updated availability data
 */
export async function PUT(request: Request) {
  try {
    // Require authentication
    const session = await requireAuth()
    const therapistId = session.user.id

    // Validate therapist ID format
    if (!ObjectId.isValid(therapistId)) {
      console.error('Invalid therapist ID format:', therapistId)
      return NextResponse.json(
        createErrorResponse(new Error('Invalid therapist ID format'), 'PUT /api/therapist/availability', 400),
        { status: 400 }
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        createErrorResponse(parseError, 'PUT /api/therapist/availability', 400),
        { status: 400 }
      )
    }

    const { weeklyAvailability, blockedSlots } = body

    // Validate that at least one field is provided
    if (weeklyAvailability === undefined && blockedSlots === undefined) {
      return NextResponse.json(
        createErrorResponse(new Error('Either weeklyAvailability or blockedSlots must be provided'), 'PUT /api/therapist/availability', 400),
        { status: 400 }
      )
    }

    // Validate weekly availability if provided
    if (weeklyAvailability !== undefined) {
      if (!Array.isArray(weeklyAvailability)) {
        return NextResponse.json(
          createErrorResponse(new Error('weeklyAvailability must be an array'), 'PUT /api/therapist/availability', 400),
          { status: 400 }
        )
      }

      for (let i = 0; i < weeklyAvailability.length; i++) {
        const entry = weeklyAvailability[i] as AvailabilityEntry

        if (!validateAvailabilityEntry(entry)) {
          return NextResponse.json(
            createErrorResponse(new Error(`Invalid availability entry at index ${i}`), 'PUT /api/therapist/availability', 400),
            { status: 400 }
          )
        }
      }
    }

    // Validate blocked slots if provided
    if (blockedSlots !== undefined) {
      if (!Array.isArray(blockedSlots)) {
        return NextResponse.json(
          createErrorResponse(new Error('blockedSlots must be an array'), 'PUT /api/therapist/availability', 400),
          { status: 400 }
        )
      }

      for (let i = 0; i < blockedSlots.length; i++) {
        const slot = blockedSlots[i] as BlockedSlot

        if (!validateBlockedSlot(slot)) {
          return NextResponse.json(
            createErrorResponse(new Error(`Invalid blocked slot at index ${i}`), 'PUT /api/therapist/availability', 400),
            { status: 400 }
          )
        }
      }
    }

    // Verify therapist exists
    const therapist = await findTherapistById(therapistId)
    if (!therapist) {
      return NextResponse.json(
        createErrorResponse(new Error('Therapist not found'), 'PUT /api/therapist/availability', 404),
        { status: 404 }
      )
    }

    // Update availability
    const updatedTherapist = await updateTherapistAvailability(
      therapistId,
      weeklyAvailability,
      blockedSlots
    )

    if (!updatedTherapist) {
      return NextResponse.json(
        createErrorResponse(new Error('Failed to update availability'), 'PUT /api/therapist/availability', 500),
        { status: 500 }
      )
    }

    // Return updated availability
    return NextResponse.json({
      weeklyAvailability: updatedTherapist.weeklyAvailability,
      blockedSlots: updatedTherapist.blockedSlots,
      message: 'Availability updated successfully',
    })
  } catch (error) {
    console.error('Update availability error:', error)

    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        createErrorResponse(error, 'requireAuth', 401),
        { status: 401 }
      )
    }
    // Check if it's an ObjectId error
    if (error instanceof Error && (error.message.includes('ObjectId') || error.message.includes('BSON'))) {
      return NextResponse.json(
        createErrorResponse(error, 'PUT /api/therapist/availability', 400),
        { status: 400 }
      )
    }

    return NextResponse.json(
      createErrorResponse(error, 'PUT /api/therapist/availability'),
      { status: 500 }
    )
  }
}

/**
 * GET /api/therapist/availability
 * Get current availability settings for authenticated therapist
 * 
 * Requires: Authentication
 * Returns: Current weekly availability and blocked slots
 */
export async function GET() {
  try {
    // Require authentication
    const session = await requireAuth()
    const therapistId = session.user.id

    // Get therapist
    const therapist = await findTherapistById(therapistId)

    if (!therapist) {
      return NextResponse.json(
        createErrorResponse(new Error('Therapist not found'), 'GET /api/therapist/availability', 404),
        { status: 404 }
      )
    }

    // Return availability
    return NextResponse.json({
      weeklyAvailability: therapist.weeklyAvailability,
      blockedSlots: therapist.blockedSlots,
    })
  } catch (error) {
    console.error('Get availability error:', error)

    // Check if it's an authentication error
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        createErrorResponse(error, 'requireAuth', 401),
        { status: 401 }
      )
    }

    return NextResponse.json(
      createErrorResponse(error, 'GET /api/therapist/availability'),
      { status: 500 }
    )
  }
}

