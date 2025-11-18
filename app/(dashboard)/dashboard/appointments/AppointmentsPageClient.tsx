'use client'

import { useTranslation } from '@/lib/i18n/useTranslation'
import AppointmentsView from '@/components/AppointmentsView'
import ResponsiveHeader from '@/components/ResponsiveHeader'

interface AppointmentsPageClientProps {
  therapistId: string
}

export default function AppointmentsPageClient({ therapistId }: AppointmentsPageClientProps) {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <ResponsiveHeader pageTitle={t('dashboard.viewAppointments')} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            {t('dashboard.appointmentsOverview')}
          </h2>
          <p className="text-lg text-gray-600">
            {t('dashboard.viewManageAppointments')}
          </p>
        </div>

        {/* Appointments View Component */}
        <AppointmentsView therapistId={therapistId} />
      </div>
    </div>
  )
}


