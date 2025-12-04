import { NextResponse } from 'next/server'
import { getAuthenticatedTherapist, requireAuth } from '@/lib/auth'
import {
  updateTherapistAvailability,
  validateAvailabilityEntry,
  validateBlockedSlot,
} from '@/models/Therapist'
import { AvailabilityEntry, BlockedSlot, TherapyOffering } from '@/lib/types'
import { ObjectId } from 'mongodb'
import { translateText } from '@/lib/translation'

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

    const { weeklyAvailability, blockedSlots, therapyOfferings } = body

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

    // Validate therapy offerings if provided
    if (therapyOfferings !== undefined) {
      if (!Array.isArray(therapyOfferings)) {
        return NextResponse.json(
          createErrorResponse(new Error('therapyOfferings must be an array'), 'PUT /api/therapist/availability', 400),
          { status: 400 }
        )
      }

      // Process translations for therapy offerings
      console.log('Processing therapy offerings translation')
      for (const offering of therapyOfferings) {
        // Translate Name
        if (offering.name && typeof offering.name === 'object') {
          if (offering.name.de && !offering.name.en) {
            console.log(`Translating offering name DE -> EN: ${offering.name.de}`)
            offering.name.en = await translateText(offering.name.de, 'en')
          } else if (offering.name.en && !offering.name.de) {
            console.log(`Translating offering name EN -> DE: ${offering.name.en}`)
            offering.name.de = await translateText(offering.name.en, 'de')
          }
        }

        // Translate Description
        if (offering.description && typeof offering.description === 'object') {
          if (offering.description.de && !offering.description.en) {
            console.log(`Translating offering description DE -> EN: ${offering.description.de}`)
            offering.description.en = await translateText(offering.description.de, 'en')
          } else if (offering.description.en && !offering.description.de) {
            console.log(`Translating offering description EN -> DE: ${offering.description.en}`)
            offering.description.de = await translateText(offering.description.en, 'de')
          }
        }
      }

      for (let i = 0; i < therapyOfferings.length; i++) {
        const offering = therapyOfferings[i] as TherapyOffering

        // Validate required fields
        if (!offering.name || !offering.description) {
          return NextResponse.json(
            createErrorResponse(new Error(`Therapy offering at index ${i} must have name and description`), 'PUT /api/therapist/availability', 400),
            { status: 400 }
          )
        }

        if (typeof offering.duration !== 'number' || offering.duration < 15 || offering.duration > 240) {
          return NextResponse.json(
            createErrorResponse(new Error(`Therapy offering at index ${i} must have duration between 15 and 240 minutes`), 'PUT /api/therapist/availability', 400),
            { status: 400 }
          )
        }

        if (typeof offering.breakDuration !== 'number' || offering.breakDuration < 0 || offering.breakDuration > 60) {
          return NextResponse.json(
            createErrorResponse(new Error(`Therapy offering at index ${i} must have breakDuration between 0 and 60 minutes`), 'PUT /api/therapist/availability', 400),
            { status: 400 }
          )
        }

        if (typeof offering.price !== 'number' || offering.price < 0) {
          return NextResponse.json(
            createErrorResponse(new Error(`Therapy offering at index ${i} must have a valid price`), 'PUT /api/therapist/availability', 400),
            { status: 400 }
          )
        }

        if (typeof offering.isActive !== 'boolean') {
          return NextResponse.json(
            createErrorResponse(new Error(`Therapy offering at index ${i} must have isActive as boolean`), 'PUT /api/therapist/availability', 400),
            { status: 400 }
          )
        }
      }
    }

    // Update availability
    const updatedTherapist = await updateTherapistAvailability(
      therapistId,
      weeklyAvailability,
      blockedSlots,
      therapyOfferings
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
      therapyOfferings: updatedTherapist.therapyOfferings || [],
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
      therapyOfferings: therapist.therapyOfferings || [],
      bio: therapist.bio,
      specialization: therapist.specialization,
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

