'use client'

import { useEffect, useState } from 'react'
import { LOCALE_COOKIE, Locale, defaultLocale, isLocale, readCookie } from '@/i18n/config'
import { createTranslator } from '@/i18n/translate'
import ukCommon from '../../messages/uk/common.json'
import enCommon from '../../messages/en/common.json'

// Остання лінія захисту: спрацьовує, якщо впав сам кореневий layout.
// Він рендериться поза I18nProvider, тому мову читаємо з cookie/navigator напряму.
// Стилі тут інлайном, бо globals.css міг не завантажитись.
const dictionaries = { uk: { common: ukCommon }, en: { common: enCommon } }

function detectLocale(): Locale {
  const fromCookie = readCookie(document.cookie, LOCALE_COOKIE)
  if (isLocale(fromCookie)) return fromCookie
  const browser = (navigator.language || '').toLowerCase().split('-')[0]
  return isLocale(browser) ? browser : defaultLocale
}

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [locale, setLocale] = useState<Locale>(defaultLocale)

  useEffect(() => {
    setLocale(detectLocale())
  }, [])

  const t = createTranslator(locale, dictionaries[locale])
  const homePath = locale === 'en' ? '/en' : '/'

  return (
    <html lang={locale}>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fffbea' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ maxWidth: 380, width: '100%', textAlign: 'center', background: '#fff', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,.08)' }}>
            <h1 style={{ fontSize: 22, margin: '0 0 8px' }}>{t('common.errorPage.title')}</h1>
            <p style={{ color: '#555', margin: '0 0 24px' }}>
              {t('common.errorPage.globalDescription')}
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{ padding: '12px 20px', borderRadius: 8, border: 0, background: '#e6b800', fontWeight: 600, fontSize: 16, marginRight: 8 }}
            >
              {t('common.actions.tryAgain')}
            </button>
            <button
              type="button"
              onClick={() => window.location.assign(homePath)}
              style={{ padding: '12px 20px', borderRadius: 8, border: '1px solid #ccc', background: '#fff', fontSize: 16 }}
            >
              {t('common.actions.goHome')}
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
