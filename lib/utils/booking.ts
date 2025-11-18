/**
 * Utility functions for booking-related operations and conversions
 */

import { ObjectId } from 'mongodb';
import { Booking, BookingStatus, Patient } from '@/lib/types';

/**
 * Converts a MongoDB booking document to a Booking type object
 * Handles ObjectId conversion and optional fields properly
 */
export function convertMongoBookingToBooking(booking: any): Booking {
  const therapistIdStr = booking.therapistId instanceof ObjectId
    ? booking.therapistId.toString()
    : String(booking.therapistId);

  return {
    _id: booking._id.toString(),
    therapistId: therapistIdStr,
    patientName: booking.patientName,
    patientEmail: booking.patientEmail,
    patientPhone: booking.patientPhone || undefined,
    appointmentDate: booking.appointmentDate instanceof Date
      ? booking.appointmentDate.toISOString().split('T')[0]
      : booking.appointmentDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    status: booking.status as BookingStatus,
    cancellationToken: booking.cancellationToken,
    reason: booking.reason || undefined,
    notes: booking.notes || undefined,
    locale: booking.locale || undefined,
    reminderSent: booking.reminderSent || undefined,
    createdAt: booking.createdAt || undefined,
    updatedAt: booking.updatedAt || undefined,
  };
}

/**
 * Creates a Patient object from booking data
 */
export function createPatientFromBooking(booking: any): Patient {
  return {
    name: booking.patientName,
    email: booking.patientEmail,
    phone: booking.patientPhone || '',
  };
}

/**
 * Converts a therapistId (ObjectId or string) to string format
 */
export function normalizeTherapistId(therapistId: any): string {
  return therapistId instanceof ObjectId
    ? therapistId.toString()
    : String(therapistId);
}
