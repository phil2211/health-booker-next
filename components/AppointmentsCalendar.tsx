'use client'

import { useState } from 'react'
import { Booking } from '@/lib/types'
import AppointmentStatusBadge from './AppointmentStatusBadge'

interface AppointmentsCalendarProps {
  bookings: Booking[]
  onViewBooking: (booking: Booking) => void
  onCancelBooking: (bookingId: string) => void
  onRescheduleBooking: (booking: Booking) => void
}

export default function AppointmentsCalendar({
  bookings,
  onViewBooking,
  onCancelBooking,
  onRescheduleBooking
}: AppointmentsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // Group bookings by date
  const bookingsByDate = bookings.reduce((acc, booking) => {
    const dateKey = booking.appointmentDate instanceof Date ? booking.appointmentDate.toISOString().split('T')[0] : booking.appointmentDate
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(booking)
    return acc
  }, {} as Record<string, Booking[]>)

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // Start from Sunday

    const days = []
    const current = new Date(startDate)

    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  const calendarDays = generateCalendarDays()
  const today = new Date().toISOString().split('T')[0]

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const getBookingsForDate = (date: Date) => {
    const dateKey = formatDateKey(date)
    return bookingsByDate[dateKey] || []
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const isToday = (date: Date) => {
    return formatDateKey(date) === today
  }

  const isSelected = (date: Date) => {
    return selectedDate === formatDateKey(date)
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {formatMonthYear(currentDate)}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const dateBookings = getBookingsForDate(date)
            const dateKey = formatDateKey(date)

            return (
              <div
                key={index}
                onClick={() => setSelectedDate(isSelected(date) ? null : dateKey)}
                className={`
                  min-h-[120px] p-2 border border-gray-200 rounded-lg cursor-pointer transition-colors
                  ${isCurrentMonth(date) ? 'bg-white' : 'bg-gray-50'}
                  ${isToday(date) ? 'ring-2 ring-indigo-500' : ''}
                  ${isSelected(date) ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
                `}
              >
                <div className={`text-sm font-medium mb-1 ${isCurrentMonth(date) ? 'text-gray-900' : 'text-gray-400'}`}>
                  {date.getDate()}
                </div>

                {/* Appointments for this day */}
                <div className="space-y-1">
                  {dateBookings.slice(0, 3).map((booking, bookingIndex) => (
                    <div
                      key={booking._id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewBooking(booking)
                      }}
                      className={`
                        text-xs p-1 rounded cursor-pointer transition-colors
                        ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                        ${booking.status === 'completed' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' : ''}
                        ${booking.status === 'cancelled' ? 'bg-red-100 text-red-800 hover:bg-red-200' : ''}
                        ${booking.status === 'no_show' ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : ''}
                      `}
                    >
                      <div className="font-medium truncate">{booking.patientName}</div>
                      <div className="text-xs opacity-75">{booking.startTime}</div>
                    </div>
                  ))}

                  {dateBookings.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dateBookings.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              Appointments for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </h4>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-3">
            {getBookingsForDate(new Date(selectedDate + 'T00:00:00')).map((booking) => (
              <div key={booking._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="font-medium text-gray-900">{booking.patientName}</span>
                    <AppointmentStatusBadge status={booking.status} />
                  </div>
                  <div className="text-sm text-gray-600">
                    {booking.startTime} - {booking.endTime} • {booking.patientEmail}
                    {booking.patientPhone && ` • ${booking.patientPhone}`}
                  </div>
                  {booking.notes && (
                    <div className="text-sm text-gray-600 mt-1">
                      Notes: {booking.notes}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => onViewBooking(booking)}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    View
                  </button>

                  {booking.status === 'confirmed' && (
                    <>
                      <button
                        onClick={() => onRescheduleBooking(booking)}
                        className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                      >
                        Reschedule
                      </button>

                      <button
                        onClick={() => onCancelBooking(booking._id!)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {getBookingsForDate(new Date(selectedDate + 'T00:00:00')).length === 0 && (
              <div className="text-center text-gray-500 py-4">
                No appointments scheduled for this date
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
