'use client'

import { useState, useEffect } from 'react'
import { TimeSlot } from '@/lib/utils/availability'
import { BlockedSlot, TherapyOffering } from '@/lib/types'
import DatePickerPopover from './DatePickerPopover'
import BookingConfirmation from './BookingConfirmation'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { isValidEmail } from '@/lib/utils/validation'

interface PatientBookingSchedulerProps {
  therapistId: string
  blockedSlots?: BlockedSlot[]
  onBookingConfirmed?: () => void
  therapistName?: string
  therapyOfferings?: TherapyOffering[]
}

interface AvailabilityResponse {
  slots: TimeSlot[]
  therapistId: string
  startDate: string
  endDate: string
  message?: string
}

export default function PatientBookingScheduler({ therapistId, blockedSlots = [], onBookingConfirmed, therapistName, therapyOfferings }: PatientBookingSchedulerProps) {
  const { t, locale } = useTranslation()
  const [selectedDate, setSelectedDate] = useState<string>('')

  const [step, setStep] = useState<number>(1)

  // Initialize with null to force selection, unless there are no offerings (default case)
  // If there are no offerings, we might want to auto-select or show a default card.
  // Let's start with null and handle the default case in the UI.
  const activeOfferings = therapyOfferings?.filter(o => o.isActive) || []
  const [selectedOfferingId, setSelectedOfferingId] = useState<string | null>(null)

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

  // Auto-advance if no offerings are configured (default session)
  // But user asked for "Session selection" step. So we show the default card as a selection.

  const steps = [
    { number: 1, label: t('booking.stepSession') || 'Session' },
    { number: 2, label: t('booking.stepDate') || 'Date' },
    { number: 3, label: t('booking.stepTime') || 'Time' },
    { number: 4, label: t('booking.stepInfo') || 'Info' },
  ]

  // Fetch availability for full date range on mount to determine which dates have slots
  useEffect(() => {
    const fetchFullRangeAvailability = async () => {
      try {
        const today = new Date()
        const maxDate = new Date()
        maxDate.setMonth(maxDate.getMonth() + 3)

        const startDateStr = today.toISOString().split('T')[0]
        const endDateStr = maxDate.toISOString().split('T')[0]

        let url = `/api/therapist/${therapistId}/availability?startDate=${startDateStr}&endDate=${endDateStr}`
        if (selectedOfferingId) {
          url += `&offeringId=${selectedOfferingId}`
        }

        const response = await fetch(url)

        if (response.ok) {
          const data: AvailabilityResponse = await response.json()

          if (data.message === 'Therapist has insufficient balance') {
            // Disable all dates by setting a dummy date that won't match
            setAvailableDates(new Set(['disabled']))
            return
          }

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
  }, [therapistId, selectedOfferingId]) // Re-fetch when offering changes

  // Fetch availability when date changes
  useEffect(() => {
    if (!selectedDate) return

    const fetchAvailability = async () => {
      setLoading(true)
      setError(null)

      try {
        let url = `/api/therapist/${therapistId}/availability?startDate=${selectedDate}&endDate=${selectedDate}`
        if (selectedOfferingId) {
          url += `&offeringId=${selectedOfferingId}`
        }

        const response = await fetch(url)

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
  }, [therapistId, selectedDate, selectedOfferingId])

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
      setStep(4) // Advance to next step
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
          therapyOfferingId: selectedOfferingId || undefined,
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

  // Construct the building sentence
  const getSummarySentence = () => {
    const parts = []

    // Prefix: "You are booking"
    parts.push(t('booking.sentence.prefix'))

    // Treatment part
    if (selectedOfferingId) {
      const offering = activeOfferings.find(o => o._id === selectedOfferingId)
      if (offering) {
        const name = typeof offering.name === 'string'
          ? offering.name
          : (offering.name[locale as 'en' | 'de'] || offering.name.en)
        parts.push(t('booking.sentence.treatment', { treatment: name }))
      }
    }

    // Date part
    if (selectedDate) {
      const dateStr = new Date(selectedDate).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      parts.push(t('booking.sentence.date', { date: dateStr }))
    }

    // Time part
    if (selectedSlot) {
      const slot = slots.find(s => `${s.date}-${s.startTime}` === selectedSlot)
      if (slot) {
        const timeStr = formatTime(slot.sessionStart || slot.startTime)
        parts.push(t('booking.sentence.time', { time: timeStr }))
      }
    }

    return parts.join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Summary Sentence */}
      {!submitSuccess && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-center animate-in fade-in slide-in-from-top-2">
          <p className="text-indigo-900 font-medium text-base sm:text-lg">
            {getSummarySentence()}
          </p>
        </div>
      )}

      {/* Step Indicator */}
      {!submitSuccess && (
        <div className="flex items-center justify-between mb-4 sm:mb-8 relative">
          {/* Line aligned with the center of the circles */}
          <div className="absolute left-0 top-3 sm:top-4 transform -translate-y-1/2 w-full h-0.5 bg-gray-200 -z-10" />
          {steps.map((s) => {
            const isCompleted = step > s.number
            const isCurrent = step === s.number

            return (
              <div
                key={s.number}
                className={`flex flex-col items-center px-1 sm:px-2 cursor-pointer ${step > s.number ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => {
                  if (step > s.number) setStep(s.number)
                }}
              >
                <div
                  className={`
                    w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold border-2 transition-colors
                    ${isCompleted || isCurrent
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-gray-300 text-gray-500'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-3 h-3 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s.number
                  )}
                </div>
                <span className={`text-[10px] sm:text-xs mt-1 font-medium ${isCurrent ? 'text-indigo-600' : 'text-gray-500'}`}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Step 1: Session Selection */}
      {!submitSuccess && step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-xl font-semibold text-gray-900">{t('booking.selectTreatment')}</h2>

          {activeOfferings.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {activeOfferings.map((offering) => {
                const isSelected = selectedOfferingId === offering._id
                const name = typeof offering.name === 'string'
                  ? offering.name
                  : (offering.name[locale as 'en' | 'de'] || offering.name.en)
                const description = typeof offering.description === 'string'
                  ? offering.description
                  : (offering.description[locale as 'en' | 'de'] || offering.description.en)

                return (
                  <div
                    key={offering._id}
                    onClick={() => {
                      setSelectedOfferingId(offering._id!)
                      setSelectedSlot(null) // Reset slot when offering changes
                      setStep(2)
                    }}
                    className={`
                      relative rounded-lg border p-4 sm:p-6 cursor-pointer transition-all duration-200 hover:shadow-md
                      ${isSelected
                        ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          {name}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600">
                          {description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full whitespace-nowrap flex-shrink-0">
                          {offering.duration} {t('therapyOfferings.minutes')}
                        </div>
                        {offering.price !== undefined && offering.price > 0 && (
                          <div className="text-sm font-medium text-gray-900">
                            CHF {offering.price}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div
              onClick={() => setStep(2)}
              className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-indigo-600 font-medium mb-1">{t('booking.treatment')}</p>
                  <p className="text-lg text-gray-900 font-semibold">{t('booking.cranioSacralSession')}</p>
                </div>
                <div className="text-indigo-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Date Selection */}
      {!submitSuccess && step === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <h2 className="text-xl font-semibold text-gray-900">{t('booking.selectDate')}</h2>
          <div className="flex justify-center">
            <DatePickerPopover
              selectedDate={selectedDate}
              min={getMinDate()}
              max={getMaxDate()}
              blockedSlots={blockedSlots}
              availableDates={availableDates}
              onChange={(date) => {
                setSelectedDate(date)
                setSelectedSlot(null)
                if (date) setStep(3)
              }}
              data-testid="appointment-date-picker"
              inline={true}
            />
          </div>
          <p className="text-center text-xs text-gray-500">{t('booking.localTimeZone')}</p>
        </div>
      )}

      {/* Step 3: Time Selection */}
      {!submitSuccess && step === 3 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{t('booking.selectTime')}</h2>
            <div className="text-sm text-gray-500">
              {new Date(selectedDate).toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          {loading && (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
              <p className="mt-2 text-gray-500">{t('booking.loadingAvailableTimes')}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && slots.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500 font-medium">
                {t('booking.noAvailableTimeSlots')}
              </p>
              <button
                onClick={() => setStep(2)}
                className="mt-4 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                {t('booking.chooseDifferentDate')}
              </button>
            </div>
          )}

          {!loading && !error && slots.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {slots.map((slot) => {
                const slotKey = `${slot.date}-${slot.startTime}`
                const isSelected = selectedSlot === slotKey
                const sessionStart = slot.sessionStart || slot.startTime

                // Calculate duration for display
                const selectedOffering = activeOfferings.find(o => o._id === selectedOfferingId)
                const durationDisplay = selectedOffering
                  ? `${selectedOffering.duration} ${t('therapyOfferings.minutes')}`
                  : t('booking.oneHourSession')

                return (
                  <button
                    key={slotKey}
                    onClick={() => handleSlotSelect(slot)}
                    disabled={slot.status !== 'available'}
                    className={`
                      px-2 py-3 sm:px-4 sm:py-4 rounded-xl border-2 transition-all duration-200 text-left group
                      ${isSelected
                        ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600'
                        : slot.status === 'available'
                          ? 'border-gray-200 bg-white hover:border-indigo-400 hover:shadow-md'
                          : 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    <div className={`text-base sm:text-lg font-bold ${isSelected ? 'text-indigo-900' : 'text-gray-900'}`}>
                      {formatTime(sessionStart)}
                    </div>
                    <div className={`text-[10px] sm:text-xs mt-1 ${isSelected ? 'text-indigo-700' : 'text-gray-500'}`}>
                      {durationDisplay}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Patient Information Form */}
      {!submitSuccess && step === 4 && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-3">
            <div className="mt-1 text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
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
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-sm">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">{t('patientForm.patientInformation')}</h3>

              {submitError && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {submitError}
                </div>
              )}

              <div className="space-y-4 sm:space-y-5">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black transition-shadow"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black transition-shadow"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black transition-shadow"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-black resize-none transition-shadow"
                    placeholder={t('patientForm.specialRequirementsPlaceholder')}
                  />
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <div className="flex items-center h-5">
                    <input
                      id="privacy-consent"
                      type="checkbox"
                      required
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    <label htmlFor="privacy-consent" className="font-medium text-gray-700">
                      {t('patientForm.consentLabel') || 'I agree to the processing of my data'}
                    </label>
                    <p className="text-xs mt-1">
                      {t('patientForm.consentText') || 'By checking this box, I agree to the'} <a href="/privacy" target="_blank" className="text-indigo-600 hover:text-indigo-500 underline">Privacy Policy</a> {t('patientForm.consentText2') || 'and consent to the processing of my health data for the purpose of this booking.'}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
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
        </div>
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

