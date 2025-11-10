'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { defaultLocale, type Locale, locales } from './index'

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const LocaleContext = createContext<LocaleContextType>({
  locale: defaultLocale,
  setLocale: () => {},
})

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Check for locale in URL path (e.g., /en/..., /de/...)
    const pathSegments = pathname.split('/').filter(Boolean)
    const firstSegment = pathSegments[0]
    
    if (locales.includes(firstSegment as Locale)) {
      setLocaleState(firstSegment as Locale)
      return
    }
    
    // Check for locale in cookie (set by middleware)
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] as Locale | undefined
    
    if (cookieLocale && locales.includes(cookieLocale)) {
      setLocaleState(cookieLocale)
      return
    }
    
    // Check browser language as fallback
    const browserLang = navigator.language.split('-')[0]
    if (locales.includes(browserLang as Locale)) {
      setLocaleState(browserLang as Locale)
    }
  }, [pathname])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    
    // Set cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000` // 1 year
    
    // Update URL if needed (for App Router, we'll handle this differently)
    // The actual routing will be handled by middleware or layout
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale(): Locale {
  const context = useContext(LocaleContext)
  return context.locale
}

export function useLocaleContext(): LocaleContextType {
  return useContext(LocaleContext)
}

