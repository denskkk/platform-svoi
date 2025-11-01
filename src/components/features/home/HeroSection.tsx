'use client'

import Link from 'next/link'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function HeroSection() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('')
  const [city, setCity] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (category) params.set('category', category)
    if (city) params.set('city', city)
    router.push(`/catalog?${params.toString()}`)
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50 pt-20 pb-32">
      {/* Декоративні елементи */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary-200 rounded-full blur-3xl opacity-20 -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent-200 rounded-full blur-3xl opacity-20 -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          {/* Слоган */}
          <h1 className="font-display text-4xl md:text-6xl font-bold text-neutral-900 mb-6 animate-fade-in">
            Платформа для підприємця<br />
            <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              та споживача
            </span>
          </h1>

          <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto mb-4 animate-slide-up">
            Створено для спільноти УЦМ — місце, де підприємці та споживачі знаходять одне одного на основі довіри та спільних цінностей.
          </p>
          
          <p className="text-sm md:text-base text-neutral-500 max-w-xl mx-auto animate-slide-up">
            🤝 Свій для Своїх — підтримуємо бізнес всередині нашої спільноти
          </p>
        </div>

        {/* Форма пошуку */}
        <form 
          onSubmit={handleSearch}
          className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-6 md:p-8 animate-slide-up"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Послуга */}
            <div>
              <label htmlFor="service" className="block text-sm font-medium text-neutral-700 mb-2">
                Яка послуга потрібна?
              </label>
              <input
                id="service"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Наприклад: сантехнік"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {/* Категорія */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-neutral-700 mb-2">
                Категорія
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              >
                <option value="">Всі категорії</option>
                <option value="pobut">🏠 Побут</option>
                <option value="auto">🚗 Авто</option>
                <option value="krasa">💇 Краса</option>
                <option value="osvita">🎓 Освіта</option>
                <option value="remont">🧰 Ремонт</option>
                <option value="biznes">💼 Бізнес</option>
                <option value="it">💻 IT</option>
                <option value="medytsyna">⚕️ Медицина</option>
                <option value="tvorchist">🎨 Творчість</option>
              </select>
            </div>

            {/* Місто */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-neutral-700 mb-2">
                Де шукати?
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Наприклад: Київ"
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              />
            </div>
          </div>

          {/* Кнопка пошуку */}
          <button
            type="submit"
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-lg hover:shadow-xl"
          >
            <Search className="w-5 h-5" />
            <span>Знайти</span>
          </button>
        </form>

        {/* Прямий заклик до дії: реєстрація/вхід видно одразу на головній */}
        <div className="max-w-4xl mx-auto mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center animate-slide-up">
          <Link
            href="/auth/register"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg bg-accent-500 hover:bg-accent-600 text-white font-semibold shadow-lg hover:shadow-xl transition-colors"
          >
            Створити профіль
          </Link>
          <Link
            href="/auth/login"
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-medium transition-colors"
          >
            Увійти
          </Link>
        </div>
      </div>
    </section>
  )
}
