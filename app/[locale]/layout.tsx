import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import Providers from './providers'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import en from '../../messages/en.json'
import de from '../../messages/de.json'

const messages = { en, de }

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Ensure that the incoming `locale` is valid
  if (!['en', 'de'].includes(locale)) {
    notFound()
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const localeMessages = messages[locale as keyof typeof messages]

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={localeMessages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
