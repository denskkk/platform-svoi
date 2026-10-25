'use client'

import { useEffect, useState } from 'react'
import { refreshSession } from '@/lib/silentFetch'
import { getSafeRedirect } from '@/components/ui/AuthGate'

const GUARD_KEY = 'sviy_restore_ts'
// Якщо відновлення вже було щойно, а сторінка знову просить його — не зациклюємось
const LOOP_GUARD_MS = 15_000

export default function RestoreSessionPage() {
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const target = getSafeRedirect(new URLSearchParams(window.location.search).get('redirect'), '/')
    const toLogin = () => window.location.replace(`/auth/login?redirect=${encodeURIComponent(target)}`)

    const run = async () => {
      setFailed(false)
      let recent = false
      try {
        recent = Date.now() - Number(sessionStorage.getItem(GUARD_KEY) || 0) < LOOP_GUARD_MS
        sessionStorage.setItem(GUARD_KEY, String(Date.now()))
      } catch {
        // sessionStorage недоступний — працюємо без захисту від циклу
      }
      if (recent) return toLogin()

      const result = await refreshSession()
      if (cancelled) return
      if (result === 'refreshed') {
        window.location.replace(target)
      } else if (result === 'guest') {
        toLogin()
      } else {
        setFailed(true)
      }
    }

    void run()
    const onOnline = () => void run()
    window.addEventListener('online', onOnline)
    return () => {
      cancelled = true
      window.removeEventListener('online', onOnline)
    }
  }, [])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-lg p-8">
        {failed ? (
          <>
            <h1 className="text-xl font-bold text-neutral-900 mb-2">Не вдалося з&apos;єднатися</h1>
            <p className="text-neutral-600 mb-6">Перевірте інтернет — ваш вхід збережено.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700"
            >
              Спробувати ще раз
            </button>
          </>
        ) : (
          <p className="text-neutral-600">Відновлюємо вхід…</p>
        )}
      </div>
    </div>
  )
}
