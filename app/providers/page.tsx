'use client'

import { useTranslation } from '@/lib/i18n/useTranslation'

export default function ProvidersPage() {
  const { t } = useTranslation()
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('home.viewProviders')}</h1>
        <div className="bg-white rounded-lg shadow-md p-8">
          <p className="text-gray-600">{t('home.providerDirectory')}</p>
        </div>
      </div>
    </div>
  )
}

