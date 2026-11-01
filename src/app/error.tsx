'use client'

import { useEffect } from 'react'
import { useI18n } from '@/i18n/client'
import { localizedPath } from '@/i18n/routes'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { t, locale } = useI18n()

  useEffect(() => {
    console.error('Помилка сторінки:', error) // i18n-ignore
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">{t('common.errorPage.title')}</h1>
        <p className="text-neutral-600 mb-6">
          {t('common.errorPage.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
          >
            {t('common.actions.tryAgain')}
          </button>
          <button
            type="button"
            onClick={() => window.location.assign(localizedPath('/', locale))}
            className="px-5 py-3 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50"
          >
            {t('common.actions.goHome')}
          </button>
        </div>
      </div>
    </div>
  )
}
