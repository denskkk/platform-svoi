'use client'

import { usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, Locale, locales, localeLabels } from '@/i18n/config'
import { useI18n } from '@/i18n/client'
import { switchLocalePath } from '@/i18n/routes'

interface LanguageSwitcherProps {
  /** `buttons` shows both languages side by side; `compact` shows only the other language. */
  variant?: 'buttons' | 'compact'
  className?: string
}

export function setLocaleCookie(locale: Locale) {
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`
}

export function LanguageSwitcher({ variant = 'buttons', className = '' }: LanguageSwitcherProps) {
  const { locale, t } = useI18n()
  const pathname = usePathname() || '/'

  const switchTo = (target: Locale) => {
    if (target === locale) return
    setLocaleCookie(target)
    const search = typeof location !== 'undefined' ? location.search + location.hash : ''
    // A full navigation re-renders server components and refreshes all client state in the new language.
    window.location.assign(switchLocalePath(pathname, target) + search)
  }

  if (variant === 'compact') {
    const other: Locale = locale === 'uk' ? 'en' : 'uk'
    return (
      <button
        type="button"
        onClick={() => switchTo(other)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 ${className}`}
        aria-label={t('common.language.switchTo', { language: localeLabels[other] })}
        title={t('common.language.switchTo', { language: localeLabels[other] })}
        lang={other}
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span>{other.toUpperCase()}</span>
      </button>
    )
  }

  return (
    <div
      className={`inline-flex items-center gap-1 ${className}`}
      role="group"
      aria-label={t('common.language.label')}
    >
      <Globe className="h-4 w-4 text-gray-500" aria-hidden="true" />
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          onClick={() => switchTo(code)}
          aria-pressed={code === locale}
          className={`rounded-md px-2 py-1 text-sm font-medium transition-colors ${
            code === locale ? 'bg-primary-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {localeLabels[code]}
        </button>
      ))}
    </div>
  )
}
