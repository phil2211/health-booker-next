import { Booking, BookingStatus } from '@/lib/types'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

/**
 * MongoDB model for Booking collection
 * This serves as a type-safe interface for booking documents
 */
export type BookingDocument = Booking & {
  _id: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Helper function to validate booking data
 * Updated to match Requirements.md booking structure
 */
export function validateBooking(booking: Partial<Booking>): boolean {
  return !!(
    booking.therapistId &&
    booking.patientName &&
    booking.patientEmail &&
    booking.patientPhone &&
    booking.appointmentDate &&
    booking.startTime &&
    booking.endTime &&
    booking.status &&
    booking.cancellationToken
  )
}

/**
 * Get bookings by therapist ID and date range
 * Returns non-cancelled bookings only
 */
export async function getBookingsByTherapistAndDateRange(
  therapistId: string,
  startDate: string,
  endDate: string
): Promise<BookingDocument[]> {
  const db = await getDatabase()
  
  const startDateObj = new Date(startDate + 'T00:00:00.000Z')
  const endDateObj = new Date(endDate + 'T23:59:59.999Z')
  
  // Handle therapistId as either ObjectId or string
  // MongoDB may store therapistId as ObjectId or string depending on implementation
  const therapistIdCondition: any = ObjectId.isValid(therapistId)
    ? { $or: [{ therapistId: new ObjectId(therapistId) }, { therapistId: therapistId }] }
    : { therapistId: therapistId }
  
  // Query for bookings - handle appointmentDate as both Date object and string (YYYY-MM-DD format)
  // Use $or to match either Date object or string format for appointmentDate
  const query: any = {
    $and: [
      therapistIdCondition,
      {
        $or: [
          // Date object comparison
          {
            appointmentDate: {
              $gte: startDateObj,
              $lte: endDateObj,
            },
          },
          // String comparison (YYYY-MM-DD format)
          {
            appointmentDate: {
              $gte: startDate,
              $lte: endDate,
            },
          },
        ],
      },
      {
        status: { $ne: BookingStatus.CANCELLED },
      },
    ],
  }
  
  const bookings = await db.collection('bookings')
    .find(query)
    .toArray()
  
  return bookings.map((booking) => ({
    ...booking,
    _id: booking._id.toString(),
    therapistId: booking.therapistId instanceof ObjectId 
      ? booking.therapistId.toString()
      : String(booking.therapistId),
    appointmentDate: booking.appointmentDate instanceof Date 
      ? booking.appointmentDate.toISOString().split('T')[0] 
      : booking.appointmentDate,
  })) as BookingDocument[]
}

