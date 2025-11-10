import enTranslations from './translations/en.json'
import deTranslations from './translations/de.json'

export type Locale = 'en' | 'de'

export const locales: Locale[] = ['en', 'de']
export const defaultLocale: Locale = 'en'

export const translations = {
  en: enTranslations,
  de: deTranslations,
} as const

export type TranslationKey = 
  | `common.${keyof typeof enTranslations.common}`
  | `auth.${keyof typeof enTranslations.auth}`
  | `booking.${keyof typeof enTranslations.booking}`
  | `appointments.${keyof typeof enTranslations.appointments}`
  | `availability.${keyof typeof enTranslations.availability}`
  | `dashboard.${keyof typeof enTranslations.dashboard}`
  | `home.${keyof typeof enTranslations.home}`
  | `errors.${keyof typeof enTranslations.errors}`
  | `appointments.status.${keyof typeof enTranslations.appointments.status}`
  | `availability.days.${keyof typeof enTranslations.availability.days}`

export function getTranslation(locale: Locale, key: string): string {
  const keys = key.split('.')
  let value: any = translations[locale]
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k as keyof typeof value]
    } else {
      // Fallback to English if translation not found
      value = translations[defaultLocale]
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey as keyof typeof value]
        } else {
          return key // Return key if translation not found
        }
      }
      break
    }
  }
  
  return typeof value === 'string' ? value : key
}

export function getNestedTranslation(locale: Locale, namespace: string): Record<string, any> {
  const keys = namespace.split('.')
  let value: any = translations[locale]
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k as keyof typeof value]
    } else {
      // Fallback to English
      value = translations[defaultLocale]
      for (const fallbackKey of keys) {
        if (value && typeof value === 'object' && fallbackKey in value) {
          value = value[fallbackKey as keyof typeof value]
        } else {
          return {}
        }
      }
      break
    }
  }
  
  return typeof value === 'object' ? value : {}
}


