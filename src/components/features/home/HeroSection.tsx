'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkAuth } from '@/lib/silentFetch'
import { useI18n } from '@/i18n/client'

export function HeroSection() {
  const router = useRouter()
  const { t } = useI18n()
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('')
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)

  // Show guest CTAs only after the server confirms the session is absent.
  useEffect(() => {
    const detect = async () => {
      const { isAuthed } = await checkAuth()
      setIsAuthed(isAuthed)
    }
    detect()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (category) params.set('category', category)
    if (city) params.set('city', city)
    router.push(`/services?${params.toString()}`)
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50 pt-20 pb-32">
      {/* Декоративні елементи з анімацією */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200 rounded-full blur-3xl opacity-20 -z-10 animate-float" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-200 rounded-full blur-3xl opacity-20 -z-10 animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-100 rounded-full blur-3xl opacity-10 -z-10 animate-pulse" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          {/* Слоган з градієнтною анімацією */}
          <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-primary-500/10 to-accent-500/10 rounded-full border border-primary-200">
            <p className="text-sm font-semibold text-primary-700">{t('home.hero.badge')}</p>
          </div>
          
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-neutral-900 mb-6 animate-fade-in">
            {t('home.hero.titleLine1')}<br />
            <span className="bg-gradient-to-r from-primary-600 via-accent-500 to-primary-600 bg-clip-text text-transparent animate-gradient">
              {t('home.hero.titleLine2')}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto mb-4 animate-slide-up">
            {t('home.hero.subtitleBefore')}<span className="font-semibold text-primary-600">{t('home.hero.subtitleTrust')}</span>{t('home.hero.subtitleMiddle')}<span className="font-semibold text-accent-600">{t('home.hero.subtitleValues')}</span>{t('home.hero.subtitleAfter')}
          </p>
          
          <p className="text-sm md:text-base text-neutral-500 max-w-xl mx-auto animate-slide-up flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
            {t('home.hero.tagline')}
          </p>
        </div>

        {/* Форма пошуку з покращеними стилями */}
        <form 
          onSubmit={handleSearch}
          className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-6 md:p-8 animate-slide-up border border-neutral-100 hover:shadow-3xl transition-shadow duration-300"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Послуга */}
            <div>
              <label htmlFor="service" className="block text-sm font-semibold text-neutral-700 mb-2">
                {t('home.hero.serviceLabel')}
              </label>
              <input
                id="service"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('home.hero.servicePlaceholder')}
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all hover:border-primary-300"
              />
            </div>

            {/* Категорія */}
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-neutral-700 mb-2">
                {t('home.hero.categoryLabel')}
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all hover:border-primary-300 bg-white"
              >
                <option value="">{t('home.hero.allCategories')}</option>
                <option value="pobut">🏠 {t('home.hero.categories.pobut')}</option>
                <option value="auto">🚗 {t('home.hero.categories.auto')}</option>
                <option value="krasa">💇 {t('home.hero.categories.krasa')}</option>
                <option value="osvita">🎓 {t('home.hero.categories.osvita')}</option>
                <option value="remont">🧰 {t('home.hero.categories.remont')}</option>
                <option value="biznes">💼 {t('home.hero.categories.biznes')}</option>
                <option value="it">💻 {t('home.hero.categories.it')}</option>
                <option value="medytsyna">⚕️ {t('home.hero.categories.medytsyna')}</option>
                <option value="tvorchist">🎨 {t('home.hero.categories.tvorchist')}</option>
              </select>
            </div>

            {/* Місто */}
            <div>
              <label htmlFor="city" className="block text-sm font-semibold text-neutral-700 mb-2">
                {t('home.hero.cityLabel')}
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={t('home.hero.cityPlaceholder')}
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all hover:border-primary-300"
              />
            </div>
          </div>

          {/* Кнопка пошуку з ефектом свічення */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-2xl transform hover:scale-[1.02] duration-300 btn-glow"
          >
            <Search className="w-5 h-5" />
            <span className="text-lg">{t('home.hero.searchButton')}</span>
          </button>
        </form>

        {/* Прямий заклик до дії з покращеними стилями */}
        {isAuthed === false && (
          <div className="max-w-4xl mx-auto mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center animate-slide-up">
            <Link
              href="/auth/register"
              className="group w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <span className="mr-2">✨</span>
              <span>{t('home.hero.register')}</span>
            </Link>
            <Link
              href="/auth/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-accent-300 font-semibold transition-all duration-300"
            >
              {t('home.hero.login')}
            </Link>
          </div>
        )}
      </div>
    </section>
  )
}
