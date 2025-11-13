'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/useTranslation'

interface Booking {
  _id: string
  patientName: string
  patientEmail: string
  appointmentDate: string
  startTime: string
  endTime: string
  therapistId: string
  status: string
}

interface CancellationFormProps {
  booking: Booking
  token: string
}

export default function CancellationForm({ booking, token }: CancellationFormProps) {
  const { t, locale } = useTranslation()
  const [isCancelling, setIsCancelling] = useState(false)
  const [isCancelled, setIsCancelled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formatAppointmentDateTime = () => {
    const date = new Date(booking.appointmentDate)
    const dateStr = date.toLocaleDateString(locale === 'de' ? 'de-DE' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const timeStr = new Date(`${booking.appointmentDate}T${booking.startTime}:00`).toLocaleTimeString(locale === 'de' ? 'de-DE' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    return `${dateStr} at ${timeStr}`
  }

  const handleCancel = async () => {
    if (!confirm(t('appointments.confirmCancelQuestion'))) {
      return
    }

    setIsCancelling(true)
    setError(null)

    try {
      const response = await fetch(`/api/cancel/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel appointment')
      }

      setIsCancelled(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while cancelling the appointment')
    } finally {
      setIsCancelling(false)
    }
  }

  if (isCancelled) {
    return (
      <div className="bg-white rounded-xl shadow-xl border p-8 text-center">
        <div className="mb-6">
          <svg
            className="w-16 h-16 text-green-500 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('appointments.appointmentCancelled')}</h2>
          <p className="text-gray-600 mb-6">
            {t('appointments.cancelledSuccess')}
          </p>
          <div className="space-y-3">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors mr-4"
            >
              {t('appointments.bookAnotherAppointment')}
            </Link>
            <button
              onClick={() => window.close()}
              className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              {t('appointments.closeWindow')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-xl border p-8">
      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-red-500 mr-3 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">{t('appointments.cancellationFailed')}</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Details */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('appointments.appointmentDetails')}</h2>
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="block text-sm font-medium text-gray-600">{t('appointments.patientName')}</span>
              <span className="block text-lg text-gray-900">{booking.patientName}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-600">{t('common.email')}</span>
              <span className="block text-lg text-gray-900">{booking.patientEmail}</span>
            </div>
            <div className="md:col-span-2">
              <span className="block text-sm font-medium text-gray-600">{t('appointments.appointmentDateTime')}</span>
              <span className="block text-lg text-gray-900">{formatAppointmentDateTime()}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-600">{t('appointments.duration')}</span>
              <span className="block text-lg text-gray-900">{t('booking.oneHour')}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-gray-600">{t('appointments.treatment')}</span>
              <span className="block text-lg text-gray-900">{t('booking.cranioSacralSession')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Policy */}
      <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-yellow-500 mr-3 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">{t('appointments.cancellationPolicy')}</h3>
            <p className="text-sm text-yellow-700 mt-1">
              {t('appointments.cancellationPolicyText')}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleCancel}
          disabled={isCancelling}
          className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isCancelling ? (
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
              {t('appointments.cancelling')}
            </>
          ) : (
            t('appointments.cancelAppointment')
          )}
        </button>

        <button
          onClick={() => window.history.back()}
          className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
        >
          {t('appointments.keepAppointment')}
        </button>
      </div>

      {/* Alternative Contact */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          {t('appointments.needHelp')}{' '}
          <a href="mailto:support@healthbooker.app" className="text-indigo-600 hover:text-indigo-700">
            support@healthbooker.app
          </a>
        </p>
      </div>
    </div>
  )
}
