import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { BookingStatus } from '@/lib/types'
import { createBooking, checkBookingConflict } from '@/models/Booking'
import { findTherapistById } from '@/models/Therapist'
import { v4 as uuidv4 } from 'uuid'

/**
 * Helper function to create detailed error responses
 */
function createErrorResponse(error: unknown, functionName: string, statusCode: number = 500): { error: string; details?: { function: string; message: string; stack?: string } } {
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
    }
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

interface CreateBookingRequest {
  therapistId: string
  patientName: string
  patientEmail: string
  patientPhone?: string
  appointmentDate: string // YYYY-MM-DD format
  startTime: string // HH:MM format
  endTime: string // HH:MM format
}

/**
 * POST /api/bookings
 * Create a new booking
 * 
 * Public endpoint - no authentication required
 */
export async function POST(request: Request) {
  try {
    const body: CreateBookingRequest = await request.json()

    // Validate required fields
    if (!body.therapistId || !body.patientName || !body.patientEmail || !body.appointmentDate || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: therapistId, patientName, patientEmail, appointmentDate, startTime, endTime' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.patientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate therapist ID format
    if (!ObjectId.isValid(body.therapistId)) {
      return NextResponse.json(
        { error: 'Invalid therapist ID format' },
        { status: 400 }
      )
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(body.appointmentDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Validate date is not in the past
    const appointmentDate = new Date(body.appointmentDate + 'T00:00:00.000Z')
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    
    if (appointmentDate < today) {
      return NextResponse.json(
        { error: 'Cannot book appointments in the past' },
        { status: 400 }
      )
    }

    // Validate time format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
    if (!timeRegex.test(body.startTime) || !timeRegex.test(body.endTime)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM' },
        { status: 400 }
      )
    }

    // Check if therapist exists
    const therapist = await findTherapistById(body.therapistId)
    if (!therapist) {
      return NextResponse.json(
        { error: 'Therapist not found' },
        { status: 404 }
      )
    }

    // Check for booking conflicts
    const hasConflict = await checkBookingConflict(
      body.therapistId,
      body.appointmentDate,
      body.startTime,
      body.endTime
    )

    if (hasConflict) {
      return NextResponse.json(
        { error: 'Time slot is already booked' },
        { status: 409 }
      )
    }

    // Generate cancellation token
    const cancellationToken = uuidv4()

    // Create booking
    const booking = await createBooking({
      therapistId: body.therapistId,
      patientName: body.patientName,
      patientEmail: body.patientEmail,
      patientPhone: body.patientPhone,
      appointmentDate: body.appointmentDate,
      startTime: body.startTime,
      endTime: body.endTime,
      status: BookingStatus.CONFIRMED,
      cancellationToken,
    })

    return NextResponse.json({
      booking: {
        _id: booking._id,
        therapistId: booking.therapistId,
        patientName: booking.patientName,
        patientEmail: booking.patientEmail,
        appointmentDate: booking.appointmentDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        cancellationToken: booking.cancellationToken,
      },
      message: 'Booking created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Create booking error:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('conflict') || error.message.includes('already booked')) {
        return NextResponse.json(
          createErrorResponse(error, 'createBooking', 409),
          { status: 409 }
        )
      }
      if (error.message.includes('Invalid booking data')) {
        return NextResponse.json(
          createErrorResponse(error, 'createBooking', 400),
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      createErrorResponse(error, 'POST /api/bookings'),
      { status: 500 }
    )
  }
}

