'use client'

import Link from 'next/link'
import { categories } from '@/lib/constants'

export function CategoriesSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-neutral-50 via-white to-neutral-50 relative overflow-hidden">
      {/* Декоративні елементи фону */}
      <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-primary-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-accent-400 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-primary-100 to-accent-100 rounded-full">
            <p className="text-sm font-semibold text-primary-700">🎯 Популярні категорії</p>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-neutral-900 mb-4">
            Обери свою категорію
          </h2>
          <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto">
            Знайди потрібного фахівця серед <span className="font-semibold text-primary-600">перевірених</span> українців
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => {
            return (
              <Link
                key={category.id}
                href={`/services?category=${category.slug}`}
                className="group relative bg-white hover:bg-gradient-to-br hover:from-primary-50 hover:to-accent-50 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl border-2 border-neutral-100 hover:border-primary-300 card-hover"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Іконка категорії */}
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 group-hover:from-primary-200 group-hover:to-accent-200 text-3xl mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                      {category.emoji}
                    </div>
                    
                    {/* Назва */}
                    <h3 className="font-bold text-xl text-neutral-900 group-hover:text-primary-700 transition-colors mb-2 leading-tight">
                      {category.name}
                    </h3>
                    
                    {/* Опис */}
                    <p className="text-sm text-neutral-600 group-hover:text-neutral-700 transition-colors leading-relaxed">
                      {category.description}
                    </p>
                  </div>

                  {/* Стрілочка з анімацією */}
                  <div className="ml-4 text-neutral-300 group-hover:text-primary-500 transition-all duration-300 group-hover:translate-x-1 group-hover:scale-125">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Акцентна лінія зліва з градієнтом */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary-500 via-accent-500 to-primary-500 rounded-l-2xl transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
                
                {/* Світлова пляма при ховері */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400/0 to-accent-400/0 group-hover:from-primary-400/10 group-hover:to-accent-400/10 rounded-2xl transition-all duration-300 pointer-events-none" />
              </Link>
            )
          })}
        </div>

        {/* Додатковий блок внизу з покращеним дизайном */}
        <div className="mt-20 text-center">
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-primary-500 to-accent-500 rounded-3xl p-8 shadow-2xl">
            <p className="text-white text-xl font-semibold mb-6">
              Не знайшли потрібну категорію?
            </p>
            <Link
              href="/services"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary-700 font-bold rounded-xl hover:bg-yellow-50 transition-all duration-300 hover:shadow-xl transform hover:scale-105 btn-glow"
            >
              <span>Переглянути всі послуги</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
