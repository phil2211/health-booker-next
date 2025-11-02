import { Booking, BookingStatus } from '@/lib/types'
import { getDatabase, getClient } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

/**
 * Simplified booking structure for storing in therapist document
 */
interface TherapistBooking {
  _id: ObjectId
  patientName: string
  patientEmail: string
  appointmentDate: string // YYYY-MM-DD format
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  status: BookingStatus
  createdAt: Date
}

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

/**
 * Check if a booking conflicts with existing bookings
 * Checks for overlapping appointments for the same therapist
 */
export async function checkBookingConflict(
  therapistId: string,
  appointmentDate: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const db = await getDatabase()

  // Convert therapistId to ObjectId for consistent querying
  const therapistIdObj = ObjectId.isValid(therapistId) ? new ObjectId(therapistId) : null
  if (!therapistIdObj) {
    throw new Error('Invalid therapist ID format')
  }

  // First, get all non-cancelled bookings for this therapist and date
  // Then check for overlaps in memory for more reliable detection
  const baseQuery: any = {
    $and: [
      {
        $or: [
          { therapistId: therapistIdObj },
          { therapistId: therapistId }, // Also check as string in case it's stored that way
        ],
      },
      { appointmentDate: appointmentDate },
      { status: { $ne: BookingStatus.CANCELLED } },
    ],
  }

  const allBookings = await db.collection('bookings').find(baseQuery).toArray()


  // Helper function to check if two time ranges overlap
  const timeRangesOverlap = (
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean => {
    // Convert times to minutes for comparison
    const toMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }

    const start1Min = toMinutes(start1)
    const end1Min = toMinutes(end1)
    const start2Min = toMinutes(start2)
    const end2Min = toMinutes(end2)

    // Two ranges overlap if: start1 < end2 AND start2 < end1
    // Equal times don't overlap (e.g., 10:30-11:30 and 11:30-12:30 don't overlap)
    return start1Min < end2Min && start2Min < end1Min
  }

  // Check each booking for time overlap
  for (const booking of allBookings) {
    const bookingStartTime = booking.startTime
    const bookingEndTime = booking.endTime

    const overlaps = timeRangesOverlap(startTime, endTime, bookingStartTime, bookingEndTime)

    if (overlaps) {
      return true
    }
  }

  return false
}

/**
 * Create a new booking using a transaction
 * Also updates the therapist's bookings array (only future bookings)
 * Removes bookings more than 3 days old from therapist document
 */
export async function createBooking(booking: Omit<Booking, '_id' | 'createdAt' | 'updatedAt'>): Promise<BookingDocument> {
  const client = await getClient()
  const db = await getDatabase()
  
  // Validate booking data
  if (!validateBooking(booking)) {
    throw new Error('Invalid booking data')
  }
  
  // Check for conflicts
  const appointmentDateStr = booking.appointmentDate instanceof Date
    ? booking.appointmentDate.toISOString().split('T')[0]
    : booking.appointmentDate
  
  const hasConflict = await checkBookingConflict(
    booking.therapistId,
    appointmentDateStr,
    booking.startTime,
    booking.endTime
  )
  
  if (hasConflict) {
    throw new Error('Booking conflict: Time slot is already booked')
  }
  
  // Prepare booking document
  const now = new Date()
  const therapistIdObj = ObjectId.isValid(booking.therapistId)
    ? new ObjectId(booking.therapistId)
    : (() => {
        throw new Error('Invalid therapist ID format')
      })()
  
  const bookingDoc: any = {
    therapistId: therapistIdObj,
    patientName: booking.patientName,
    patientEmail: booking.patientEmail,
    patientPhone: booking.patientPhone || null,
    appointmentDate: appointmentDateStr,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status,
    cancellationToken: booking.cancellationToken,
    reason: booking.reason || null,
    notes: booking.notes || null,
    createdAt: now,
    updatedAt: now,
  }
  
  // Calculate cutoff date (3 days ago)
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 3)
  const cutoffDateStr = cutoffDate.toISOString().split('T')[0]
  
  // Use a transaction
  const session = client.startSession()
  let bookingId: ObjectId | null = null
  
  try {
    await session.withTransaction(async () => {
      // 1. Insert booking into bookings collection
      const insertResult = await db.collection('bookings').insertOne(bookingDoc, { session })
      bookingId = insertResult.insertedId
      
      // 2. Prepare booking for therapist document (simplified version)
      const therapistBooking: TherapistBooking = {
        _id: bookingId,
        patientName: booking.patientName,
        patientEmail: booking.patientEmail,
        appointmentDate: appointmentDateStr,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status,
        createdAt: now,
      }
      
      // 3. Update therapist document:
      //    - Add new booking to bookings array (only if it's in the future)
      //    - Remove bookings more than 3 days old
      const appointmentDate = new Date(appointmentDateStr + 'T00:00:00.000Z')
      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)
      
      // First, clean up old bookings from therapist document
      await db.collection('therapists').updateOne(
        { _id: therapistIdObj },
        {
          $pull: {
            bookings: {
              appointmentDate: { $lt: cutoffDateStr },
            },
          },
        },
        { session }
      )

      // Then add the new booking if it's in the future
      if (appointmentDate >= today) {
        await db.collection('therapists').updateOne(
          { _id: therapistIdObj },
          {
            $set: { updatedAt: now },
            $push: {
              bookings: therapistBooking,
            },
          },
          { session }
        )
      } else {
        // Just update the timestamp
        await db.collection('therapists').updateOne(
          { _id: therapistIdObj },
          {
            $set: { updatedAt: now },
          },
          { session }
        )
      }
    })
    
    if (!bookingId) {
      throw new Error('Failed to create booking')
    }
    
    // Return the created booking document
    const createdBooking = await db.collection('bookings').findOne({ _id: bookingId })
    
    if (!createdBooking) {
      throw new Error('Failed to retrieve created booking')
    }
    
    return {
      ...booking,
      _id: createdBooking._id.toString(),
      therapistId: booking.therapistId,
      appointmentDate: appointmentDateStr,
      createdAt: now,
      updatedAt: now,
    } as BookingDocument
  } finally {
    await session.endSession()
  }
}


