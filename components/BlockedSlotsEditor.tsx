'use client'

import { useState, useRef } from 'react'
import { BlockedSlot } from '@/lib/types'
import DateRangePickerPopover from './DateRangePickerPopover'

interface BlockedSlotsEditorProps {
  blockedSlots: BlockedSlot[]
  onChange: (blockedSlots: BlockedSlot[]) => void
}

export default function BlockedSlotsEditor({
  blockedSlots,
  onChange,
}: BlockedSlotsEditorProps) {
  const [newSlot, setNewSlot] = useState<BlockedSlot>({
    fromDate: '',
    toDate: '',
    startTime: '09:00',
    endTime: '17:00',
  })

  const removeBlockedSlot = (index: number) => {
    onChange(blockedSlots.filter((_, i) => i !== index))
  }

  const formatDate = (dateString: string): string => {
    try {
      if (!dateString || typeof dateString !== 'string') {
        return dateString || 'Invalid date'
      }
      const date = new Date(dateString + 'T00:00:00.000Z')
      if (isNaN(date.getTime())) {
        return dateString // Return original if invalid
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch (error) {
      console.error('Error formatting date:', error)
      return dateString || 'Invalid date'
    }
  }

  const formatDateWithTime = (dateString: string, time: string): string => {
    try {
      if (!dateString || typeof dateString !== 'string') {
        return dateString || 'Invalid date'
      }
      const date = new Date(dateString + 'T00:00:00.000Z')
      if (isNaN(date.getTime())) {
        return dateString
      }
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      return `${formattedDate} ${time}`
    } catch (error) {
      console.error('Error formatting date:', error)
      return `${dateString} ${time}`
    }
  }

  // Get today's date
  const today = new Date()

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Blocked Time Slots</h3>
      <p className="text-sm text-gray-600 mb-6">
        Block specific dates and times when you're not available for appointments.
      </p>

      {/* Add New Blocked Slot Form */}
      <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Add Blocked Slot</h4>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Date Range & Times
            </label>
            <DateRangePickerPopover
              fromDate={newSlot.fromDate}
              toDate={newSlot.toDate}
              startTime={newSlot.startTime}
              endTime={newSlot.endTime}
              min={today}
              blockedSlots={blockedSlots}
              onChange={({ from, to, startTime, endTime }) => {
                setNewSlot((prev) => ({ ...prev, fromDate: from, toDate: to, startTime, endTime }))
              }}
              onApply={({ from, to, startTime, endTime }) => {
                // Validate and add the blocked slot directly
                const fromDateValue = from
                const toDateValue = to
                const startTimeValue = startTime
                const endTimeValue = endTime

                // Validate
                if (!fromDateValue || !toDateValue || !startTimeValue || !endTimeValue) {
                  alert('Please fill in all fields (dates and times)')
                  return
                }

                // Check if date format is valid (YYYY-MM-DD)
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/
                if (!dateRegex.test(fromDateValue) || !dateRegex.test(toDateValue)) {
                  alert('Invalid date format. Please select dates again.')
                  return
                }

                // Check if fromDate <= toDate
                const fromDateObj = new Date(fromDateValue + 'T00:00:00.000Z')
                const toDateObj = new Date(toDateValue + 'T00:00:00.000Z')
                if (fromDateObj > toDateObj) {
                  alert('Start date must be before or equal to end date')
                  return
                }

                // Check if start datetime < end datetime (considering both date and time)
                const startDateTime = new Date(fromDateValue + 'T' + startTimeValue + ':00')
                const endDateTime = new Date(toDateValue + 'T' + endTimeValue + ':00')
                
                if (startDateTime >= endDateTime) {
                  if (fromDateValue === toDateValue) {
                    alert('Start time must be before end time')
                  } else {
                    alert('Start date and time must be before end date and time')
                  }
                  return
                }

                // Check for duplicates (overlapping ranges with same time)
                const isDuplicate = blockedSlots.some((slot) => {
                  const slotFromDate = slot.fromDate || slot.date || ''
                  const slotToDate = slot.toDate || slot.date || ''
                  const slotStart = new Date(slotFromDate + 'T00:00:00.000Z')
                  const slotEnd = new Date(slotToDate + 'T00:00:00.000Z')

                  // Check if ranges overlap and times match
                  const rangesOverlap = fromDateObj <= slotEnd && toDateObj >= slotStart
                  const timesMatch = slot.startTime === startTimeValue && slot.endTime === endTimeValue

                  return rangesOverlap && timesMatch
                })

                if (isDuplicate) {
                  alert('This date range and time slot is already blocked')
                  return
                }

                // Add the blocked slot
                onChange([...blockedSlots, {
                  fromDate: fromDateValue,
                  toDate: toDateValue,
                  startTime: startTimeValue,
                  endTime: endTimeValue
                }])

                // Reset form
                setNewSlot({
                  fromDate: '',
                  toDate: '',
                  startTime: '09:00',
                  endTime: '17:00',
                })
              }}
              data-testid="blocked-range"
            />
          </div>
        </div>
      </div>

      {/* Existing Blocked Slots List */}
      {blockedSlots.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
          <p className="text-sm text-gray-500">
            No blocked slots. Add one above to block specific dates and times.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">
            Current Blocked Slots ({blockedSlots.length})
          </h4>
          {blockedSlots
            .map((slot, index) => ({ slot, originalIndex: index }))
            .filter(({ slot }) => {
              // Support both new format (fromDate/toDate) and legacy format (date)
              const hasValidDates = (slot.fromDate && slot.toDate) || slot.date
              return slot && typeof slot === 'object' && hasValidDates && slot.startTime && slot.endTime
            })
            .sort((a, b) => {
              // Sort by fromDate (or date for legacy), then by start time
              const aDate = a.slot.fromDate || a.slot.date || ''
              const bDate = b.slot.fromDate || b.slot.date || ''
              const aToDate = a.slot.toDate || a.slot.date || ''
              const bToDate = b.slot.toDate || b.slot.date || ''
              const aStartTime = a.slot.startTime || ''
              const bStartTime = b.slot.startTime || ''

              if (aDate !== bDate) return aDate.localeCompare(bDate)
              if (aToDate !== bToDate) return aToDate.localeCompare(bToDate)
              return aStartTime.localeCompare(bStartTime)
            })
            .map(({ slot, originalIndex }) => {
              // Support both new format (fromDate/toDate) and legacy format (date)
              const fromDate = slot.fromDate || slot.date || ''
              const toDate = slot.toDate || slot.date || ''

              return (
                <div
                  key={`${fromDate}-${toDate}-${slot.startTime}-${slot.endTime}-${originalIndex}`}
                  className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {formatDateWithTime(fromDate, slot.startTime)} to {formatDateWithTime(toDate, slot.endTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeBlockedSlot(originalIndex)}
                    className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Remove blocked slot"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}

