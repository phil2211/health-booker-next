'use client'

import { useLocaleContext } from '@/lib/i18n/LocaleProvider'
import { locales, type Locale, defaultLocale } from '@/lib/i18n'
import { usePathname, useRouter } from 'next/navigation'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleContext()
  const pathname = usePathname()
  const router = useRouter()

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale)
    
    // Get current path without locale prefix
    const pathSegments = pathname.split('/').filter(Boolean)
    const firstSegment = pathSegments[0]
    
    let currentPath = pathname
    // If current path starts with a locale, remove it
    if (locales.includes(firstSegment as Locale)) {
      const remainingPath = pathSegments.slice(1).join('/')
      currentPath = remainingPath ? `/${remainingPath}` : '/'
    }
    
    // Build new URL with locale prefix
    const newPath = newLocale === defaultLocale 
      ? currentPath 
      : `/${newLocale}${currentPath === '/' ? '' : currentPath}`
    
    // Navigate to new URL
    router.push(newPath)
  }

  return (
    <div className="flex items-center gap-2">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleLocaleChange(loc)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            locale === loc
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

