import { headers } from 'next/headers'
import { defaultLocale, type Locale, locales } from './index'

export async function getServerLocale(): Promise<Locale> {
  const headersList = await headers()
  const localeHeader = headersList.get('x-locale')
  
  if (localeHeader && locales.includes(localeHeader as Locale)) {
    return localeHeader as Locale
  }
  
  return defaultLocale
}

export function getTranslation(locale: Locale, key: string): string {
  // Import translations dynamically to avoid issues
  const translations = require('./translations/en.json')
  const deTranslations = require('./translations/de.json')
  
  const translationMap: Record<Locale, any> = {
    en: translations,
    de: deTranslations,
  }
  
  const keys = key.split('.')
  let value: any = translationMap[locale]
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k as keyof typeof value]
    } else {
      // Fallback to English
      value = translationMap[defaultLocale]
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey as keyof typeof value]
        } else {
          return key
        }
      }
      break
    }
  }
  
  return typeof value === 'string' ? value : key
}


