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
    const contentType = request.headers.get('content-type') || ''

    // Validate ID format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid therapist ID format' },
        { status: 404 }
      )
    }

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

    let updateData: any = {}
    let bio: any
    let specialization: any

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()

      // Extract basic fields
      updateData.name = formData.get('name') as string
      updateData.address = formData.get('address') as string
      updateData.zip = formData.get('zip') as string
      updateData.city = formData.get('city') as string
      updateData.phoneNumber = formData.get('phoneNumber') as string
      updateData.linkedinUrl = formData.get('linkedinUrl') as string
      updateData.gender = formData.get('gender') as string

      // Extract and parse JSON fields
      const bioStr = formData.get('bio') as string
      if (bioStr) {
        try {
          bio = JSON.parse(bioStr)
        } catch (e) {
          console.error('Error parsing bio JSON:', e)
        }
      }

      const specializationStr = formData.get('specialization') as string
      if (specializationStr) {
        try {
          specialization = JSON.parse(specializationStr)
        } catch (e) {
          console.error('Error parsing specialization JSON:', e)
        }
      }

      // Handle image upload
      const file = formData.get('profileImage') as File
      if (file) {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        updateData.profileImage = {
          data: buffer,
          contentType: file.type
        }
      }
    } else {
      // Handle JSON request (legacy/existing)
      const body = await request.json()
      updateData = { ...body }
      bio = body.bio
      specialization = body.specialization
    }

    // Process bio translation
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

    // Specialization is now an array of IDs, no translation needed

    const updatedTherapist = await updateTherapistProfile(id, {
      ...updateData,
      bio,
      specialization,
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
