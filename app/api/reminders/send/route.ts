import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Booking, BookingStatus, Patient, Therapist } from '@/lib/types';
import { sendReminderEmails } from '@/lib/email';
import { findTherapistById } from '@/models/Therapist';
import { convertMongoBookingToBooking, createPatientFromBooking, normalizeTherapistId } from '@/lib/utils/booking';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Security check: Verify cron secret
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized - Invalid or missing cron secret' },
      { status: 401 }
    )
  }

  const db = await getDatabase();
  const now = new Date();
  // Get tomorrow's date
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDateString = tomorrow.toISOString().split('T')[0];

  const upcomingBookings = await db.collection('bookings').find({
    appointmentDate: tomorrowDateString,
    status: BookingStatus.CONFIRMED,
    reminderSent: { $ne: true }
  }).toArray();

  for (const booking of upcomingBookings) {
    const therapistIdStr = normalizeTherapistId(booking.therapistId);
    const therapist = await findTherapistById(therapistIdStr);
    if (therapist) {
        const patient = createPatientFromBooking(booking);
        const bookingForEmail = convertMongoBookingToBooking(booking);
        await sendReminderEmails(bookingForEmail, therapist, patient);
        
        await db.collection('bookings').updateOne(
            { _id: booking._id },
            { $set: { reminderSent: true } }
        );
    }
  }

  return NextResponse.json({ message: `Sent reminders for ${upcomingBookings.length} bookings.` });
}
