'use client'

import { useState, useEffect } from 'react'
import { Booking } from '@/lib/types'

interface RescheduleModalProps {
  booking: Booking
  onClose: () => void
  onReschedule: (bookingId: string, newDate: string, newStartTime: string, newEndTime: string) => void
}

interface AvailableSlot {
  startTime: string
  endTime: string
  available: boolean
}

export default function RescheduleModal({
  booking,
  onClose,
  onReschedule
}: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('')
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [isRescheduling, setIsRescheduling] = useState(false)

  // Calculate default date (current appointment date)
  useEffect(() => {
    const dateString = booking.appointmentDate instanceof Date ? booking.appointmentDate.toISOString().split('T')[0] : booking.appointmentDate
    setSelectedDate(dateString)
  }, [booking.appointmentDate])

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate)
    }
  }, [selectedDate])

  const fetchAvailableSlots = async (date: string) => {
    setLoading(true)
    try {
      // For now, generate some example time slots
      // In a real implementation, this would call an API to get therapist availability
      const slots: AvailableSlot[] = []
      const startHour = 9
      const endHour = 17

      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          const endTime = minute === 30
            ? `${(hour + 1).toString().padStart(2, '0')}:00`
            : `${hour.toString().padStart(2, '0')}:30`

          // Check if this slot conflicts with the current booking (if same date)
          const isCurrentBooking = date === booking.appointmentDate &&
                                   startTime === booking.startTime &&
                                   endTime === booking.endTime

          slots.push({
            startTime,
            endTime,
            available: isCurrentBooking ? false : Math.random() > 0.3 // Simulate some slots being booked
          })
        }
      }

      setAvailableSlots(slots)
    } catch (error) {
      console.error('Failed to fetch available slots:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      alert('Please select both a date and time slot')
      return
    }

    const [startTime, endTime] = selectedTimeSlot.split('-')

    if (!confirm(`Are you sure you want to reschedule this appointment to ${selectedDate} at ${startTime} - ${endTime}?`)) {
      return
    }

    setIsRescheduling(true)
    try {
      await onReschedule(booking._id!, selectedDate, startTime, endTime)
      onClose()
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setIsRescheduling(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00')
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Reschedule Appointment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Current Appointment Info */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-2">Current Appointment</h3>
          <div className="text-sm text-gray-600">
            <p><strong>Patient:</strong> {booking.patientName}</p>
            <p><strong>Date:</strong> {formatDate(booking.appointmentDate instanceof Date ? booking.appointmentDate.toISOString().split('T')[0] : booking.appointmentDate)}</p>
            <p><strong>Time:</strong> {booking.startTime} - {booking.endTime}</p>
          </div>
        </div>

        {/* Reschedule Form */}
        <div className="p-6 space-y-4">
          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={getMinDate()}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Time Slot Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Time Slots
            </label>

            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading available slots...</p>
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg">
                {availableSlots.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No available slots for this date
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTimeSlot(`${slot.startTime}-${slot.endTime}`)}
                        disabled={!slot.available}
                        className={`
                          w-full px-4 py-3 text-left transition-colors
                          ${slot.available
                            ? selectedTimeSlot === `${slot.startTime}-${slot.endTime}`
                              ? 'bg-indigo-100 text-indigo-900 border-l-4 border-indigo-500'
                              : 'hover:bg-gray-50 text-gray-900'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          {!slot.available && (
                            <span className="text-xs text-red-600">Booked</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleReschedule}
            disabled={!selectedDate || !selectedTimeSlot || isRescheduling}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRescheduling ? 'Rescheduling...' : 'Reschedule Appointment'}
          </button>
        </div>
      </div>
    </div>
  )
}
