'use client'

import { Booking } from '@/lib/types'
import AppointmentStatusBadge from './AppointmentStatusBadge'

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
    { key: 'today', title: 'Today', color: 'yellow' },
    { key: 'upcoming', title: 'Upcoming', color: 'green' },
    { key: 'past', title: 'Past', color: 'gray' }
  ]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (startTime: string, endTime: string) => {
    return `${startTime} - ${endTime}`
  }

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Appointments Found</h3>
        <p className="text-gray-600">Try adjusting your filters to see more appointments.</p>
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
            <div className={`px-6 py-4 border-b border-gray-200 bg-${color}-50`}>
              <h3 className={`text-lg font-semibold text-${color}-900`}>
                {title} ({sectionBookings.length})
              </h3>
            </div>

            <div className="divide-y divide-gray-200">
              {sectionBookings.map((booking) => (
                <div key={booking._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {booking.patientName}
                        </h4>
                        <AppointmentStatusBadge status={booking.status} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Date:</span> {formatDate(booking.appointmentDate instanceof Date ? booking.appointmentDate.toISOString().split('T')[0] : booking.appointmentDate)}
                        </div>
                        <div>
                          <span className="font-medium">Time:</span> {formatTime(booking.startTime, booking.endTime)}
                        </div>
                        <div>
                          <span className="font-medium">Contact:</span> {booking.patientEmail}
                          {booking.patientPhone && (
                            <span className="ml-2">• {booking.patientPhone}</span>
                          )}
                        </div>
                      </div>

                      {booking.notes && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Notes:</span> {booking.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => onViewBooking(booking)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        View Details
                      </button>

                      {booking.status === 'confirmed' && (
                        <>
                          <button
                            onClick={() => onRescheduleBooking(booking)}
                            className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                          >
                            Reschedule
                          </button>

                          <button
                            onClick={() => onCancelBooking(booking._id!)}
                            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            Cancel
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
