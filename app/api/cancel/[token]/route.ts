import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { BookingStatus, Patient, Booking } from '@/lib/types'
import { findTherapistById } from '@/models/Therapist'
import { sendCancellationEmail } from '@/lib/email'
import { convertMongoBookingToBooking, createPatientFromBooking, normalizeTherapistId } from '@/lib/utils/booking'

import { createErrorResponse } from '@/lib/utils/api';

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

    // Send cancellation email
    const therapistIdStr = normalizeTherapistId(booking.therapistId);
    const therapist = await findTherapistById(therapistIdStr);
    if (therapist) {
        const patient = createPatientFromBooking(booking);
        const bookingForEmail = convertMongoBookingToBooking(booking);
        await sendCancellationEmail(bookingForEmail, therapist, patient);
    }


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
