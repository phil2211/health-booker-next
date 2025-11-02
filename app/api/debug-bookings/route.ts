import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET() {
  try {
    const db = await getDatabase()

    const therapistId = '6907709f3f12e8eac477dc0d'
    const appointmentDate = '2025-11-14'

    // Check all bookings
    const allBookings = await db.collection('bookings').find({}).toArray()

    // Check therapist document
    const therapist = await db.collection('therapists').findOne({
      $or: [
        { _id: therapistId },
        { _id: new ObjectId(therapistId) }
      ]
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
    return NextResponse.json({ error: 'Debug failed', details: error.message }, { status: 500 })
  }
}
