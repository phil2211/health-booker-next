'use client'

import { useState, useEffect } from 'react'
import { TimeSlot } from '@/lib/utils/availability'
import { BlockedSlot } from '@/lib/types'
import DatePickerPopover from './DatePickerPopover'

interface PatientBookingSchedulerProps {
  therapistId: string
  blockedSlots?: BlockedSlot[]
}

interface AvailabilityResponse {
  slots: TimeSlot[]
  therapistId: string
  startDate: string
  endDate: string
}

export default function PatientBookingScheduler({ therapistId, blockedSlots = [] }: PatientBookingSchedulerProps) {
  const [selectedDate, setSelectedDate] = useState<string>('')

  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  // Fetch availability for full date range on mount to determine which dates have slots
  useEffect(() => {
    const fetchFullRangeAvailability = async () => {
      try {
        const today = new Date()
        const maxDate = new Date()
        maxDate.setMonth(maxDate.getMonth() + 3)
        
        const startDateStr = today.toISOString().split('T')[0]
        const endDateStr = maxDate.toISOString().split('T')[0]

        const response = await fetch(
          `/api/therapist/${therapistId}/availability?startDate=${startDateStr}&endDate=${endDateStr}`
        )

        if (response.ok) {
          const data: AvailabilityResponse = await response.json()
          // Extract dates that have at least one available slot
          const datesWithSlots = new Set<string>()
          data.slots.forEach((slot) => {
            if (slot.status === 'available') {
              datesWithSlots.add(slot.date)
            }
          })
          setAvailableDates(datesWithSlots)
        }
      } catch (err) {
        // Silently fail - we'll still allow date selection, just won't filter by availability
        console.error('Failed to fetch full availability:', err)
      }
    }

    fetchFullRangeAvailability()
  }, [therapistId])

  // Fetch availability when date changes
  useEffect(() => {
    if (!selectedDate) return

    const fetchAvailability = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(
          `/api/therapist/${therapistId}/availability?startDate=${selectedDate}&endDate=${selectedDate}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch availability')
        }

        const data: AvailabilityResponse = await response.json()
        // Filter slots for the selected date and only show available ones
        const availableSlots = data.slots.filter(
          (slot) => slot.date === selectedDate && slot.status === 'available'
        )
        setSlots(availableSlots)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setSlots([])
      } finally {
        setLoading(false)
      }
    }

    fetchAvailability()
  }, [therapistId, selectedDate])

  // Format time from HH:MM to browser's local timezone
  // Assumes the time string is in UTC and converts to user's local timezone
  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number)
    // Create a date object for today in UTC, then convert to local time
    const date = new Date()
    date.setUTCHours(hours, minutes, 0, 0)
    
    // Return formatted in user's local timezone
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    })
  }

  // Get minimum date (today)
  const getMinDate = (): Date => {
    return new Date()
  }

  // Get maximum date (3 months from now)
  const getMaxDate = (): Date => {
    const maxDate = new Date()
    maxDate.setMonth(maxDate.getMonth() + 3)
    return maxDate
  }

  const handleSlotSelect = (slot: TimeSlot) => {
    if (slot.status === 'available') {
      setSelectedSlot(`${slot.date}-${slot.startTime}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Treatment Label */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <p className="text-sm text-indigo-800 font-medium">Treatment</p>
        <p className="text-lg text-indigo-900 font-semibold">Cranio Sacral Session</p>
      </div>

      {/* Date Picker */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Date
        </label>
        <DatePickerPopover
          selectedDate={selectedDate}
          min={getMinDate()}
          max={getMaxDate()}
          blockedSlots={blockedSlots}
          availableDates={availableDates}
          onChange={(date) => {
            setSelectedDate(date)
            setSelectedSlot(null)
          }}
          data-testid="appointment-date-picker"
        />
        <p className="text-xs text-gray-500">Times shown in your local time zone</p>
      </div>

      {/* Time Slots */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Select Time</label>
        {loading && (
          <div className="text-center py-8 text-gray-500">Loading available times...</div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
            {error}
          </div>
        )}
        {!loading && !error && slots.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No available time slots for this date
          </div>
        )}
        {!loading && !error && slots.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {slots.map((slot) => {
              const slotKey = `${slot.date}-${slot.startTime}`
              const isSelected = selectedSlot === slotKey
              const sessionStart = slot.sessionStart || slot.startTime
              const sessionEnd = slot.sessionEnd || slot.endTime

              return (
                <button
                  key={slotKey}
                  onClick={() => handleSlotSelect(slot)}
                  disabled={slot.status !== 'available'}
                  className={`
                    px-4 py-3 rounded-lg border-2 transition-all duration-200
                    ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold'
                        : slot.status === 'available'
                        ? 'border-gray-300 bg-white text-gray-900 hover:border-indigo-500 hover:bg-indigo-50'
                        : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  <div className="text-sm font-medium">{formatTime(sessionStart)}</div>
                  <div className="text-xs text-gray-500 mt-1">1 hour session</div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Selected Slot Info */}
      {selectedSlot && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800 font-medium">Selected Appointment</p>
          <p className="text-lg text-green-900 font-semibold">
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            {' at '}
            {formatTime(
              slots.find((s) => `${s.date}-${s.startTime}` === selectedSlot)?.sessionStart ||
                '00:00'
            )}
          </p>
        </div>
      )}
    </div>
  )
}

