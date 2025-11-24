'use client'

import { useState } from 'react'
import { BlockedSlot, TherapyOffering } from '@/lib/types'
import PatientBookingScheduler from './PatientBookingScheduler'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface BookingInterfaceProps {
  therapistId: string
  blockedSlots?: BlockedSlot[]
  therapistName?: string
  therapyOfferings?: TherapyOffering[]
}

export default function BookingInterface({ therapistId, blockedSlots, therapistName, therapyOfferings }: BookingInterfaceProps) {
  const { t } = useTranslation()
  const [bookingConfirmed, setBookingConfirmed] = useState(false)

  const handleBookingConfirmed = () => {
    setBookingConfirmed(true)
  }

  return (
    <>
      {!bookingConfirmed && (
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('bookingInterface.selectAppointmentTime')}</h2>
      )}
      <PatientBookingScheduler
        therapistId={therapistId}
        blockedSlots={blockedSlots}
        onBookingConfirmed={handleBookingConfirmed}
        therapistName={therapistName}
        therapyOfferings={therapyOfferings}
      />
    </>
  )
}
