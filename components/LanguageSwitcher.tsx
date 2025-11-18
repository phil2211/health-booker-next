'use client'

import { useLocaleContext } from '@/lib/i18n/LocaleProvider'
import { locales, type Locale } from '@/lib/i18n'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleContext()

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale)
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

