'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import ResponsiveHeader from '@/components/ResponsiveHeader'
import BookingUrlSection from '@/components/BookingUrlSection'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import TopUpModal from '@/components/TopUpModal'

interface DashboardClientProps {
  therapist: {
    _id: string
    name: string
    specialization: string | { en: string; de: string }
    bio: string | { en: string; de: string }
    email: string
    address?: string
    phoneNumber?: string
    weeklyAvailability: any[]
    blockedSlots: any[]

    balance?: number
    negativeBalanceSince?: string // Date string
  }
  bookingUrl: string
  baseUrl: string
  upcomingAppointmentsCount: number
}

export default function DashboardClient({ therapist, bookingUrl, baseUrl, upcomingAppointmentsCount }: DashboardClientProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const router = useRouter()
  const [sanitizedBio, setSanitizedBio] = useState<string>('')
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false)
  const [localBalance, setLocalBalance] = useState(therapist.balance || 0)

  // Helper to get localized content
  const getLocalizedContent = (content: string | { en: string; de: string }, lang: string) => {
    if (typeof content === 'string') return content
    return content[lang as 'en' | 'de'] || content['en'] || content['de'] || ''
  }

  // Get localized content
  const displayBio = getLocalizedContent(therapist.bio, locale)
  const displaySpecialization = getLocalizedContent(therapist.specialization, locale)

  // Sanitize bio on client side only
  useEffect(() => {
    const parseAndSanitize = async () => {
      const DOMPurify = (await import('dompurify')).default
      const { marked } = await import('marked')
      // Configure marked to respect line breaks and empty lines (paragraphs)
      const parsed = await marked.parse(displayBio, {
        breaks: true,  // Convert single line breaks to <br>
        gfm: true      // Enable GitHub Flavored Markdown for better paragraph handling
      })
      setSanitizedBio(DOMPurify.sanitize(parsed))
    }
    parseAndSanitize()
  }, [displayBio])

  // Sync local balance with prop when it changes (e.g. after router.refresh())
  useEffect(() => {
    setLocalBalance(therapist.balance || 0)
  }, [therapist.balance])

  const handleTopUp = async (amount: number) => {
    try {
      const response = await fetch('/api/therapist/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          therapistId: therapist._id,
          amount,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to top up')
      }

      const data = await response.json()
      setLocalBalance(data.balance)
      router.refresh() // Refresh server components to ensure consistency
    } catch (error) {
      console.error('Top up error:', error)
      alert('Failed to top up account. Please try again.')
    }
  }

  const availabilityPath = locale === 'en' ? '/dashboard/availability' : `/${locale}/dashboard/availability`
  const appointmentsPath = locale === 'en' ? '/dashboard/appointments' : `/${locale}/dashboard/appointments`
  const profileEditPath = locale === 'en' ? '/dashboard/profile' : `/${locale}/dashboard/profile`

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <ResponsiveHeader pageTitle={t('dashboard.title')} showBackToDashboard={false} />

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
              <div className="shrink-0">
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
              <div className="shrink-0">
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
              <div className="shrink-0">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{t('dashboard.appointmentsInCalendar')}</p>
                <p className="text-2xl font-bold text-gray-900">{upcomingAppointmentsCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className={`bg-white rounded-xl shadow-md p-6 border-l-4 mb-8 ${localBalance <= 0 ? 'border-red-500' : 'border-emerald-500'
          }`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dashboard.accountBalance')}</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-3xl font-bold ${localBalance <= 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}>
                  CHF {localBalance.toFixed(2)}
                </span>
              </div>
              <p className="text-gray-600">
                {localBalance <= 0
                  ? t('dashboard.balanceInsufficient')
                  : t('dashboard.accountGoodStanding')}
              </p>
            </div>
            <div className="mt-4 md:mt-0 shrink-0">
              <button
                onClick={() => setIsTopUpModalOpen(true)}
                className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-emerald-700 transition-colors shadow-sm"
              >
                {t('dashboard.topUpAccount')}
              </button>
            </div>
          </div>
        </div>



        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
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
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-md border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">{t('dashboard.yourProfile')}</h3>
              <Link
                href={profileEditPath}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {t('common.edit')}
              </Link>
            </div>
            <div className="space-y-4">
              <div className="pb-4 border-b">
                <p className="text-sm text-gray-500 mb-1">{t('dashboard.fullName')}</p>
                <p className="text-gray-900 font-medium">{therapist.name}</p>
              </div>
              <div className="pb-4 border-b">
                <p className="text-sm text-gray-500 mb-1">{t('dashboard.specialization')}</p>
                <p className="text-gray-900 font-medium">{displaySpecialization}</p>
              </div>
              <div className="pb-4 border-b">
                <p className="text-sm text-gray-500 mb-1">{t('dashboard.email')}</p>
                <p className="text-gray-900 font-medium">{therapist.email}</p>
              </div>
              {therapist.address && (
                <div className="pb-4 border-b">
                  <p className="text-sm text-gray-500 mb-1">Address</p>
                  <p className="text-gray-900 font-medium">{therapist.address}</p>
                </div>
              )}
              {therapist.phoneNumber && (
                <div className="pb-4 border-b">
                  <p className="text-sm text-gray-500 mb-1">Phone Number</p>
                  <p className="text-gray-900 font-medium">{therapist.phoneNumber}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 mb-2">{t('dashboard.bio')}</p>
                <div
                  className="text-gray-700 leading-relaxed prose max-w-none [&>p]:mb-4 [&>p:last-child]:mb-0"
                  dangerouslySetInnerHTML={{
                    __html: sanitizedBio
                  }}
                />
              </div>
            </div>
          </div>

          {/* Booking URL Card */}
          <BookingUrlSection
            fallbackUrl={`${baseUrl}${bookingUrl}`}
            therapistId={therapist._id}
          />
        </div>
      </div>

      {isTopUpModalOpen && (
        <TopUpModal
          onClose={() => setIsTopUpModalOpen(false)}
          onTopUp={handleTopUp}
        />
      )}
    </div>
  )
}
