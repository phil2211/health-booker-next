'use client'

import { useTranslations } from 'next-intl'

export default function ProvidersPage() {
  const t = useTranslations('pages.providers')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('title')}</h1>
        <div className="bg-white rounded-lg shadow-md p-8">
          <p className="text-gray-600">{t('comingSoon')}</p>
        </div>
      </div>
    </div>
  )
}

