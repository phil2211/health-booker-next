'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AvailabilityEntry, BlockedSlot, TherapyOffering } from '@/lib/types'
import WeeklyAvailabilityEditor from './WeeklyAvailabilityEditor'
import BlockedSlotsEditor from './BlockedSlotsEditor'
import TherapyOfferingsEditor from './TherapyOfferingsEditor'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useLocale } from '@/lib/i18n/LocaleProvider'

export default function AvailabilityManagement() {
  const { t } = useTranslation()
  const locale = useLocale()
  const router = useRouter()
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [weeklyAvailability, setWeeklyAvailability] = useState<AvailabilityEntry[]>([])
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([])
  const [therapyOfferings, setTherapyOfferings] = useState<TherapyOffering[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [initialState, setInitialState] = useState<{
    weeklyAvailability: AvailabilityEntry[]
    blockedSlots: BlockedSlot[]
    therapyOfferings: TherapyOffering[]
  } | null>(null)
  const [therapistInfo, setTherapistInfo] = useState<{
    bio: string | { en: string; de: string }
    specialization: string | { en: string; de: string }
  } | null>(null)

  // Load current availability on mount
  useEffect(() => {
    let isMounted = true

    async function loadAvailability() {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/therapist/availability')

        if (!isMounted) return

        if (!response.ok) {
          if (response.status === 401) {
            const loginPath = locale === 'en' ? '/login' : `/${locale}/login`
            router.push(loginPath)
            return
          }
          throw new Error(t('availability.failedToLoad'))
        }

        const data = await response.json()
        const weeklyAvail = data.weeklyAvailability || []
        const blocked = data.blockedSlots || []
        const offerings = data.therapyOfferings || []
        const bio = data.bio || ''
        const specialization = data.specialization || ''

        if (!isMounted) return

        setWeeklyAvailability(weeklyAvail)
        setBlockedSlots(blocked)
        setTherapyOfferings(offerings)
        setInitialState({
          weeklyAvailability: weeklyAvail,
          blockedSlots: blocked,
          therapyOfferings: offerings
        })
        setTherapyOfferings(offerings)
        setTherapistInfo({ bio, specialization })
      } catch (err) {
        if (!isMounted) return
        console.error('Error loading availability:', err)
        setError(t('availability.failedToLoad'))
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadAvailability()

    return () => {
      isMounted = false
    }
  }, [router, t, locale])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
        successTimeoutRef.current = null
      }
    }
  }, [])

  // Track changes
  useEffect(() => {
    if (initialState) {
      // Create sorted copies to avoid mutating original arrays
      const sortedWeekly = [...weeklyAvailability].sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek
        return a.startTime.localeCompare(b.startTime)
      })
      const sortedInitialWeekly = [...initialState.weeklyAvailability].sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek
        return a.startTime.localeCompare(b.startTime)
      })

      const hasWeeklyChanges = JSON.stringify(sortedWeekly) !== JSON.stringify(sortedInitialWeekly)

      // Sort blocked slots for comparison to handle order differences
      const sortedBlocked = [...blockedSlots].sort((a, b) => {
        const aFromDate = a.fromDate || a.date || ''
        const bFromDate = b.fromDate || b.date || ''
        const aToDate = a.toDate || a.date || ''
        const bToDate = b.toDate || b.date || ''

        if (aFromDate !== bFromDate) return aFromDate.localeCompare(bFromDate)
        if (aToDate !== bToDate) return aToDate.localeCompare(bToDate)
        if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime)
        return a.endTime.localeCompare(b.endTime)
      })
      const sortedInitialBlocked = [...initialState.blockedSlots].sort((a, b) => {
        const aFromDate = a.fromDate || a.date || ''
        const bFromDate = b.fromDate || b.date || ''
        const aToDate = a.toDate || a.date || ''
        const bToDate = b.toDate || b.date || ''

        if (aFromDate !== bFromDate) return aFromDate.localeCompare(bFromDate)
        if (aToDate !== bToDate) return aToDate.localeCompare(bToDate)
        if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime)
        return a.endTime.localeCompare(b.endTime)
      })

      const hasBlockedChanges = JSON.stringify(sortedBlocked) !== JSON.stringify(sortedInitialBlocked)

      // Sort therapy offerings for comparison
      const sortedOfferings = [...therapyOfferings].sort((a, b) => {
        const aId = a._id || ''
        const bId = b._id || ''
        return aId.localeCompare(bId)
      })
      const sortedInitialOfferings = [...initialState.therapyOfferings].sort((a, b) => {
        const aId = a._id || ''
        const bId = b._id || ''
        return aId.localeCompare(bId)
      })

      const hasOfferingsChanges = JSON.stringify(sortedOfferings) !== JSON.stringify(sortedInitialOfferings)

      setHasChanges(hasWeeklyChanges || hasBlockedChanges || hasOfferingsChanges)
    }
  }, [weeklyAvailability, blockedSlots, therapyOfferings, initialState])

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
          therapyOfferings,
        }),
      })

      if (!response.ok) {
        let errorMessage = t('availability.failedToSave')
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = `${t('availability.failedToSave')}: ${response.status} ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setWeeklyAvailability(data.weeklyAvailability || [])
      setBlockedSlots(data.blockedSlots || [])
      setTherapyOfferings(data.therapyOfferings || [])
      setInitialState({
        weeklyAvailability: data.weeklyAvailability || [],
        blockedSlots: data.blockedSlots || [],
        therapyOfferings: data.therapyOfferings || [],
      })
      setSuccess(t('availability.availabilityUpdated'))
      setHasChanges(false)

      // Clear any existing timeout
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }

      // Clear success message after 3 seconds
      successTimeoutRef.current = setTimeout(() => {
        setSuccess(null)
        successTimeoutRef.current = null
      }, 3000)
    } catch (err) {
      console.error('Error saving availability:', err)
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Network error: Unable to connect to server. Please check your connection and try again.')
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(t('availability.failedToSave'))
      }
    } finally {
      setSaving(false)
    }
  }

  const validateAvailability = (): string | null => {
    // Validate weekly availability
    if (Array.isArray(weeklyAvailability)) {
      for (const entry of weeklyAvailability) {
        if (!entry || typeof entry !== 'object') {
          return 'Invalid weekly availability entry.'
        }

        if (typeof entry.dayOfWeek !== 'number' || entry.dayOfWeek < 0 || entry.dayOfWeek > 6) {
          return `Invalid day of week: ${entry.dayOfWeek}. Must be between 0-6.`
        }

        if (!entry.startTime || !entry.endTime || typeof entry.startTime !== 'string' || typeof entry.endTime !== 'string') {
          return `Invalid time format for ${DAYS[entry.dayOfWeek]}. Start and end times are required.`
        }

        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
        if (!timeRegex.test(entry.startTime) || !timeRegex.test(entry.endTime)) {
          return `Invalid time format for ${DAYS[entry.dayOfWeek]}. Use HH:MM format.`
        }

        const startMinutes = timeToMinutes(entry.startTime)
        const endMinutes = timeToMinutes(entry.endTime)
        if (isNaN(startMinutes) || isNaN(endMinutes) || startMinutes >= endMinutes) {
          return `Start time must be before end time for ${DAYS[entry.dayOfWeek]}.`
        }
      }
    }

    // Validate blocked slots
    if (Array.isArray(blockedSlots)) {
      for (const slot of blockedSlots) {
        if (!slot || typeof slot !== 'object') {
          return 'Invalid blocked slot entry.'
        }

        // Support both new format (fromDate/toDate) and legacy format (date)
        const fromDate = slot.fromDate || slot.date
        const toDate = slot.toDate || slot.date

        if (!fromDate || !toDate || typeof fromDate !== 'string' || typeof toDate !== 'string') {
          return 'Blocked slot dates are required and must be strings.'
        }

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(fromDate) || !dateRegex.test(toDate)) {
          return `Invalid date format: ${fromDate} - ${toDate}. Use YYYY-MM-DD format.`
        }

        // Check that fromDate <= toDate
        const from = new Date(fromDate + 'T00:00:00.000Z')
        const to = new Date(toDate + 'T00:00:00.000Z')
        if (from > to) {
          return `From date must be before or equal to to date: ${fromDate} - ${toDate}.`
        }

        if (!slot.startTime || !slot.endTime || typeof slot.startTime !== 'string' || typeof slot.endTime !== 'string') {
          return `Invalid time format for blocked slot ${fromDate} - ${toDate}. Start and end times are required.`
        }

        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
        if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
          return `Invalid time format for blocked slot ${fromDate} - ${toDate}. Use HH:MM format.`
        }

        // Check that start datetime is before end datetime (considering both date and time)
        const startDateTime = new Date(fromDate + 'T' + slot.startTime + ':00')
        const endDateTime = new Date(toDate + 'T' + slot.endTime + ':00')
        if (startDateTime >= endDateTime) {
          if (fromDate === toDate) {
            return `Start time must be before end time for blocked slot ${fromDate} - ${toDate}.`
          } else {
            return `Start date and time must be before end date and time for blocked slot ${fromDate} - ${toDate}.`
          }
        }
      }
    }

    // Validate therapy offerings
    if (Array.isArray(therapyOfferings)) {
      for (const offering of therapyOfferings) {
        if (!offering || typeof offering !== 'object') {
          return 'Invalid therapy offering entry.'
        }

        if (typeof offering.duration !== 'number' || offering.duration < 15 || offering.duration > 240) {
          return 'Duration must be between 15 and 240 minutes.'
        }

        if (typeof offering.breakDuration !== 'number' || offering.breakDuration < 0 || offering.breakDuration > 60) {
          return 'Break duration must be between 0 and 60 minutes.'
        }

        if (offering.price !== undefined && (typeof offering.price !== 'number' || offering.price < 0)) {
          return 'Price must be a valid positive number.'
        }
      }
    }

    return null
  }

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const handleCancel = () => {
    if (hasChanges && !confirm(t('appointments.unsavedChanges'))) {
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
          <p className="text-gray-600">{t('availability.loadingAvailability')}</p>
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

      {/* Therapy Offerings Editor */}
      <div className="bg-white rounded-xl shadow-md border p-6">
        <TherapyOfferingsEditor
          therapyOfferings={therapyOfferings}
          onChange={setTherapyOfferings}
          therapistBio={therapistInfo?.bio}
          therapistSpecialization={therapistInfo?.specialization}
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
          className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          {hasChanges ? t('common.cancel') : t('common.return')}
        </button>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-sm text-gray-500">{t('availability.unsavedChanges')}</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
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
            {saving ? t('availability.saving') : t('availability.saveChanges')}
          </button>
        </div>
      </div>
    </div>
  )
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

