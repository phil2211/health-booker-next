import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getBookingById, updateBookingById, cancelBookingById } from '@/models/Booking'
import { BookingStatus } from '@/lib/types'

import { createErrorResponse } from '@/lib/utils/api';

export const runtime = 'nodejs'

interface UpdateBookingRequest {
  notes?: string
  status?: BookingStatus
}

interface CancelBookingRequest {
  cancellationNote?: string
}

interface BookingParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/therapist/bookings/[id]
 * Fetch a specific booking by ID (therapist operations only)
 */
export async function GET(request: NextRequest, { params }: BookingParams) {
  try {
    const session = await requireAuth()
    const therapistId = session.user.id

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // Fetch the booking
    const booking = await getBookingById(id, therapistId)

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      booking,
      message: 'Booking retrieved successfully'
    })

  } catch (error) {
    console.error('Fetch therapist booking error:', error)

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        createErrorResponse(error, 'requireAuth', 401),
        { status: 401 }
      )
    }

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return NextResponse.json(
          createErrorResponse(error, 'getBookingById', 404),
          { status: 404 }
        )
      }
      if (error.message.includes('Invalid')) {
        return NextResponse.json(
          createErrorResponse(error, 'getBookingById', 400),
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      createErrorResponse(error, 'GET /api/therapist/bookings/[id]'),
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/therapist/bookings/[id]
 * Update booking details (notes, status) - therapist operations only
 */
export async function PATCH(request: NextRequest, { params }: BookingParams) {
  try {
    const session = await requireAuth()
    const therapistId = session.user.id

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    const body: UpdateBookingRequest = await request.json()

    // Validate request body
    if (!body.notes && !body.status) {
      return NextResponse.json(
        { error: 'At least one field (notes or status) must be provided' },
        { status: 400 }
      )
    }

    // Validate status if provided
    if (body.status && !Object.values(BookingStatus).includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: confirmed, completed, cancelled, no_show' },
        { status: 400 }
      )
    }

    // Validate status transition (only allow CONFIRMED -> COMPLETED/NO_SHOW)
    if (body.status && ![BookingStatus.COMPLETED, BookingStatus.NO_SHOW].includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status transition. Only COMPLETED and NO_SHOW are allowed for updates' },
        { status: 400 }
      )
    }

    // Update the booking
    const updatedBooking = await updateBookingById(id, therapistId, {
      notes: body.notes,
      status: body.status
    })

    if (!updatedBooking) {
      return NextResponse.json(
        { error: 'Booking not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      booking: updatedBooking,
      message: 'Booking updated successfully'
    })

  } catch (error) {
    console.error('Update therapist booking error:', error)

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        createErrorResponse(error, 'requireAuth', 401),
        { status: 401 }
      )
    }

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return NextResponse.json(
          createErrorResponse(error, 'updateBookingById', 404),
          { status: 404 }
        )
      }
      if (error.message.includes('Invalid') || error.message.includes('Only')) {
        return NextResponse.json(
          createErrorResponse(error, 'updateBookingById', 400),
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      createErrorResponse(error, 'PATCH /api/therapist/bookings/[id]'),
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/therapist/bookings/[id]
 * Cancel a booking (therapist-side cancellation)
 */
export async function DELETE(request: NextRequest, { params }: BookingParams) {
  try {
    const session = await requireAuth()
    const therapistId = session.user.id

    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      )
    }

    // Parse optional request body for cancellation note
    let cancellationNote: string | undefined
    try {
      const contentType = request.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const body: CancelBookingRequest = await request.json()
        cancellationNote = body.cancellationNote
      }
    } catch (error) {
      // Ignore parsing errors - body is optional
    }

    // Cancel the booking
    const cancelledBooking = await cancelBookingById(id, therapistId, cancellationNote)

    if (!cancelledBooking) {
      return NextResponse.json(
        { error: 'Booking not found, access denied, or already cancelled' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      booking: cancelledBooking,
      message: 'Booking cancelled successfully'
    })

  } catch (error) {
    console.error('Cancel therapist booking error:', error)

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        createErrorResponse(error, 'requireAuth', 401),
        { status: 401 }
      )
    }

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied') || error.message.includes('already cancelled')) {
        return NextResponse.json(
          createErrorResponse(error, 'cancelBookingById', 404),
          { status: 404 }
        )
      }
      if (error.message.includes('Invalid')) {
        return NextResponse.json(
          createErrorResponse(error, 'cancelBookingById', 400),
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      createErrorResponse(error, 'DELETE /api/therapist/bookings/[id]'),
      { status: 500 }
    )
  }
}
