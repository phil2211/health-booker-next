import { NextResponse } from 'next/server'
import { 
  createTherapist, 
  findTherapistByEmail, 
  validateTherapistInput,
  hashPassword,
  ensureEmailIndex 
} from '@/models/Therapist'
import { isValidEmail } from '@/lib/utils/validation'

// Ensure this route runs in Node.js runtime (not Edge) to support MongoDB
export const runtime = 'nodejs'

/**
 * POST /api/auth/register
 * Create a new therapist account
 * 
 * Body: { email, password, name, specialization, bio }
 * Returns: Therapist profile without password
 */
export async function POST(request: Request) {
  try {
    // Ensure email index exists
    await ensureEmailIndex()

    // Parse request body
    const body = await request.json()
    const { email, password, name, specialization, bio, photoUrl } = body

    // Validate input
    const validation = validateTherapistInput({ email, password, name, specialization, bio })
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingTherapist = await findTherapistByEmail(email)
    if (existingTherapist) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create therapist account
    const therapist = await createTherapist(
      email,
      hashedPassword,
      name,
      specialization,
      bio,
      photoUrl
    )

    // Return therapist profile without password
    const { password: _, ...therapistProfile } = therapist

    return NextResponse.json(
      {
        message: 'Therapist registered successfully',
        therapist: therapistProfile,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

