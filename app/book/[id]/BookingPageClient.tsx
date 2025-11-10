'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import BookingInterface from '@/components/BookingInterface'

interface BookingPageClientProps {
  therapistId: string
  therapistName: string
  blockedSlots: any[]
}

export default function BookingPageClient({ therapistId, therapistName, blockedSlots }: BookingPageClientProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  
  const homePath = locale === 'en' ? '/' : `/${locale}`
  const therapistPath = locale === 'en' ? `/therapist/${therapistId}` : `/${locale}/therapist/${therapistId}`

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href={homePath} className="text-xl font-bold text-indigo-600 hover:text-indigo-700">
                {t('booking.healthBooker')}
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-sm text-gray-600">{t('booking.bookAppointment')}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href={homePath} className="text-sm text-gray-600 hover:text-gray-800">
                {t('booking.home')}
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Therapist Info Card */}
        <div className="bg-white rounded-xl shadow-xl border p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('booking.bookWith')} {therapistName}</h1>
        </div>

        {/* Booking Interface */}
        <BookingInterface therapistId={therapistId} blockedSlots={blockedSlots} therapistName={therapistName} />

        {/* Back to Profile */}
        <div className="mt-8 text-center">
          <Link
            href={therapistPath}
            className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('booking.backToTherapistProfile')}
          </Link>
        </div>
      </div>
    </div>
  )
}


