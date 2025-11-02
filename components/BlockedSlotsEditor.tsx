'use client'

import { useState, useRef } from 'react'
import { BlockedSlot } from '@/lib/types'

interface BlockedSlotsEditorProps {
  blockedSlots: BlockedSlot[]
  onChange: (blockedSlots: BlockedSlot[]) => void
}

export default function BlockedSlotsEditor({
  blockedSlots,
  onChange,
}: BlockedSlotsEditorProps) {
  const [newSlot, setNewSlot] = useState<BlockedSlot>({
    date: '',
    startTime: '09:00',
    endTime: '17:00',
  })
  
  const startTimeInputRef = useRef<HTMLInputElement>(null)
  const endTimeInputRef = useRef<HTMLInputElement>(null)

  const addBlockedSlot = () => {
    // Validate
    if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
      return
    }

    // Check if date format is valid (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(newSlot.date)) {
      return
    }

    // Check if start time < end time
    const startMinutes = timeToMinutes(newSlot.startTime)
    const endMinutes = timeToMinutes(newSlot.endTime)
    if (startMinutes >= endMinutes) {
      return
    }

    // Check for duplicates
    const isDuplicate = blockedSlots.some(
      (slot) =>
        slot.date === newSlot.date &&
        slot.startTime === newSlot.startTime &&
        slot.endTime === newSlot.endTime
    )

    if (isDuplicate) {
      return
    }

    onChange([...blockedSlots, { ...newSlot }])
    
    // Reset form
    setNewSlot({
      date: '',
      startTime: '09:00',
      endTime: '17:00',
    })
  }

  const removeBlockedSlot = (index: number) => {
    onChange(blockedSlots.filter((_, i) => i !== index))
  }

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
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

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Blocked Time Slots</h3>
      <p className="text-sm text-gray-600 mb-6">
        Block specific dates and times when you're not available for appointments.
      </p>

      {/* Add New Blocked Slot Form */}
      <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Add Blocked Slot</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={newSlot.date}
              onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
              min={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <div className="relative">
              <input
                ref={startTimeInputRef}
                type="time"
                value={newSlot.startTime}
                onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                required
              />
              <button
                type="button"
                onClick={() => startTimeInputRef.current?.showPicker?.() || startTimeInputRef.current?.focus()}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                aria-label="Open time picker"
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              End Time
            </label>
            <div className="relative">
              <input
                ref={endTimeInputRef}
                type="time"
                value={newSlot.endTime}
                onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                required
              />
              <button
                type="button"
                onClick={() => endTimeInputRef.current?.showPicker?.() || endTimeInputRef.current?.focus()}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
                aria-label="Open time picker"
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={addBlockedSlot}
              disabled={!newSlot.date || !newSlot.startTime || !newSlot.endTime}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Add Block
            </button>
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
            .filter(({ slot }) => slot && typeof slot === 'object' && slot.date && slot.startTime && slot.endTime)
            .sort((a, b) => {
              // Sort by date, then by start time
              if (a.slot.date !== b.slot.date) {
                return a.slot.date.localeCompare(b.slot.date)
              }
              return a.slot.startTime.localeCompare(b.slot.startTime)
            })
            .map(({ slot, originalIndex }) => (
              <div
                key={`${slot.date}-${slot.startTime}-${slot.endTime}-${originalIndex}`}
                className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {formatDate(slot.date)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {slot.startTime} - {slot.endTime}
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
            ))}
        </div>
      )}
    </div>
  )
}

