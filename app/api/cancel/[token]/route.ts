import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { BookingStatus } from '@/lib/types'

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
    }
  }

  if (error instanceof Error) {
    (baseResponse.details as any).message = error.message
    if (process.env.NODE_ENV === 'development') {
      (baseResponse.details as any).stack = error.stack
    }
  } else {
    (baseResponse.details as any).message = String(error)
  }

  return baseResponse
}

interface CancelBookingParams {
  params: Promise<{ token: string }>
}

export async function POST(request: Request, { params }: CancelBookingParams) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json(
        { error: 'Cancellation token is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Find the booking by cancellation token
    const booking = await db.collection('bookings').findOne({
      cancellationToken: token,
      status: { $ne: BookingStatus.CANCELLED }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Invalid or expired cancellation token' },
        { status: 404 }
      )
    }

    // Update the booking status to cancelled
    const updateResult = await db.collection('bookings').updateOne(
      { _id: booking._id },
      {
        $set: {
          status: BookingStatus.CANCELLED,
          updatedAt: new Date()
        }
      }
    )

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to cancel booking' },
        { status: 500 }
      )
    }

    // Remove the booking from the therapist's bookings array
    await db.collection('therapists').updateOne(
      { _id: booking.therapistId },
      [
        {
          $set: {
            bookings: {
              $filter: {
                input: '$bookings',
                cond: {
                  $ne: ['$$this._id', booking._id]
                }
              }
            },
            updatedAt: new Date()
          }
        }
      ]
    )

    return NextResponse.json({
      message: 'Booking cancelled successfully',
      booking: {
        _id: booking._id,
        patientName: booking.patientName,
        patientEmail: booking.patientEmail,
        appointmentDate: booking.appointmentDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        therapistId: booking.therapistId,
        status: BookingStatus.CANCELLED
      }
    })

  } catch (error) {
    console.error('Cancel booking error:', error)
    return NextResponse.json(
      createErrorResponse(error, 'POST /api/cancel/[token]'),
      { status: 500 }
    )
  }
}

// GET endpoint to show cancellation confirmation page
export async function GET(request: Request, { params }: CancelBookingParams) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json(
        { error: 'Cancellation token is required' },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Find the booking by cancellation token
    const booking = await db.collection('bookings').findOne({
      cancellationToken: token,
      status: { $ne: BookingStatus.CANCELLED }
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Invalid or expired cancellation token' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      booking: {
        _id: booking._id,
        patientName: booking.patientName,
        patientEmail: booking.patientEmail,
        appointmentDate: booking.appointmentDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        therapistId: booking.therapistId,
        status: booking.status
      }
    })

  } catch (error) {
    console.error('Get booking for cancellation error:', error)
    return NextResponse.json(
      createErrorResponse(error, 'GET /api/cancel/[token]'),
      { status: 500 }
    )
  }
}
