'use client'

import { useState, useEffect } from 'react'
import { TimeSlot } from '@/lib/utils/availability'
import { BlockedSlot } from '@/lib/types'
import DatePickerPopover from './DatePickerPopover'
import BookingConfirmation from './BookingConfirmation'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { isValidEmail } from '@/lib/utils/validation'

interface PatientBookingSchedulerProps {
  therapistId: string
  blockedSlots?: BlockedSlot[]
  onBookingConfirmed?: () => void
  therapistName?: string
}

interface AvailabilityResponse {
  slots: TimeSlot[]
  therapistId: string
  startDate: string
  endDate: string
}

export default function PatientBookingScheduler({ therapistId, blockedSlots = [], onBookingConfirmed, therapistName }: PatientBookingSchedulerProps) {
  const { t, locale } = useTranslation()
  const [selectedDate, setSelectedDate] = useState<string>('')

  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)

  // Patient form state
  const [patientName, setPatientName] = useState<string>('')
  const [patientEmail, setPatientEmail] = useState<string>('')
  const [patientPhone, setPatientPhone] = useState<string>('')
  const [patientComment, setPatientComment] = useState<string>('')
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false)

  // Booking confirmation details
  const [bookingDetails, setBookingDetails] = useState<{
    patientName: string
    patientEmail: string
    appointmentDate: string
    startTime: string
    endTime: string
    therapistName: string
    cancellationToken: string
  } | null>(null)

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

  // Format time from HH:MM string to localized time format
  // Slot times are already in business timezone, just format them nicely
  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number)

    // Use 24-hour format for European locales (de, etc.), 12-hour for others
    const isEuropeanLocale = locale === 'de' // Add more European locales as needed
    const localeString = isEuropeanLocale ? 'de-DE' : 'en-US'

    // Create a date object for today at the specified time (in local timezone)
    const date = new Date()
    date.setHours(hours, minutes, 0, 0)

    // Format in user's locale without timezone conversion
    return date.toLocaleTimeString(localeString, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: !isEuropeanLocale, // false for European (24h), true for others (12h)
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
      setSubmitError(null)
      setSubmitSuccess(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Set custom validation messages before checking validity
    const nameInput = document.getElementById('patient-name') as HTMLInputElement
    const emailInput = document.getElementById('patient-email') as HTMLInputElement
    
    if (nameInput) {
      if (!patientName.trim()) {
        nameInput.setCustomValidity(t('patientForm.errors.fillThisField'))
      } else {
        nameInput.setCustomValidity('')
      }
    }
    
    if (emailInput) {
      if (!patientEmail.trim()) {
        emailInput.setCustomValidity(t('patientForm.errors.fillThisField'))
      } else {
        if (!isValidEmail(patientEmail)) {
          emailInput.setCustomValidity(t('patientForm.errors.invalidEmail'))
        } else {
          emailInput.setCustomValidity('')
        }
      }
    }
    
    // Check HTML5 validation - this will trigger the browser's validation popover
    const form = e.currentTarget as HTMLFormElement
    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }
    
    if (!selectedSlot || !selectedDate) {
      setSubmitError(t('patientForm.errors.selectDateAndTime'))
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      const slot = slots.find((s) => `${s.date}-${s.startTime}` === selectedSlot)
      if (!slot) {
        throw new Error('Selected slot not found')
      }

      const sessionStart = slot.sessionStart || slot.startTime
      const sessionEnd = slot.sessionEnd || slot.endTime

      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistId,
          patientName: patientName.trim(),
          patientEmail: patientEmail.trim(),
          patientPhone: patientPhone.trim() || undefined,
          patientComment: patientComment.trim() || undefined,
          appointmentDate: selectedDate,
          startTime: sessionStart,
          endTime: sessionEnd,
          locale,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Extract error message from response
        const errorMessage = data.error || 'Failed to create booking'
        throw new Error(errorMessage)
      }

      // Store booking details for confirmation
      setBookingDetails({
        patientName: patientName.trim(),
        patientEmail: patientEmail.trim(),
        appointmentDate: selectedDate,
        startTime: sessionStart,
        endTime: sessionEnd,
        therapistName: therapistName || 'Your Therapist',
        cancellationToken: data.booking.cancellationToken
      })

      setSubmitSuccess(true)
      // Call callback to notify parent component
      if (onBookingConfirmed) {
        onBookingConfirmed()
      }
      // Store selected date before clearing
      const bookedDate = selectedDate
      // Reset form
      setPatientName('')
      setPatientEmail('')
      setPatientPhone('')
      setPatientComment('')
      setSelectedSlot(null)
      setSelectedDate('')
      
      // Refresh availability to show updated slots
      if (bookedDate) {
        const refreshResponse = await fetch(
          `/api/therapist/${therapistId}/availability?startDate=${bookedDate}&endDate=${bookedDate}`
        )
        if (refreshResponse.ok) {
          const refreshData: AvailabilityResponse = await refreshResponse.json()
          const availableSlots = refreshData.slots.filter(
            (s) => s.date === bookedDate && s.status === 'available'
          )
          setSlots(availableSlots)
        }
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An error occurred while creating the booking')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Treatment Label - Hide when booking is confirmed */}
      {!submitSuccess && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <p className="text-sm text-indigo-800 font-medium">{t('booking.treatment')}</p>
          <p className="text-lg text-indigo-900 font-semibold">{t('booking.cranioSacralSession')}</p>
        </div>
      )}

      {/* Date Picker - Hide when booking is confirmed */}
      {!submitSuccess && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('booking.selectDate')}
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
          <p className="text-xs text-gray-500">{t('booking.localTimeZone')}</p>
        </div>
      )}

      {/* Time Slots - Hide when booking is confirmed */}
      {!submitSuccess && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">{t('booking.selectTime')}</label>
          {loading && (
            <div className="text-center py-8 text-gray-500">{t('booking.loadingAvailableTimes')}</div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
              {error}
            </div>
          )}
          {!loading && !error && slots.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {t('booking.noAvailableTimeSlots')}
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
                    <div className="text-xs text-gray-500 mt-1">{t('booking.oneHourSession')}</div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Slot Info */}
      {selectedSlot && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-green-800 font-medium">{t('booking.selectedAppointment')}</p>
          <p className="text-lg text-green-900 font-semibold">
            {new Date(selectedDate).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
            {` ${t('booking.at')} `}
            {formatTime(
              slots.find((s) => `${s.date}-${s.startTime}` === selectedSlot)?.sessionStart ||
                '00:00'
            )}
          </p>
        </div>
      )}

      {/* Patient Information Form */}
      {selectedSlot && !submitSuccess && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('patientForm.patientInformation')}</h3>
            
            {submitError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                {submitError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="patient-name" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('patientForm.fullName')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="patient-name"
                  type="text"
                  required
                  value={patientName}
                  onChange={(e) => {
                    setPatientName(e.target.value)
                    e.target.setCustomValidity('')
                  }}
                  onInvalid={(e) => {
                    const target = e.target as HTMLInputElement
                    target.setCustomValidity(t('patientForm.errors.fillThisField'))
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                  placeholder={t('booking.fullNamePlaceholder')}
                />
              </div>

              <div>
                <label htmlFor="patient-email" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('patientForm.emailAddress')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="patient-email"
                  type="email"
                  required
                  value={patientEmail}
                  onChange={(e) => {
                    setPatientEmail(e.target.value)
                    const target = e.target as HTMLInputElement
                    target.setCustomValidity('')
                    // Validate email format on change
                    if (e.target.value && !isValidEmail(e.target.value)) {
                      target.setCustomValidity(t('patientForm.errors.invalidEmail'))
                    }
                  }}
                  onInvalid={(e) => {
                    const target = e.target as HTMLInputElement
                    if (target.validity.valueMissing) {
                      target.setCustomValidity(t('patientForm.errors.fillThisField'))
                    } else if (target.validity.typeMismatch) {
                      target.setCustomValidity(t('patientForm.errors.invalidEmail'))
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                  placeholder={t('booking.emailPlaceholder')}
                />
              </div>

              <div>
                <label htmlFor="patient-phone" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('patientForm.phoneNumber')} <span className="text-gray-500 text-xs">{t('patientForm.phoneOptional')}</span>
                </label>
                <input
                  id="patient-phone"
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black"
                  placeholder={t('patientForm.phonePlaceholder')}
                />
              </div>

              <div>
                <label htmlFor="patient-comment" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('patientForm.specialRequirements')} <span className="text-gray-500 text-xs">{t('patientForm.phoneOptional')}</span>
                </label>
                <textarea
                  id="patient-comment"
                  value={patientComment}
                  onChange={(e) => setPatientComment(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black resize-none"
                  placeholder={t('patientForm.specialRequirementsPlaceholder')}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
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
                    {t('patientForm.creatingBooking')}
                  </>
                ) : (
                  t('patientForm.confirmBooking')
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Booking Confirmation */}
      {submitSuccess && bookingDetails && (
        <BookingConfirmation
          patientName={bookingDetails.patientName}
          patientEmail={bookingDetails.patientEmail}
          appointmentDate={bookingDetails.appointmentDate}
          startTime={bookingDetails.startTime}
          endTime={bookingDetails.endTime}
          therapistName={bookingDetails.therapistName}
          cancellationToken={bookingDetails.cancellationToken}
        />
      )}
    </div>
  )
}

