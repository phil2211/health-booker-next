import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Providers from './providers'
import { getServerLocale } from '@/lib/i18n/server'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Health Worker Booking System',
  description: 'Schedule appointments with health workers',
  // Note: For dynamic i18n metadata, consider using generateMetadata function
  // in individual page components or a middleware-based approach
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
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
