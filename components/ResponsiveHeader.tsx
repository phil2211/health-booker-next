'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { useLocale } from '@/lib/i18n/LocaleProvider'
import LogoutButton from '@/components/LogoutButton'
import LanguageSwitcher from '@/components/LanguageSwitcher'

interface ResponsiveHeaderProps {
  pageTitle: string
  showBackToDashboard?: boolean
  showHomeLink?: boolean
  showLogoutButton?: boolean
  showLoginRegisterLinks?: boolean
}

export default function ResponsiveHeader({
  pageTitle,
  showBackToDashboard = true,
  showHomeLink = false,
  showLogoutButton = true,
  showLoginRegisterLinks = false
}: ResponsiveHeaderProps) {
  const { t } = useTranslation()
  const locale = useLocale()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const dashboardPath = locale === 'en' ? '/dashboard' : `/${locale}/dashboard`
  const homePath = locale === 'en' ? '/' : `/${locale}`
  const loginPath = locale === 'en' ? '/login' : `/${locale}/login`
  const registerPath = locale === 'en' ? '/register' : `/${locale}/register`

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  return (
    <nav className="bg-white shadow-lg border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and title */}
          <div className="flex items-center space-x-4 min-w-0 flex-1">
            <span className="text-xl font-bold text-indigo-600 flex-shrink-0">
              {t('booking.healthBooker')}
            </span>
            <span className="text-gray-400 hidden sm:block">|</span>
            <span className="text-sm text-gray-600 truncate hidden sm:block">{pageTitle}</span>
          </div>

          {/* Desktop navigation - hidden on mobile */}
          <div className="hidden md:flex items-center space-x-4">
            {showBackToDashboard && (
              <Link
                href={dashboardPath}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
              >
                {t('dashboard.backToDashboard')}
              </Link>
            )}
            {showHomeLink && (
              <Link
                href={homePath}
                className="text-sm text-gray-600 hover:text-gray-800 whitespace-nowrap"
              >
                {t('booking.home')}
              </Link>
            )}
            {showLoginRegisterLinks && (
              <>
                <Link
                  href={loginPath}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
                >
                  {t('home.therapistLogin')}
                </Link>
                <Link
                  href={registerPath}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
                >
                  {t('home.therapistRegister')}
                </Link>
              </>
            )}
            <LanguageSwitcher />
            {showLogoutButton && <LogoutButton />}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="bg-white p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
              aria-expanded={isMenuOpen}
              aria-label="Main menu"
            >
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 z-50 bg-white border-t border-gray-200 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {/* Mobile page title - shown when menu is open on small screens */}
            <div className="px-3 py-2 border-b border-gray-200 sm:hidden">
              <span className="text-sm text-gray-600">{pageTitle}</span>
            </div>

            {/* Navigation items */}
            {showBackToDashboard && (
              <Link
                href={dashboardPath}
                className="block px-3 py-2 text-base font-medium text-indigo-600 hover:text-indigo-700 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                ← {t('dashboard.backToDashboard')}
              </Link>
            )}
            {showHomeLink && (
              <Link
                href={homePath}
                className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-md transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {t('booking.home')}
              </Link>
            )}
            {showLoginRegisterLinks && (
              <>
                <Link
                  href={loginPath}
                  className="block px-3 py-2 text-base font-medium text-indigo-600 hover:text-indigo-700 hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('home.therapistLogin')}
                </Link>
                <Link
                  href={registerPath}
                  className="block px-3 py-2 text-base font-medium text-indigo-600 hover:text-indigo-700 hover:bg-gray-50 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {t('home.therapistRegister')}
                </Link>
              </>
            )}

            {/* Language switcher in mobile menu */}
            <div className="px-3 py-2 border-t border-gray-200 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{t('common.language')}:</span>
                <LanguageSwitcher />
              </div>
            </div>

            {/* Logout button in mobile menu */}
            {showLogoutButton && (
              <div className="px-3 py-2 border-t border-gray-200">
                <LogoutButton />
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
