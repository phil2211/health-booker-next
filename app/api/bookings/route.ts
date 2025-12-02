import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { BookingStatus, Patient } from '@/lib/types'
import { createBooking, checkBookingConflict } from '@/models/Booking'
import { findTherapistById } from '@/models/Therapist'
import { generateSecureToken } from '@/lib/utils/tokens'
import { sendBookingConfirmationEmails } from '@/lib/email'
import { getDatabase } from '@/lib/mongodb'
import { isValidEmail, isValidDate, isValidTime, isDateInPast } from '@/lib/utils/validation'

import { createErrorResponse } from '@/lib/utils/api';

export const runtime = 'nodejs'

interface CreateBookingRequest {
  therapistId: string
  therapyOfferingId?: string
  patientName: string
  patientEmail: string
  patientPhone?: string
  patientComment?: string
  appointmentDate: string // YYYY-MM-DD format
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  locale?: string
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
    if (!isValidEmail(body.patientEmail)) {
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
    if (!isValidDate(body.appointmentDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Validate date is not in the past
    if (isDateInPast(body.appointmentDate)) {
      return NextResponse.json(
        { error: 'Cannot book appointments in the past' },
        { status: 400 }
      )
    }

    // Validate time format
    if (!isValidTime(body.startTime) || !isValidTime(body.endTime)) {
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

    // Payment Logic: Block if balance is insufficient
    const balance = therapist.balance ?? 0
    if (balance <= 0) {
      return NextResponse.json(
        { error: 'Booking is currently disabled due to insufficient balance. Please contact the therapist directly.' },
        { status: 403 }
      )
    }


    // Start MongoDB session for ACID transaction
    const { getClient } = await import('@/lib/mongodb')
    const client = await getClient()
    const session = client.startSession()

    let bookingResult: any = null

    try {
      await session.withTransaction(async () => {
        // Generate cancellation token
        const cancellationToken = generateSecureToken()

        // Create booking with session
        const booking = await createBooking({
          therapistId: body.therapistId,
          therapyOfferingId: body.therapyOfferingId,
          patientName: body.patientName,
          patientEmail: body.patientEmail,
          patientPhone: body.patientPhone,
          appointmentDate: body.appointmentDate,
          startTime: body.startTime,
          endTime: body.endTime,
          status: BookingStatus.CONFIRMED,
          cancellationToken,
          notes: body.patientComment,
          locale: body.locale,
        }, session)

        // Payment Logic: Deduct 1 CHF with session
        const { deductBalance } = await import('@/models/Therapist')
        await deductBalance(
          body.therapistId,
          1,
          `Booking fee for ${body.patientName}`,
          booking._id.toString(),
          session
        )

        bookingResult = booking
      })
    } catch (transactionError) {
      console.error('Transaction failed:', transactionError)
      await session.endSession()

      // Handle specific transaction errors
      if (transactionError instanceof Error) {
        if (transactionError.message.includes('Booking conflict')) {
          return NextResponse.json(
            { error: 'Time slot is already booked' },
            { status: 409 }
          )
        }
      }

      return NextResponse.json(
        { error: 'Failed to process booking transaction. Please try again.' },
        { status: 500 }
      )
    } finally {
      await session.endSession()
    }

    if (!bookingResult) {
      return NextResponse.json(
        { error: 'Booking failed unexpectedly.' },
        { status: 500 }
      )
    }

    const booking = bookingResult

    // Send confirmation emails - if this fails, we can't rollback the committed transaction easily
    // but the booking is valid and paid for. We should log the error and maybe alert admin.
    // Ideally, email sending should be decoupled (e.g., via a queue), but for now we try our best.
    const patient: Patient = {
      name: body.patientName,
      email: body.patientEmail,
      phone: body.patientPhone || '',
    }

    try {
      await sendBookingConfirmationEmails(booking, therapist, patient)
    } catch (emailError) {
      console.error('Email sending failed for confirmed booking:', emailError)

      // We do NOT rollback here because the transaction is already committed (money deducted).
      // We inform the user that the booking is successful but email failed.

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
        message: 'Booking created successfully, but confirmation email could not be sent. Please contact the therapist.',
        warning: 'Email delivery failed'
      }, { status: 201 })
    }


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

    // ... existing error handling ...
    if (error instanceof Error) {
      // Email sending errors (already handled above, but catch any that slip through)
      if (error.message.includes('Resend API error') || error.message.includes('Failed to send')) {
        return NextResponse.json(
          {
            error: 'Unable to send confirmation email. Please check your email address and try again. If the problem persists, please contact support.',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
          },
          { status: 503 }
        )
      }

      // Booking conflict errors
      if (error.message.includes('conflict') || error.message.includes('already booked')) {
        return NextResponse.json(
          { error: 'This time slot is already booked. Please select another time.' },
          { status: 409 }
        )
      }

      // Validation errors
      if (error.message.includes('Invalid booking data')) {
        return NextResponse.json(
          { error: 'Invalid booking information. Please check your details and try again.' },
          { status: 400 }
        )
      }
    }

    // Generic error - return user-friendly message
    return NextResponse.json(
      {
        error: 'Failed to create booking. Please try again or contact support if the problem persists.',
        details: process.env.NODE_ENV === 'development'
          ? (error instanceof Error ? error.message : String(error))
          : undefined
      },
      { status: 500 }
    )
  }
}

