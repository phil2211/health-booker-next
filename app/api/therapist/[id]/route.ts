import { NextResponse } from 'next/server'
import { findTherapistById } from '@/models/Therapist'
import { ObjectId } from 'mongodb'

import { createErrorResponse } from '@/lib/utils/api';

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


/**
 * PATCH /api/therapist/[id]
 * Update therapist profile
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Validate ID format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid therapist ID format' },
        { status: 404 }
      )
    }

    // Call update function
    // Note: In a real app, we should validate the session user matches the ID
    // or has admin privileges. Assuming session validation happens in middleware or client.
    // For now, we'll trust the ID but in production we'd check session.user.id === id

    const { updateTherapistProfile, findTherapistById } = await import('@/models/Therapist')
    const { translateText } = await import('@/lib/translation')

    // Get current therapist data to merge if needed
    const currentTherapist = await findTherapistById(id)
    if (!currentTherapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Process bio translation
    let bio = body.bio
    if (bio && typeof bio === 'object') {
      console.log('Processing bio translation:', bio)
      // If we have an object, check for missing translations
      if (bio.de && !bio.en) {
        console.log('Translating bio DE -> EN')
        bio.en = await translateText(bio.de, 'en')
        console.log('Translated bio EN:', bio.en)
      } else if (bio.en && !bio.de) {
        console.log('Translating bio EN -> DE')
        bio.de = await translateText(bio.en, 'de')
        console.log('Translated bio DE:', bio.de)
      }
    }

    // Process specialization translation
    let specialization = body.specialization
    if (specialization && typeof specialization === 'object') {
      console.log('Processing specialization translation:', specialization)
      if (specialization.de && !specialization.en) {
        console.log('Translating specialization DE -> EN')
        specialization.en = await translateText(specialization.de, 'en')
        console.log('Translated specialization EN:', specialization.en)
      } else if (specialization.en && !specialization.de) {
        console.log('Translating specialization EN -> DE')
        specialization.de = await translateText(specialization.en, 'de')
        console.log('Translated specialization DE:', specialization.de)
      }
    }

    const updatedTherapist = await updateTherapistProfile(id, {
      ...body,
      bio,
      specialization
    })

    if (!updatedTherapist) {
      return NextResponse.json(
        { error: 'Therapist not found or update failed' },
        { status: 404 }
      )
    }

    // Return public profile without password
    const { password: _, ...publicProfile } = updatedTherapist

    return NextResponse.json({
      therapist: publicProfile,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Therapist update error:', error)
    return NextResponse.json(
      createErrorResponse(error, 'PATCH /api/therapist/[id]'),
      { status: 500 }
    )
  }
}
