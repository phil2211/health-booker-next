import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth'
import { updateBookingById, cancelBookingById } from '@/models/Booking'
import { BookingStatus } from '@/lib/types'

export const runtime = 'nodejs'

interface UpdateBookingRequest {
  notes?: string
  status?: BookingStatus
}

interface BookingParams {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/therapist/bookings/[id]
 * Update booking details (notes, status) - therapist operations only
 */
export async function PATCH(request: NextRequest, { params }: BookingParams) {
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

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      if (error.message.includes('Invalid') || error.message.includes('Only')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
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

    // Cancel the booking
    const cancelledBooking = await cancelBookingById(id, therapistId)

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

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('access denied') || error.message.includes('already cancelled')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        )
      }
      if (error.message.includes('Invalid')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
