'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Помилка сторінки:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Щось пішло не так</h1>
        <p className="text-neutral-600 mb-6">
          Сталася тимчасова помилка. Спробуйте ще раз — ваші дані та вхід збережені.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="px-5 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
          >
            Спробувати ще раз
          </button>
          <button
            type="button"
            onClick={() => window.location.assign('/')}
            className="px-5 py-3 rounded-lg border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50"
          >
            На головну
          </button>
        </div>
      </div>
    </div>
  )
}
