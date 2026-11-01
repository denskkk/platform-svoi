'use client'

import { createContext, useCallback, useContext, useMemo } from 'react'
import { Locale, defaultLocale, intlLocales } from './config'
import { createTranslator, Messages, Translator } from './translate'

interface I18nContextValue {
  locale: Locale
  t: Translator
  formatDate: (value: Date | string | number | null | undefined, options?: Intl.DateTimeFormatOptions) => string
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({
  locale,
  messages,
  fallbackMessages,
  children,
}: {
  locale: Locale
  messages: Messages
  fallbackMessages?: Messages
  children: React.ReactNode
}) {
  const t = useMemo(() => createTranslator(locale, messages, fallbackMessages), [locale, messages, fallbackMessages])

  const formatDate = useCallback<I18nContextValue['formatDate']>(
    (value, options) => {
      if (value === null || value === undefined || value === '') return ''
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return ''
      return new Intl.DateTimeFormat(intlLocales[locale], options ?? { dateStyle: 'medium' }).format(date)
    },
    [locale]
  )

  const formatNumber = useCallback<I18nContextValue['formatNumber']>(
    (value, options) => new Intl.NumberFormat(intlLocales[locale], options).format(value),
    [locale]
  )

  const value = useMemo(() => ({ locale, t, formatDate, formatNumber }), [locale, t, formatDate, formatNumber])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/**
 * Returns the translator and formatters. Outside a provider it degrades to
 * keys instead of throwing, so an isolated render never produces a white screen.
 */
export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (ctx) return ctx
  const t: Translator = (key) => key
  return {
    locale: defaultLocale,
    t,
    formatDate: (value) => (value ? new Date(value).toLocaleDateString(intlLocales[defaultLocale]) : ''),
    formatNumber: (value) => String(value),
  }
}

export function useT(): Translator {
  return useI18n().t
}

export function useLocale(): Locale {
  return useI18n().locale
}
