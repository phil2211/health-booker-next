import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { findTherapistById } from '@/models/Therapist'
import { getBookingsByTherapistAndDateRange } from '@/models/Booking'
import { calculateAvailableSlots } from '@/lib/utils/availability'

export const runtime = 'nodejs'

/**
 * GET /api/therapist/[id]/availability
 * Get available time slots for booking within a date range
 * 
 * Public endpoint - no authentication required
 * Query params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
 * Returns: Array of time slots with status and metadata
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Validate therapist ID format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid therapist ID format' },
        { status: 404 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Validate date parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate query parameters are required (YYYY-MM-DD format)' },
        { status: 400 }
      )
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Validate that startDate <= endDate
    const startDateObj = new Date(startDate + 'T00:00:00.000Z')
    const endDateObj = new Date(endDate + 'T00:00:00.000Z')
    
    if (startDateObj > endDateObj) {
      return NextResponse.json(
        { error: 'startDate must be before or equal to endDate' },
        { status: 400 }
      )
    }

    // Get therapist
    const therapist = await findTherapistById(id)
    
    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Get existing bookings for the date range
    const existingBookings = await getBookingsByTherapistAndDateRange(
      id,
      startDate,
      endDate
    )

    // Calculate available slots
    const slots = calculateAvailableSlots(
      therapist,
      startDate,
      endDate,
      existingBookings
    )

    return NextResponse.json({
      slots,
      therapistId: id,
      startDate,
      endDate,
    })
  } catch (error) {
    console.error('Get available slots error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

