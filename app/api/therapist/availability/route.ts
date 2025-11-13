import { NextResponse } from 'next/server'
import { getAuthenticatedTherapist, requireAuth } from '@/lib/auth'
import {
  updateTherapistAvailability,
  validateAvailabilityEntry,
  validateBlockedSlot,
} from '@/models/Therapist'
import { AvailabilityEntry, BlockedSlot } from '@/lib/types'
import { ObjectId } from 'mongodb'

import { createErrorResponse } from '@/lib/utils/api';

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
    const therapist = await getAuthenticatedTherapist();
    const therapistId = therapist._id.toString();

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

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          createErrorResponse(error, 'getAuthenticatedTherapist', 401),
          { status: 401 }
        )
      }
      if (error.message.includes('Therapist not found')) {
        return NextResponse.json(
          createErrorResponse(error, 'getAuthenticatedTherapist', 404),
          { status: 404 }
        )
      }
      if (error.message.includes('ObjectId') || error.message.includes('BSON')) {
        return NextResponse.json(
          createErrorResponse(error, 'PUT /api/therapist/availability', 400),
          { status: 400 }
        )
      }
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
    const therapist = await getAuthenticatedTherapist();

    // Return availability
    return NextResponse.json({
      weeklyAvailability: therapist.weeklyAvailability,
      blockedSlots: therapist.blockedSlots,
    })
  } catch (error) {
    console.error('Get availability error:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          createErrorResponse(error, 'getAuthenticatedTherapist', 401),
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
      createErrorResponse(error, 'GET /api/therapist/availability'),
      { status: 500 }
    )
  }
}

