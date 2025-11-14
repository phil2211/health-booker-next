import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { Booking, BookingStatus, Patient, Therapist } from '@/lib/types';
import { sendReminderEmails } from '@/lib/email';
import { findTherapistById } from '@/models/Therapist';

export const runtime = 'nodejs';

export async function GET() {
  const db = await getDatabase();
  const now = new Date();
  const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const twentyFiveHoursFromNow = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const upcomingBookings = await db.collection('bookings').find({
    appointmentDate: {
      $gte: twentyFourHoursFromNow.toISOString().split('T')[0],
      $lt: twentyFiveHoursFromNow.toISOString().split('T')[0],
    },
    status: BookingStatus.CONFIRMED,
    reminderSent: { $ne: true }
  }).toArray();

  for (const booking of upcomingBookings) {
    const therapist = await findTherapistById(booking.therapistId.toString());
    if (therapist) {
        const patient: Patient = {
            name: booking.patientName,
            email: booking.patientEmail,
            phone: booking.patientPhone || '',
        };
        await sendReminderEmails(booking as Booking, therapist, patient);
        
        await db.collection('bookings').updateOne(
            { _id: booking._id },
            { $set: { reminderSent: true } }
        );
    }
  }

  return NextResponse.json({ message: `Sent reminders for ${upcomingBookings.length} bookings.` });
}
