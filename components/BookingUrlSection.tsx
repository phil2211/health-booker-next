'use client'

import { useState, useEffect } from 'react'
import CopyUrlButton from './CopyUrlButton'

interface BookingUrlSectionProps {
  fallbackUrl: string
  therapistId: string
}

export default function BookingUrlSection({ fallbackUrl, therapistId }: BookingUrlSectionProps) {
  const [bookingUrl, setBookingUrl] = useState<string>(fallbackUrl)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBookingUrl() {
      try {
        const response = await fetch('/api/therapist/booking-url')
        
        if (!response.ok) {
          if (response.status === 401) {
            setError('Please log in to view your booking URL')
          } else {
            setError('Failed to fetch booking URL')
          }
          return
        }

        const data = await response.json()
        if (data.bookingUrl) {
          setBookingUrl(data.bookingUrl)
        }
      } catch (err) {
        console.error('Error fetching booking URL:', err)
        setError('Failed to fetch booking URL. Using fallback.')
      } finally {
        setLoading(false)
      }
    }

    fetchBookingUrl()
  }, [])

  const profileUrl = bookingUrl.replace('/book/', '/therapist/')

  return (
    <div className="bg-white rounded-xl shadow-md border p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Share Your Links</h3>
      <p className="text-sm text-gray-600 mb-6">
        Share these links with patients to view your profile and book appointments:
      </p>
      
      {loading ? (
        <div className="bg-gray-50 border rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm text-gray-600">Loading your URLs...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Booking URL Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Booking Link
            </label>
            <div className="bg-gray-50 border rounded-lg p-4 mb-2">
              <code className="text-xs break-all text-gray-800">
                {bookingUrl}
              </code>
            </div>
            <CopyUrlButton url={bookingUrl} />
          </div>

          {/* Profile URL Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile Link
            </label>
            <div className="bg-gray-50 border rounded-lg p-4 mb-2">
              <code className="text-xs break-all text-gray-800">
                {profileUrl}
              </code>
            </div>
            <CopyUrlButton url={profileUrl} />
          </div>
        </>
      )}

      {error && (
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            ⚠️ {error}
          </p>
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Share these links via email, social media, or add them to your website to let patients learn about you and book appointments.
        </p>
      </div>
    </div>
  )
}

