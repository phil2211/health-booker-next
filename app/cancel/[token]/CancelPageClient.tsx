'use client'

import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import CancellationForm from '@/components/CancellationForm'

interface CancelPageClientProps {
  booking: any
  token: string
}

export default function CancelPageClient({ booking, token }: CancelPageClientProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  
  const homePath = locale === 'en' ? '/' : `/${locale}`

  if (!booking) {
    return (
      <div className="min-h-screen bg-linear-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-xl border p-8 text-center">
          <div className="mb-6">
            <svg
              className="w-16 h-16 text-red-500 mx-auto mb-4"
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('cancel.invalidLink')}</h1>
            <p className="text-gray-600 mb-6">
              {t('cancel.linkInvalidOrUsed')}
            </p>
            <Link
              href={homePath}
              className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              {t('cancel.returnToHealthBooker')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-red-50 to-orange-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href={homePath} className="text-2xl font-bold text-indigo-600 hover:text-indigo-700 mb-8 block">
            {t('booking.healthBooker')}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('cancel.cancelYourAppointment')}</h1>
          <p className="text-gray-600">
            {t('cancel.reviewDetails')}
          </p>
        </div>

        {/* Cancellation Form */}
        <CancellationForm booking={booking} token={token} />
      </div>
    </div>
  )
}


