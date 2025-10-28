import { Booking } from '@/lib/types'

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

