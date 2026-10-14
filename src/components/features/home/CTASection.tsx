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
    <section className="py-24 bg-gradient-to-br from-primary-500 via-accent-500 to-primary-600 relative overflow-hidden animate-gradient">
      {/* Декоративні елементи з анімацією */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rounded-full animate-float" />
        <div className="absolute bottom-10 right-10 w-48 h-48 border-4 border-white rounded-full animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 border-4 border-white rotate-45 animate-float" style={{ animationDelay: '2s' }} />
      </div>
      {/* Світлові плями */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="mb-6">
          <span className="inline-block text-6xl mb-4 animate-bounce">🤝</span>
        </div>
        <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl">
          Долучайся до своїх!
        </h2>
        
        <p className="text-xl md:text-2xl text-white/95 mb-8 max-w-2xl mx-auto drop-shadow-lg">
          {isAuthed 
            ? 'Знаходьте потрібні послуги або пропонуйте свої — разом ми сильніші!' 
            : 'Приєднуйтесь до платформи та знайдіть потрібні послуги або запропонуйте свої'
          }
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {isAuthed === false && (
            <>
              <Link
                href="/auth/register"
                className="group px-10 py-5 bg-white hover:bg-yellow-50 text-primary-700 font-bold rounded-xl transition-all duration-300 shadow-2xl hover:shadow-3xl flex items-center space-x-2 transform hover:scale-110 btn-glow"
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
                href="/services/create"
                className="group px-8 py-4 bg-white hover:bg-yellow-50 text-primary-700 font-bold rounded-lg transition-all duration-300 shadow-xl hover:shadow-2xl flex items-center space-x-2"
              >
                <span>Додати послугу</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/catalog"
                className="px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold rounded-lg transition-all duration-300"
              >
                Знайти фахівця
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
