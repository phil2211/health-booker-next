'use client'

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react'
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
  const [hasMounted, setHasMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // This is a standard way to determine if the component has mounted on the client.
    // The linter is being overly aggressive here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true)
  }, [])

  const locale = useMemo(() => {
    if (!hasMounted) {
      return defaultLocale
    }

    const pathSegments = pathname.split('/').filter(Boolean)
    const firstSegment = pathSegments[0]
    if (locales.includes(firstSegment as Locale)) {
      return firstSegment as Locale
    }

    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('NEXT_LOCALE='))
      ?.split('=')[1] as Locale | undefined
    if (cookieLocale && locales.includes(cookieLocale)) {
      return cookieLocale
    }

    const browserLang = navigator.language.split('-')[0]
    if (locales.includes(browserLang as Locale)) {
      return browserLang as Locale
    }

    return defaultLocale
  }, [hasMounted, pathname])

  const setLocale = (newLocale: Locale) => {
    // Set the cookie
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000` // 1 year

    // Navigate to the new locale URL
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
    window.location.href = newPath
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

