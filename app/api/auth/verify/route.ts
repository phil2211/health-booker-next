import { NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { findTherapistById } from '@/models/Therapist'

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
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

