'use client'

import { Booking } from '@/lib/types'
import AppointmentStatusBadge from './AppointmentStatusBadge'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useLocale } from '@/lib/i18n/LocaleProvider'

interface AppointmentsListProps {
  bookings: Booking[]
  onViewBooking: (booking: Booking) => void
  onCancelBooking: (bookingId: string) => void
  onRescheduleBooking: (booking: Booking) => void
}

export default function AppointmentsList({
  bookings,
  onViewBooking,
  onCancelBooking,
  onRescheduleBooking
}: AppointmentsListProps) {
  const { t, locale } = useTranslation()
  
  // Group bookings by date sections
  const groupedBookings = bookings.reduce((acc, booking) => {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const bookingDate = booking.appointmentDate

    let section = 'past'
    if (bookingDate > today) {
      section = 'upcoming'
    } else if (bookingDate === today) {
      section = 'today'
    }

    if (!acc[section]) {
      acc[section] = []
    }
    acc[section].push(booking)
    return acc
  }, {} as Record<string, Booking[]>)

  // Sort within each section by date/time
  Object.keys(groupedBookings).forEach(section => {
    groupedBookings[section].sort((a, b) => {
      const aDate = a.appointmentDate instanceof Date ? a.appointmentDate.toISOString().split('T')[0] : a.appointmentDate
      const bDate = b.appointmentDate instanceof Date ? b.appointmentDate.toISOString().split('T')[0] : b.appointmentDate
      const dateCompare = aDate.localeCompare(bDate)
      if (dateCompare !== 0) return dateCompare
      return a.startTime.localeCompare(b.startTime)
    })
  })

  const sections = [
    { key: 'today', title: t('appointments.sections.today'), color: 'yellow' },
    { key: 'upcoming', title: t('appointments.sections.upcoming'), color: 'green' },
    { key: 'past', title: t('appointments.sections.past'), color: 'gray' }
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (startTime: string, endTime: string) => {
    // Format times in 24-hour format for European locales, otherwise keep as-is
    const isEuropeanLocale = locale === 'de' // Add more European locales as needed
    
    if (isEuropeanLocale) {
      // Times are already in HH:MM format, so just return them
      return `${startTime} - ${endTime}`
    }
    
    // For non-European locales, convert to 12-hour format if needed
    const formatTo12Hour = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number)
      const date = new Date()
      date.setHours(hours, minutes, 0, 0)
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    }
    
    return `${formatTo12Hour(startTime)} - ${formatTo12Hour(endTime)}`
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('appointments.noAppointments')}</h3>
        <p className="text-gray-600">{t('appointments.noAppointmentsDescription')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sections.map(({ key, title, color }) => {
        const sectionBookings = groupedBookings[key] || []

        if (sectionBookings.length === 0) return null

        return (
          <div key={key} className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className={`px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-${color}-50`}>
              <h3 className={`text-base md:text-lg font-semibold text-${color}-900`}>
                {title} ({sectionBookings.length})
              </h3>
            </div>

            <div className="divide-y divide-gray-200">
              {sectionBookings.map((booking) => (
                <div key={booking._id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {booking.patientName}
                        </h4>
                        <AppointmentStatusBadge status={booking.status} />
                      </div>

                      <div className="flex flex-col space-y-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">{t('common.date')}:</span> {formatDate(booking.appointmentDate instanceof Date ? booking.appointmentDate.toISOString().split('T')[0] : booking.appointmentDate)}
                        </div>
                        <div>
                          <span className="font-medium">{t('common.time')}:</span> {formatTime(booking.startTime, booking.endTime)}
                        </div>
                        <div>
                          <span className="font-medium">{t('appointments.contact')}:</span> {booking.patientEmail}
                          {booking.patientPhone && (
                            <span className="block sm:inline sm:ml-2">• {booking.patientPhone}</span>
                          )}
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mt-3 text-sm text-gray-600">
                          <span className="font-medium">{t('appointments.notes')}:</span> {booking.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                      <button
                        onClick={() => onViewBooking(booking)}
                        className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                      >
                        {t('appointments.viewDetails')}
                      </button>

                      {booking.status === 'confirmed' && (
                        <>
                          <button
                            onClick={() => onRescheduleBooking(booking)}
                            className="px-4 py-2 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors font-medium"
                          >
                            {t('appointments.reschedule')}
                          </button>

                          <button
                            onClick={() => onCancelBooking(booking._id!)}
                            className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                          >
                            {t('common.cancel')}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
