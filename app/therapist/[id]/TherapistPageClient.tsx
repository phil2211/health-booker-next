'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useLocale } from '@/lib/i18n/LocaleProvider'

interface TherapistPageClientProps {
  therapist: {
    _id: string
    name: string
    specialization: string
    bio: string
    photoUrl?: string
    email: string
  }
}

export default function TherapistPageClient({ therapist }: TherapistPageClientProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  
  const homePath = locale === 'en' ? '/' : `/${locale}`
  const bookPath = locale === 'en' ? `/book/${therapist._id}` : `/${locale}/book/${therapist._id}`

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
              <span className="text-sm text-gray-600">{t('therapist.therapistProfile')}</span>
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
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-xl border p-8">
          {/* Header */}
          <div className="text-center mb-8 pb-8 border-b">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{therapist.name}</h1>
            <p className="text-xl text-indigo-600 font-medium">{therapist.specialization}</p>
          </div>

          {/* Profile Photo (if available) */}
          {therapist.photoUrl && (
            <div className="flex justify-center mb-8">
              <Image
                src={therapist.photoUrl}
                alt={therapist.name}
                width={192}
                height={192}
                className="w-48 h-48 rounded-full object-cover border-4 border-indigo-200 shadow-lg"
              />
            </div>
          )}

          {/* Bio Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('therapist.about')} {therapist.name.split(' ')[0]}</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{therapist.bio}</p>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
              <h3 className="text-md font-semibold text-gray-900 mb-3">{t('therapist.contactInformation')}</h3>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">{t('common.email')}:</span> {therapist.email}
              </p>
            </div>

            {/* Booking Call to Action */}
            <div className="mt-8 bg-indigo-50 rounded-lg p-6 border border-indigo-200">
              <h3 className="text-lg font-semibold text-indigo-900 mb-3">
                {t('therapist.readyToBook')}
              </h3>
              <p className="text-indigo-700 mb-4">
                {t('therapist.clickToView', { name: therapist.name })}
              </p>
              <Link
                href={bookPath}
                className="inline-block w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-center"
              >
                {t('therapist.viewAvailabilityBook')} →
              </Link>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link
            href={homePath}
            className="text-indigo-600 hover:text-indigo-700 font-medium inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('therapist.backToHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}


