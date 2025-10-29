'use client'

import { AvailabilityEntry } from '@/lib/types'

interface WeeklyAvailabilityEditorProps {
  weeklyAvailability: AvailabilityEntry[]
  onChange: (availability: AvailabilityEntry[]) => void
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
]

export default function WeeklyAvailabilityEditor({
  weeklyAvailability,
  onChange,
}: WeeklyAvailabilityEditorProps) {
  const getAvailabilityForDay = (dayOfWeek: number): AvailabilityEntry[] => {
    return weeklyAvailability.filter((avail) => avail.dayOfWeek === dayOfWeek)
  }

  const hasAvailabilityForDay = (dayOfWeek: number): boolean => {
    return getAvailabilityForDay(dayOfWeek).length > 0
  }

  const toggleDayAvailability = (dayOfWeek: number) => {
    const existing = getAvailabilityForDay(dayOfWeek)
    
    if (existing.length > 0) {
      // Remove all availability for this day
      onChange(weeklyAvailability.filter((avail) => avail.dayOfWeek !== dayOfWeek))
    } else {
      // Add default availability for this day (9 AM - 5 PM)
      onChange([
        ...weeklyAvailability,
        { dayOfWeek, startTime: '09:00', endTime: '17:00' },
      ])
    }
  }

  const updateAvailabilityEntry = (dayOfWeek: number, index: number, field: 'startTime' | 'endTime', value: string) => {
    const dayEntries = getAvailabilityForDay(dayOfWeek)
    const updatedEntry = { ...dayEntries[index], [field]: value }
    
    const otherDayEntries = weeklyAvailability.filter(
      (avail) => avail.dayOfWeek !== dayOfWeek
    )
    
    const updatedDayEntries = [...dayEntries]
    updatedDayEntries[index] = updatedEntry
    
    onChange([...otherDayEntries, ...updatedDayEntries])
  }

  const addTimeRange = (dayOfWeek: number) => {
    const dayEntries = getAvailabilityForDay(dayOfWeek)
    const lastEntry = dayEntries[dayEntries.length - 1]
    
    // Add a new time range, starting after the last one ends
    const newStartTime = lastEntry 
      ? addMinutesToTime(lastEntry.endTime, 30)
      : '09:00'
    
    const newEndTime = addMinutesToTime(newStartTime, 8 * 60) // 8 hours later
    
    const otherDayEntries = weeklyAvailability.filter(
      (avail) => avail.dayOfWeek !== dayOfWeek
    )
    
    onChange([
      ...otherDayEntries,
      ...dayEntries,
      { dayOfWeek, startTime: newStartTime, endTime: newEndTime },
    ])
  }

  const removeTimeRange = (dayOfWeek: number, index: number) => {
    const dayEntries = getAvailabilityForDay(dayOfWeek)
    const otherDayEntries = weeklyAvailability.filter(
      (avail) => avail.dayOfWeek !== dayOfWeek
    )
    
    const updatedDayEntries = dayEntries.filter((_, i) => i !== index)
    
    onChange([...otherDayEntries, ...updatedDayEntries])
  }

  const addMinutesToTime = (time: string, minutes: number): string => {
    const [hours, mins] = time.split(':').map(Number)
    const totalMinutes = hours * 60 + mins + minutes
    const newHours = Math.floor(totalMinutes / 60) % 24
    const newMins = totalMinutes % 60
    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Availability</h3>
      <p className="text-sm text-gray-600 mb-6">
        Set your recurring weekly schedule. Enable days and set time ranges when you're available.
      </p>
      
      {DAYS_OF_WEEK.map((day) => {
        const dayEntries = getAvailabilityForDay(day.value)
        const isEnabled = hasAvailabilityForDay(day.value)
        
        return (
          <div
            key={day.value}
            className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200"
          >
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => toggleDayAvailability(day.value)}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-base font-medium text-gray-900">
                  {day.label}
                </span>
              </label>
              {isEnabled && (
                <button
                  onClick={() => addTimeRange(day.value)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  + Add Time Range
                </button>
              )}
            </div>

            {isEnabled && dayEntries.length > 0 && (
              <div className="space-y-3 mt-3 pl-8">
                {dayEntries.map((entry, index) => (
                  <div
                    key={`${day.value}-${index}`}
                    className="flex items-center gap-3 bg-white p-3 rounded border"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={entry.startTime}
                          onChange={(e) =>
                            updateAvailabilityEntry(
                              day.value,
                              index,
                              'startTime',
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={entry.endTime}
                          onChange={(e) =>
                            updateAvailabilityEntry(
                              day.value,
                              index,
                              'endTime',
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                    </div>
                    {dayEntries.length > 1 && (
                      <button
                        onClick={() => removeTimeRange(day.value, index)}
                        className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        aria-label="Remove time range"
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
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

