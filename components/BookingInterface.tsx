'use client'

import { useState } from 'react'
import { BlockedSlot } from '@/lib/types'
import PatientBookingScheduler from './PatientBookingScheduler'

interface BookingInterfaceProps {
  therapistId: string
  blockedSlots?: BlockedSlot[]
  therapistName?: string
}

export default function BookingInterface({ therapistId, blockedSlots, therapistName }: BookingInterfaceProps) {
  const [bookingConfirmed, setBookingConfirmed] = useState(false)

  const handleBookingConfirmed = () => {
    setBookingConfirmed(true)
  }

  return (
    <>
      {!bookingConfirmed && (
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Select Appointment Time</h2>
      )}
      <PatientBookingScheduler
        therapistId={therapistId}
        blockedSlots={blockedSlots}
        onBookingConfirmed={handleBookingConfirmed}
        therapistName={therapistName}
      />
    </>
  )
}
