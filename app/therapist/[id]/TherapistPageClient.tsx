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
    profileImageSrc?: string | null
    email: string
    linkedinUrl?: string
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

  const imageSrc = therapist.profileImageSrc || therapist.photoUrl

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
          <div className="flex flex-col md:flex-row items-center gap-8 mb-8 pb-8 border-b">
            {imageSrc ? (
              <div className="relative w-32 h-32 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageSrc}
                  alt={therapist.name}
                  className="w-full h-full rounded-full object-cover shadow-lg border-4 border-indigo-50"
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border-4 border-indigo-50 shadow-lg">
                <span className="text-4xl font-bold text-indigo-600">
                  {therapist.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div className="text-center md:text-left">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{therapist.name}</h1>
              <p className="text-xl text-indigo-600 font-medium mb-3">{displaySpecialization}</p>

              {therapist.linkedinUrl && (
                <a
                  href={therapist.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-gray-600 hover:text-[#0077b5] transition-colors font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 21.227.792 22 1.771 22h20.451C23.2 22 24 21.227 24 20.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  {t('therapist.viewLinkedinProfile')}
                </a>
              )}
            </div>
          </div>

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


