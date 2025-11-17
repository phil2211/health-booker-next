'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useLocale } from '@/lib/i18n/LocaleProvider'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { t } = useTranslation()
  const locale = useLocale()
  const test = "hello";

  useEffect(() => {
    if (status === 'authenticated' && session) {
      // Preserve locale in redirect
      const dashboardPath = locale === 'en' ? '/dashboard' : `/${locale}/dashboard`
      router.push(dashboardPath)
    }
  }, [session, status, router, locale])

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  // Show landing page if not authenticated
  if (status === 'unauthenticated' || !session) {
    // Build locale-aware URLs
    const bookingsPath = locale === 'en' ? '/bookings' : `/${locale}/bookings`
    const providersPath = locale === 'en' ? '/providers' : `/${locale}/providers`
    const loginPath = locale === 'en' ? '/login' : `/${locale}/login`
    const registerPath = locale === 'en' ? '/register' : `/${locale}/register`

    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              {t('home.title')}
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              {t('home.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={bookingsPath}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
              >
                {t('home.bookAppointment')}
              </Link>
              <Link
                href={providersPath}
                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                {t('home.viewProviders')}
              </Link>
            </div>

            <div className="flex gap-4 justify-center mt-4">
              <Link
                href={loginPath}
                className="text-indigo-600 px-6 py-2 font-semibold hover:text-indigo-700 transition-colors"
              >
                {t('home.therapistLogin')}
              </Link>
              <Link
                href={registerPath}
                className="text-indigo-600 px-6 py-2 font-semibold hover:text-indigo-700 transition-colors"
              >
                {t('home.therapistRegister')}
              </Link>
            </div>
          </div>

          <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('home.easyBooking')}
              </h3>
              <p className="text-gray-600">
                {t('home.easyBookingDescription')}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('home.qualifiedProfessionals')}
              </h3>
              <p className="text-gray-600">
                {t('home.qualifiedProfessionalsDescription')}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {t('home.secureSystem')}
              </h3>
              <p className="text-gray-600">
                {t('home.secureSystemDescription')}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // This should not be reached, but just in case
  return null
}