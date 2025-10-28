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
 */
export function validateBooking(booking: Partial<Booking>): boolean {
  return !!(
    booking.providerId &&
    booking.patientId &&
    booking.appointmentDate &&
    booking.startTime &&
    booking.endTime &&
    booking.status
  )
}

