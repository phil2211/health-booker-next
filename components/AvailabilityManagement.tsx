'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AvailabilityEntry, BlockedSlot } from '@/lib/types'
import WeeklyAvailabilityEditor from './WeeklyAvailabilityEditor'
import BlockedSlotsEditor from './BlockedSlotsEditor'

export default function AvailabilityManagement() {
  const router = useRouter()
  const [weeklyAvailability, setWeeklyAvailability] = useState<AvailabilityEntry[]>([])
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [initialState, setInitialState] = useState<{
    weeklyAvailability: AvailabilityEntry[]
    blockedSlots: BlockedSlot[]
  } | null>(null)

  // Load current availability on mount
  useEffect(() => {
    async function loadAvailability() {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/therapist/availability')
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login')
            return
          }
          throw new Error('Failed to load availability')
        }

        const data = await response.json()
        const weeklyAvail = data.weeklyAvailability || []
        const blocked = data.blockedSlots || []
        
        setWeeklyAvailability(weeklyAvail)
        setBlockedSlots(blocked)
        setInitialState({ weeklyAvailability: weeklyAvail, blockedSlots: blocked })
      } catch (err) {
        console.error('Error loading availability:', err)
        setError('Failed to load availability. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadAvailability()
  }, [router])

  // Track changes
  useEffect(() => {
    if (initialState) {
      const hasWeeklyChanges = JSON.stringify(weeklyAvailability.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek
        return a.startTime.localeCompare(b.startTime)
      })) !== JSON.stringify(initialState.weeklyAvailability.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek
        return a.startTime.localeCompare(b.startTime)
      }))
      
      const hasBlockedChanges = JSON.stringify(blockedSlots) !== JSON.stringify(initialState.blockedSlots)
      
      setHasChanges(hasWeeklyChanges || hasBlockedChanges)
    }
  }, [weeklyAvailability, blockedSlots, initialState])

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Client-side validation
      const validationError = validateAvailability()
      if (validationError) {
        setError(validationError)
        setSaving(false)
        return
      }

      const response = await fetch('/api/therapist/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          weeklyAvailability,
          blockedSlots,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save availability')
      }

      const data = await response.json()
      setWeeklyAvailability(data.weeklyAvailability || [])
      setBlockedSlots(data.blockedSlots || [])
      setInitialState({
        weeklyAvailability: data.weeklyAvailability || [],
        blockedSlots: data.blockedSlots || [],
      })
      setSuccess('Availability updated successfully!')
      setHasChanges(false)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error saving availability:', err)
      setError(err instanceof Error ? err.message : 'Failed to save availability')
    } finally {
      setSaving(false)
    }
  }

  const validateAvailability = (): string | null => {
    // Validate weekly availability
    for (const entry of weeklyAvailability) {
      if (entry.dayOfWeek < 0 || entry.dayOfWeek > 6) {
        return `Invalid day of week: ${entry.dayOfWeek}. Must be between 0-6.`
      }

      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
      if (!timeRegex.test(entry.startTime) || !timeRegex.test(entry.endTime)) {
        return `Invalid time format for ${DAYS[entry.dayOfWeek]}. Use HH:MM format.`
      }

      const startMinutes = timeToMinutes(entry.startTime)
      const endMinutes = timeToMinutes(entry.endTime)
      if (startMinutes >= endMinutes) {
        return `Start time must be before end time for ${DAYS[entry.dayOfWeek]}.`
      }
    }

    // Validate blocked slots
    for (const slot of blockedSlots) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(slot.date)) {
        return `Invalid date format: ${slot.date}. Use YYYY-MM-DD format.`
      }

      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        return `Invalid time format for blocked slot ${slot.date}. Use HH:MM format.`
      }

      const startMinutes = timeToMinutes(slot.startTime)
      const endMinutes = timeToMinutes(slot.endTime)
      if (startMinutes >= endMinutes) {
        return `Start time must be before end time for blocked slot ${slot.date}.`
      }
    }

    return null
  }

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const handleCancel = () => {
    if (hasChanges && !confirm('You have unsaved changes. Are you sure you want to leave?')) {
      return
    }
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-gray-600">Loading availability...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-600 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Weekly Availability Editor */}
      <div className="bg-white rounded-xl shadow-md border p-6">
        <WeeklyAvailabilityEditor
          weeklyAvailability={weeklyAvailability}
          onChange={setWeeklyAvailability}
        />
      </div>

      {/* Blocked Slots Editor */}
      <div className="bg-white rounded-xl shadow-md border p-6">
        <BlockedSlotsEditor
          blockedSlots={blockedSlots}
          onChange={setBlockedSlots}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          onClick={handleCancel}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-gray-500">You have unsaved changes</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving && (
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

