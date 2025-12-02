import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import CookieBanner from '@/components/CookieBanner'
import InstallPrompt from '@/components/InstallPrompt'
import { PushNotificationManager } from '@/components/PushNotificationManager'
import { getServerLocale } from '@/lib/i18n/server'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Health Worker Booking System',
  description: 'Schedule appointments with health workers',
  // Note: For dynamic i18n metadata, consider using generateMetadata function
  // in individual page components or a middleware-based approach
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getServerLocale()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <CookieBanner />
          <InstallPrompt />
          <PushNotificationManager />
          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-gray-500">
                  &copy; {new Date().getFullYear()} Health Booker. All rights reserved.
                </div>
                <div className="flex space-x-6 text-sm text-gray-500">
                  <a href="/privacy" className="hover:text-gray-900">Privacy Policy</a>
                  <a href="/terms" className="hover:text-gray-900">Terms of Use</a>
                  <a href="/imprint" className="hover:text-gray-900">Imprint</a>
                </div>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  )
}
