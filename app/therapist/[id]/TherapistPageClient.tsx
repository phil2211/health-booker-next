'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import ResponsiveHeader from '@/components/ResponsiveHeader'

interface TherapistPageClientProps {
  therapist: {
    _id: string
    name: string
    specialization: string | { en: string; de: string }
    bio: string | { en: string; de: string }
    photoUrl?: string
    email: string
  }
}

export default function TherapistPageClient({ therapist }: TherapistPageClientProps) {
  const { t } = useTranslation()
  const locale = useLocale()

  const homePath = locale === 'en' ? '/' : `/${locale}`
  const bookPath = locale === 'en' ? `/book/${therapist._id}` : `/${locale}/book/${therapist._id}`

  // Helper to get localized content
  const getLocalizedContent = (content: string | { en: string; de: string }, lang: string) => {
    if (typeof content === 'string') return content
    return content[lang as 'en' | 'de'] || content['en'] || content['de'] || ''
  }

  const displayBio = getLocalizedContent(therapist.bio, locale)
  const displaySpecialization = getLocalizedContent(therapist.specialization, locale)

  const [bioHtml, setBioHtml] = useState<string>('')

  useEffect(() => {
    const processBio = async () => {
      if (!displayBio) {
        setBioHtml('')
        return
      }
      try {
        const parsed = await marked.parse(displayBio)
        setBioHtml(DOMPurify.sanitize(parsed))
      } catch (error) {
        console.error('Error parsing markdown:', error)
        setBioHtml(displayBio) // Fallback to plain text
      }
    }
    processBio()
  }, [displayBio])

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <ResponsiveHeader
        pageTitle={t('therapist.therapistProfile')}
        showBackToDashboard={false}
        showHomeLink={false}
        showLogoutButton={false}
      />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-xl border p-8">
          {/* Header */}
          <div className="text-center mb-8 pb-8 border-b">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{therapist.name}</h1>
            <p className="text-xl text-indigo-600 font-medium">{displaySpecialization}</p>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('therapist.about')} {therapist.name}</h2>
              <div
                className="text-gray-700 leading-relaxed space-y-4 [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-gray-900 [&>h2]:text-xl [&>h2]:font-semibold [&>h2]:text-gray-900 [&>h3]:text-lg [&>h3]:font-medium [&>h3]:text-gray-900 [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>a]:text-indigo-600 [&>a]:underline [&>blockquote]:border-l-4 [&>blockquote]:border-gray-300 [&>blockquote]:pl-4 [&>blockquote]:italic"
                dangerouslySetInnerHTML={{ __html: bioHtml }}
              />
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

      </div>
    </div>
  )
}


