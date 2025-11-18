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

export async function getTranslations(locale: Locale) {
    const translations = await import(`./translations/${locale}.json`);

    return (key: string, params?: object) => {
        const keys = key.split('.');
        let value = translations.default;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k as keyof typeof value];
            } else {
                return key;
            }
        }

        if (typeof value === 'string' && params) {
            return value.replace(/{{(\w+)}}/g, (_, g) => {
                const paramValue = (params as { [key: string]: string | number | undefined })[g];
                return String(paramValue !== undefined ? paramValue : g);
            });
        }

        return typeof value === 'string' ? value : key;
    };
}
