import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

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
    (baseResponse.details as any).message = error.message
    if (process.env.NODE_ENV === 'development') {
      (baseResponse.details as any).stack = error.stack
    }
  } else {
    (baseResponse.details as any).message = String(error)
  }

  return baseResponse
}

export async function GET() {
  try {
    const db = await getDatabase()

    const therapistId = '6907709f3f12e8eac477dc0d'
    const appointmentDate = '2025-11-14'

    // Check all bookings
    const allBookings = await db.collection('bookings').find({}).toArray()

    // Check therapist document
    const therapist = await db.collection('therapists').findOne({
      _id: new ObjectId(therapistId)
    })

    return NextResponse.json({
      totalBookings: allBookings.length,
      therapist: therapist ? {
        id: therapist._id.toString(),
        bookingsCount: therapist.bookings ? therapist.bookings.length : 0,
        bookings: therapist.bookings || []
      } : null,
      allBookings: allBookings.map(b => ({
        id: b._id.toString(),
        therapistId: b.therapistId,
        date: b.appointmentDate,
        startTime: b.startTime,
        endTime: b.endTime,
        status: b.status
      }))
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      createErrorResponse(error, 'GET /api/debug-bookings'),
      { status: 500 }
    )
  }
}
