import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { BookingStatus, Patient } from '@/lib/types'
import { createBooking, checkBookingConflict } from '@/models/Booking'
import { findTherapistById } from '@/models/Therapist'
import { generateSecureToken } from '@/lib/utils/tokens'
import { sendBookingConfirmationEmails } from '@/lib/email'
import { getDatabase } from '@/lib/mongodb'

import { createErrorResponse } from '@/lib/utils/api';

export const runtime = 'nodejs'

interface CreateBookingRequest {
  therapistId: string
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
    const cancellationToken = generateSecureToken()

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
      notes: body.patientComment,
      locale: body.locale,
    })

    // Send confirmation emails - if this fails, rollback the booking
    const patient: Patient = {
        name: body.patientName,
        email: body.patientEmail,
        phone: body.patientPhone || '',
    }
    
    try {
      await sendBookingConfirmationEmails(booking, therapist, patient)
    } catch (emailError) {
      // Email sending failed - delete the booking to rollback
      console.error('Email sending failed, rolling back booking:', emailError)
      
      try {
        const db = await getDatabase()
        await db.collection('bookings').deleteOne({ _id: new ObjectId(booking._id) })
        console.log('Booking rolled back successfully')
      } catch (rollbackError) {
        console.error('Failed to rollback booking after email error:', rollbackError)
        // Continue to throw the original email error
      }
      
      // Return a user-friendly error message
      const errorMessage = emailError instanceof Error 
        ? emailError.message 
        : 'Failed to send confirmation email'
      
      // Check if it's a Resend API error
      if (errorMessage.includes('Resend API error') || errorMessage.includes('Failed to send')) {
        return NextResponse.json(
          { 
            error: 'Unable to send confirmation email. Please check your email address and try again. If the problem persists, please contact support.',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
          },
          { status: 503 } // Service Unavailable
        )
      }
      
      // Generic email error
      throw emailError
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

