'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'

export function CTASection() {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    const detect = async () => {
      try {
        const u = localStorage.getItem('user')
        if (u) { setIsAuthed(true); return }
      } catch {}

      try {
        let token: string | null = null
        try { token = localStorage.getItem('token') } catch {}
        const headers: Record<string, string> = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        const res = await fetch('/api/auth/me', {
          credentials: 'include',
          headers,
        })
        setIsAuthed(res.ok)
      } catch {
        setIsAuthed(false)
      }
    }
    detect()
  }, [])

  return (
    <section className="py-20 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 relative overflow-hidden">
      {/* Декоративні елементи */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rounded-full" />
        <div className="absolute bottom-10 right-10 w-48 h-48 border-4 border-white rounded-full" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 border-4 border-white rotate-45" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-6">
          Долучайся до своїх!
        </h2>
        
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          {isAuthed 
            ? 'Покращуйте свій профіль та отримуйте більше можливостей!' 
            : 'Приєднуйтесь до платформи та знайдіть потрібні послуги або запропонуйте свої'
          }
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {isAuthed === false && (
            <>
              <Link
                href="/auth/register"
                className="group px-8 py-4 bg-white hover:bg-neutral-100 text-primary-600 font-semibold rounded-lg transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center space-x-2"
              >
                <span>Створити профіль</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/about"
                className="px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold rounded-lg transition-all duration-300"
              >
                Дізнатись більше
              </Link>
            </>
          )}

          {isAuthed === true && (
            <>
              <Link
                href="/upgrade"
                className="group px-8 py-4 bg-white hover:bg-yellow-50 text-orange-600 font-bold rounded-lg transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center space-x-2"
              >
                <span className="text-xl">⚡</span>
                <span>Покращити профіль</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/services/create"
                className="px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold rounded-lg transition-all duration-300"
              >
                Додати послугу
              </Link>
            </>
          )}
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
          <div className="text-white">
            <div className="text-4xl font-bold mb-2">1000+</div>
            <div className="text-white/80">Активних користувачів</div>
          </div>
          <div className="text-white">
            <div className="text-4xl font-bold mb-2">500+</div>
            <div className="text-white/80">Успішних угод</div>
          </div>
          <div className="text-white">
            <div className="text-4xl font-bold mb-2">24</div>
            <div className="text-white/80">Міста України</div>
          </div>
        </div>
      </div>
    </section>
  )
}
