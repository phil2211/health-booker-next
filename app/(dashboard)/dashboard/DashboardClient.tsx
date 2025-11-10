'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import LogoutButton from '@/components/LogoutButton'
import BookingUrlSection from '@/components/BookingUrlSection'

interface DashboardClientProps {
  therapist: {
    _id: string
    name: string
    specialization: string
    bio: string
    email: string
    weeklyAvailability: any[]
    blockedSlots: any[]
  }
  bookingUrl: string
  baseUrl: string
}

export default function DashboardClient({ therapist, bookingUrl, baseUrl }: DashboardClientProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  
  const availabilityPath = locale === 'en' ? '/dashboard/availability' : `/${locale}/dashboard/availability`
  const appointmentsPath = locale === 'en' ? '/dashboard/appointments' : `/${locale}/dashboard/appointments`

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-indigo-600">{t('booking.healthBooker')}</h1>
              <span className="text-gray-400">|</span>
              <span className="text-sm text-gray-600">{t('dashboard.title')}</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:inline">{t('dashboard.welcomeUser', { name: therapist.name })}</span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            {t('dashboard.welcomeBack')}, {therapist.name}! 👋
          </h2>
          <p className="text-lg text-gray-600">
            {t('dashboard.manageAppointments')}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t('dashboard.totalAvailability')}</p>
                <p className="text-2xl font-bold text-gray-900">{therapist.weeklyAvailability.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t('dashboard.blockedSlots')}</p>
                <p className="text-2xl font-bold text-gray-900">{therapist.blockedSlots.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t('dashboard.profileStatus')}</p>
                <p className="text-2xl font-bold text-green-600">{t('dashboard.active')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-md border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{t('dashboard.yourProfile')}</h3>
              <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                {t('common.edit')}
              </button>
            </div>
            <div className="space-y-4">
              <div className="pb-4 border-b">
                <p className="text-sm text-gray-500 mb-1">{t('dashboard.fullName')}</p>
                <p className="text-gray-900 font-medium">{therapist.name}</p>
              </div>
              <div className="pb-4 border-b">
                <p className="text-sm text-gray-500 mb-1">{t('dashboard.specialization')}</p>
                <p className="text-gray-900 font-medium">{therapist.specialization}</p>
              </div>
              <div className="pb-4 border-b">
                <p className="text-sm text-gray-500 mb-1">{t('dashboard.email')}</p>
                <p className="text-gray-900 font-medium">{therapist.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">{t('dashboard.bio')}</p>
                <p className="text-gray-700 leading-relaxed">{therapist.bio}</p>
              </div>
            </div>
          </div>

          {/* Booking URL Card */}
          <BookingUrlSection 
            fallbackUrl={`${baseUrl}${bookingUrl}`} 
            therapistId={therapist._id}
          />
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.availabilityManagement')}</h3>
            <p className="text-gray-600 mb-4">
              {t('dashboard.setWeeklyRecurring')}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {t('dashboard.currently')}: {therapist.weeklyAvailability.length} {t('dashboard.weeklySlots')}, {therapist.blockedSlots.length} {t('dashboard.blockedDates')}
            </p>
            <Link
              href={availabilityPath}
              className="block w-full bg-indigo-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors text-center"
            >
              {t('dashboard.manageAvailability')} →
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-md border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.viewAppointments')}</h3>
            <p className="text-gray-600 mb-4">
              {t('dashboard.seeScheduled')}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              {t('dashboard.viewPatientBookings')}
            </p>
            <Link
              href={appointmentsPath}
              className="block w-full bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors text-center"
            >
              {t('dashboard.viewAppointments')} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}


