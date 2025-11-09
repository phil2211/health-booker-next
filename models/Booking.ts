import { Booking, BookingStatus } from '@/lib/types'
import { getDatabase, getClient } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'


/**
 * Helper function to create therapist ID query that handles both ObjectId and string formats
 */
function createTherapistIdQuery(therapistId: string): any {
  return ObjectId.isValid(therapistId)
    ? {
        $or: [
          { therapistId: new ObjectId(therapistId) },
          { therapistId: therapistId }
        ]
      }
    : { therapistId: therapistId }
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
 * Create a new booking
 * Stores booking only in the bookings collection
 */
export async function createBooking(booking: Omit<Booking, '_id' | 'createdAt' | 'updatedAt'>): Promise<BookingDocument> {
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

  // Insert booking into bookings collection
  const insertResult = await db.collection('bookings').insertOne(bookingDoc)
  const bookingId = insertResult.insertedId

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
}

/**
 * Get all bookings for a therapist with optional filters
 * More comprehensive than getBookingsByTherapistAndDateRange
 */
export async function getBookingsByTherapistId(
  therapistId: string,
  filters?: {
    status?: BookingStatus
    startDate?: string
    endDate?: string
    limit?: number
  }
): Promise<BookingDocument[]> {
  const db = await getDatabase()

  const therapistIdQuery = createTherapistIdQuery(therapistId)

  const query: any = {
    ...therapistIdQuery
  }

  // Add status filter if provided
  if (filters?.status) {
    query.status = filters.status
  } else {
    // By default, exclude cancelled bookings unless specifically requested
    query.status = { $ne: BookingStatus.CANCELLED }
  }

  // Add date range filter if provided
  if (filters?.startDate || filters?.endDate) {
    const startDate = filters?.startDate || '1970-01-01'
    const endDate = filters?.endDate || '2100-12-31'

    query.appointmentDate = {
      $gte: startDate,
      $lte: endDate
    }
  }

  const bookings = await db.collection('bookings')
    .find(query)
    .sort({ appointmentDate: -1, startTime: -1 })
    .limit(filters?.limit || 1000)
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
 * Update a booking by ID (therapist operations only)
 * Validates that the therapist owns the booking
 */
export async function updateBookingById(
  bookingId: string,
  therapistId: string,
  updates: {
    notes?: string
    status?: BookingStatus
  }
): Promise<BookingDocument | null> {
  const db = await getDatabase()

  if (!ObjectId.isValid(bookingId)) {
    throw new Error('Invalid booking ID format')
  }

  // Validate status transition if provided
  if (updates.status) {
    const validStatuses = [BookingStatus.COMPLETED, BookingStatus.NO_SHOW]
    if (!validStatuses.includes(updates.status)) {
      throw new Error('Invalid status. Only COMPLETED and NO_SHOW are allowed for updates')
    }
  }

  // First verify the booking exists and belongs to the therapist
  const therapistIdQuery = createTherapistIdQuery(therapistId)

  const existingBooking = await db.collection('bookings').findOne({
    _id: new ObjectId(bookingId),
    ...therapistIdQuery
  })

  if (!existingBooking) {
    throw new Error('Booking not found or access denied')
  }

  // Update the booking
  const updateData: any = {
    updatedAt: new Date()
  }

  if (updates.notes !== undefined) {
    updateData.notes = updates.notes
  }

  if (updates.status) {
    updateData.status = updates.status
  }

  const result = await db.collection('bookings').updateOne(
    { _id: new ObjectId(bookingId) },
    { $set: updateData }
  )

  if (result.modifiedCount === 0) {
    throw new Error('Failed to update booking')
  }

  // Fetch and return updated booking
  const updated = await db.collection('bookings').findOne(
    { _id: new ObjectId(bookingId) }
  )

  if (updated) {
    return {
      ...updated,
      _id: updated._id.toString(),
      therapistId: updated.therapistId instanceof ObjectId
        ? updated.therapistId.toString()
        : String(updated.therapistId),
      appointmentDate: updated.appointmentDate instanceof Date
        ? updated.appointmentDate.toISOString().split('T')[0]
        : updated.appointmentDate,
    } as BookingDocument
  }

  return null
}

/**
 * Cancel a booking by ID (therapist-side cancellation)
 * Validates that the therapist owns the booking
 */
export async function cancelBookingById(
  bookingId: string,
  therapistId: string
): Promise<BookingDocument | null> {
  const db = await getDatabase()

  if (!ObjectId.isValid(bookingId)) {
    throw new Error('Invalid booking ID format')
  }

  // First verify the booking exists and belongs to the therapist
  const therapistIdQuery = createTherapistIdQuery(therapistId)

  const existingBooking = await db.collection('bookings').findOne({
    _id: new ObjectId(bookingId),
    ...therapistIdQuery,
    status: { $ne: BookingStatus.CANCELLED } // Don't cancel already cancelled bookings
  })

  if (!existingBooking) {
    throw new Error('Booking not found, access denied, or already cancelled')
  }

  const now = new Date()

  // Update booking status to cancelled
  const result = await db.collection('bookings').updateOne(
    { _id: new ObjectId(bookingId) },
    {
      $set: {
        status: BookingStatus.CANCELLED,
        updatedAt: now
      }
    }
  )

  if (result.modifiedCount === 0) {
    throw new Error('Failed to cancel booking')
  }

  // Fetch and return cancelled booking
  const cancelled = await db.collection('bookings').findOne(
    { _id: new ObjectId(bookingId) }
  )

  if (cancelled) {
    return {
      ...cancelled,
      _id: cancelled._id.toString(),
      therapistId: cancelled.therapistId instanceof ObjectId
        ? cancelled.therapistId.toString()
        : String(cancelled.therapistId),
      appointmentDate: cancelled.appointmentDate instanceof Date
        ? cancelled.appointmentDate.toISOString().split('T')[0]
        : cancelled.appointmentDate,
    } as BookingDocument
  }

  return null
}

/**
 * Get a booking by ID (therapist operations only)
 * Validates that the therapist owns the booking
 */
export async function getBookingById(
  bookingId: string,
  therapistId: string
): Promise<BookingDocument | null> {
  const db = await getDatabase()

  if (!ObjectId.isValid(bookingId)) {
    throw new Error('Invalid booking ID format')
  }

  // Find booking and verify therapist owns it
  const therapistIdQuery = createTherapistIdQuery(therapistId)

  const booking = await db.collection('bookings').findOne({
    _id: new ObjectId(bookingId),
    ...therapistIdQuery
  })

  if (!booking) {
    return null
  }

  return {
    ...booking,
    _id: booking._id.toString(),
    therapistId: booking.therapistId instanceof ObjectId
      ? booking.therapistId.toString()
      : String(booking.therapistId),
    appointmentDate: booking.appointmentDate instanceof Date
      ? booking.appointmentDate.toISOString().split('T')[0]
      : booking.appointmentDate,
  } as BookingDocument
}

/**
 * Reschedule a booking to a new date/time
 * Validates no conflicts and therapist owns the booking
 */
export async function rescheduleBooking(
  bookingId: string,
  therapistId: string,
  newAppointmentDate: string,
  newStartTime: string,
  newEndTime: string
): Promise<BookingDocument | null> {
  const db = await getDatabase()

  if (!ObjectId.isValid(bookingId)) {
    throw new Error('Invalid booking ID format')
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(newAppointmentDate)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD')
  }

  // Validate time format
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
  if (!timeRegex.test(newStartTime) || !timeRegex.test(newEndTime)) {
    throw new Error('Invalid time format. Use HH:MM')
  }

  // Validate date is not in the past
  const appointmentDate = new Date(newAppointmentDate + 'T00:00:00.000Z')
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  if (appointmentDate < today) {
    throw new Error('Cannot reschedule to a past date')
  }

  // First verify the booking exists and belongs to the therapist
  const therapistIdQuery = createTherapistIdQuery(therapistId)

  const existingBooking = await db.collection('bookings').findOne({
    _id: new ObjectId(bookingId),
    ...therapistIdQuery,
    status: BookingStatus.CONFIRMED // Only confirmed bookings can be rescheduled
  })

  if (!existingBooking) {
    throw new Error('Booking not found, access denied, or not in confirmed status')
  }

  // Check for conflicts at the new time slot (excluding this booking)
  const hasConflict = await checkBookingConflict(
    therapistId,
    newAppointmentDate,
    newStartTime,
    newEndTime
  )

  // If there's a conflict, we need to check if it's with a different booking
  // (same booking at same time is not a conflict)
  if (hasConflict) {
    // Get all conflicting bookings to see if any are different from this one
    const allBookings = await db.collection('bookings').find({
      ...therapistIdQuery,
      appointmentDate: newAppointmentDate,
      status: { $ne: BookingStatus.CANCELLED }
    }).toArray()

    // Check for time overlaps with other bookings
    const hasRealConflict = allBookings.some(booking => {
      if (booking._id.toString() === bookingId) return false // Skip this booking

      const toMinutes = (time: string): number => {
        const [hours, minutes] = time.split(':').map(Number)
        return hours * 60 + minutes
      }

      const start1Min = toMinutes(newStartTime)
      const end1Min = toMinutes(newEndTime)
      const start2Min = toMinutes(booking.startTime)
      const end2Min = toMinutes(booking.endTime)

      return start1Min < end2Min && start2Min < end1Min
    })

    if (hasRealConflict) {
      throw new Error('Time slot conflict: New appointment time conflicts with existing booking')
    }
  }

  const now = new Date()

  // Update the booking with new date/time
  const result = await db.collection('bookings').updateOne(
    { _id: new ObjectId(bookingId) },
    {
      $set: {
        appointmentDate: newAppointmentDate,
        startTime: newStartTime,
        endTime: newEndTime,
        updatedAt: now
      }
    }
  )

  if (result.modifiedCount === 0) {
    throw new Error('Failed to reschedule booking')
  }

  // Fetch and return rescheduled booking
  const rescheduled = await db.collection('bookings').findOne(
    { _id: new ObjectId(bookingId) }
  )

  if (rescheduled) {
    return {
      ...rescheduled,
      _id: rescheduled._id.toString(),
      therapistId: rescheduled.therapistId instanceof ObjectId
        ? rescheduled.therapistId.toString()
        : String(rescheduled.therapistId),
      appointmentDate: rescheduled.appointmentDate instanceof Date
        ? rescheduled.appointmentDate.toISOString().split('T')[0]
        : rescheduled.appointmentDate,
    } as BookingDocument
  }

  return null
}


