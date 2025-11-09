import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { rescheduleBooking } from '@/models/Booking'

/**
 * Helper function to create detailed error responses
 */
function createErrorResponse(error: unknown, functionName: string, statusCode: number = 500): { error: string; details?: { function: string; message?: string; stack?: string } } {
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
    } as { function: string; message?: string; stack?: string }
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

interface RescheduleBookingRequest {
  appointmentDate: string // YYYY-MM-DD format
  startTime: string // HH:MM format
  endTime: string // HH:MM format
}

interface BookingParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/therapist/bookings/[id]/reschedule
 * Reschedule a booking to a new date/time
 */
export async function POST(request: NextRequest, { params }: BookingParams) {
  try {
    const session = await getAuthSession()

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = await params
    const therapistId = session.user.id

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    const body: RescheduleBookingRequest = await request.json()

    // Validate required fields
    if (!body.appointmentDate || !body.startTime || !body.endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: appointmentDate, startTime, endTime' },
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
        { error: 'Cannot reschedule to a past date' },
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

    // Reschedule the booking
    const rescheduledBooking = await rescheduleBooking(
      id,
      therapistId,
      body.appointmentDate,
      body.startTime,
      body.endTime
    )

    if (!rescheduledBooking) {
      return NextResponse.json(
        { error: 'Booking not found, access denied, or not in confirmed status' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      booking: rescheduledBooking,
      message: 'Booking rescheduled successfully'
    })

  } catch (error) {
    console.error('Reschedule therapist booking error:', error)

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied') || error.message.includes('not in confirmed status')) {
        return NextResponse.json(
          createErrorResponse(error, 'rescheduleBooking', 404),
          { status: 404 }
        )
      }
      if (error.message.includes('Invalid') || error.message.includes('Cannot') || error.message.includes('conflict')) {
        return NextResponse.json(
          createErrorResponse(error, 'rescheduleBooking', 400),
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      createErrorResponse(error, 'POST /api/therapist/bookings/[id]/reschedule'),
      { status: 500 }
    )
  }
}
