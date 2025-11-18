'use client'

import { useMemo, useCallback } from 'react'
import { useLocale } from './LocaleProvider'
import { getTranslation, getNestedTranslation, type Locale } from './index'

export function useTranslation() {
  const locale = useLocale()
  
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let translation = getTranslation(locale, key)
    
    // Replace parameters in translation
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue))
      })
    }
    
    return translation
  }, [locale])
  
  const tNamespace = useCallback((namespace: string) => {
    const namespaceTranslations = getNestedTranslation(locale, namespace)
    
    return (key: string, params?: Record<string, string | number>): string => {
      const fullKey = `${namespace}.${key}`
      return t(fullKey, params)
    }
  }, [locale, t])
  
  return useMemo(() => ({
    t,
    tNamespace,
    locale,
  }), [t, tNamespace, locale])
}


