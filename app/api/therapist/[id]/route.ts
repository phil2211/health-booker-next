import { NextResponse } from 'next/server'
import { findTherapistById } from '@/models/Therapist'
import { ObjectId } from 'mongodb'

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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

