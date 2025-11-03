'use client'

import Link from 'next/link'
import { categories } from '@/lib/constants'

export function CategoriesSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-neutral-50 via-white to-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Обери свою категорію
          </h2>
          <p className="text-lg text-neutral-600">
            Знайди потрібного фахівця серед перевірених українців
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/catalog?category=${category.slug}`}
              className="group relative bg-white hover:bg-blue-50/50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg border border-neutral-200 hover:border-blue-300"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Номер категорії */}
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 group-hover:bg-blue-100 text-neutral-600 group-hover:text-blue-700 font-semibold text-sm mb-3 transition-colors">
                    {index + 1}
                  </div>
                  
                  {/* Назва */}
                  <h3 className="font-bold text-lg text-neutral-900 group-hover:text-blue-700 transition-colors mb-2 leading-tight">
                    {category.name}
                  </h3>
                  
                  {/* Опис */}
                  <p className="text-sm text-neutral-500 group-hover:text-neutral-700 transition-colors leading-relaxed">
                    {category.description}
                  </p>
                </div>

                {/* Стрілочка */}
                <div className="ml-4 text-neutral-300 group-hover:text-blue-500 transition-all duration-300 group-hover:translate-x-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Акцентна лінія зліва */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-l-xl transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
            </Link>
          ))}
        </div>

        {/* Додатковий блок внизу */}
        <div className="mt-16 text-center">
          <p className="text-neutral-600 mb-6 text-lg">
            Не знайшли потрібну категорію?
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            <span>Переглянути всі послуги</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
