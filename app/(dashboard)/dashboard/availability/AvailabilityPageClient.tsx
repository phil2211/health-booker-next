'use client'

import { useTranslation } from '@/lib/i18n/useTranslation'
import AvailabilityManagement from '@/components/AvailabilityManagement'
import ResponsiveHeader from '@/components/ResponsiveHeader'

export default function AvailabilityPageClient() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <ResponsiveHeader pageTitle={t('availability.manageAvailability')} />

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
