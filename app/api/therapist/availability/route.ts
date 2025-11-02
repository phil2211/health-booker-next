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
        { error: 'Invalid therapist ID format' },
        { status: 400 }
      )
    }

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    const { weeklyAvailability, blockedSlots } = body

    // Validate that at least one field is provided
    if (weeklyAvailability === undefined && blockedSlots === undefined) {
      return NextResponse.json(
        { error: 'Either weeklyAvailability or blockedSlots must be provided' },
        { status: 400 }
      )
    }

    // Validate weekly availability if provided
    if (weeklyAvailability !== undefined) {
      if (!Array.isArray(weeklyAvailability)) {
        return NextResponse.json(
          { error: 'weeklyAvailability must be an array' },
          { status: 400 }
        )
      }

      for (let i = 0; i < weeklyAvailability.length; i++) {
        const entry = weeklyAvailability[i] as AvailabilityEntry
        
        if (!validateAvailabilityEntry(entry)) {
          return NextResponse.json(
            {
              error: `Invalid availability entry at index ${i}`,
              details: 'Each entry must have valid dayOfWeek (0-6), startTime, and endTime (HH:MM format). Start time must be before end time.',
            },
            { status: 400 }
          )
        }
      }
    }

    // Validate blocked slots if provided
    if (blockedSlots !== undefined) {
      if (!Array.isArray(blockedSlots)) {
        return NextResponse.json(
          { error: 'blockedSlots must be an array' },
          { status: 400 }
        )
      }

      for (let i = 0; i < blockedSlots.length; i++) {
        const slot = blockedSlots[i] as BlockedSlot
        
        if (!validateBlockedSlot(slot)) {
          return NextResponse.json(
            {
              error: `Invalid blocked slot at index ${i}`,
              details: 'Each slot must have valid date (YYYY-MM-DD), startTime, and endTime (HH:MM format). Start time must be before end time.',
            },
            { status: 400 }
          )
        }
      }
    }

    // Verify therapist exists
    const therapist = await findTherapistById(therapistId)
    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
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
        { error: 'Failed to update availability' },
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
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if it's an ObjectId error
    if (error instanceof Error && (error.message.includes('ObjectId') || error.message.includes('BSON'))) {
      console.error('Invalid therapist ID format:', therapistId)
      return NextResponse.json(
        { error: 'Invalid therapist ID format' },
        { status: 400 }
      )
    }

    // Provide more detailed error message if available
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    
    return NextResponse.json(
      { error: errorMessage },
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
        { error: 'Therapist not found' },
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

