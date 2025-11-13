'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import AvailabilityManagement from '@/components/AvailabilityManagement'
import LogoutButton from '@/components/LogoutButton'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default function AvailabilityPageClient() {
  const { t } = useTranslation()
  const locale = useLocale()
  
  const dashboardPath = locale === 'en' ? '/dashboard' : `/${locale}/dashboard`

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href={dashboardPath} className="text-xl font-bold text-indigo-600 hover:text-indigo-700">
                {t('booking.healthBooker')}
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-sm text-gray-600">{t('availability.manageAvailability')}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={dashboardPath}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {t('dashboard.backToDashboard')}
              </Link>
              <LanguageSwitcher />
              <LogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            {t('dashboard.manageAvailabilityTitle')}
          </h2>
          <p className="text-lg text-gray-600">
            {t('dashboard.setWeeklySchedule')}
          </p>
        </div>

        {/* Availability Management Component */}
        <AvailabilityManagement />
      </div>
    </div>
  )
}


