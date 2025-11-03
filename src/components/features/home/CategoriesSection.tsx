'use client'

import Link from 'next/link'
import { categories } from '@/lib/constants'

export function CategoriesSection() {
  return (
    <section className="py-20 bg-gradient-to-b from-white via-blue-50/30 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Обери свою категорію
          </h2>
          <p className="text-lg text-neutral-600">
            Знайди потрібного фахівця серед перевірених українців
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalog?category=${category.slug}`}
              className="group relative bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border border-neutral-100 hover:border-blue-200"
            >
              <div className="flex flex-col items-start">
                {/* Іконка */}
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {category.emoji}
                </div>
                
                {/* Назва */}
                <h3 className="font-bold text-lg text-neutral-900 group-hover:text-blue-700 transition-colors mb-2">
                  {category.name}
                </h3>
                
                {/* Опис */}
                <p className="text-sm text-neutral-500 group-hover:text-neutral-700 transition-colors">
                  {category.description}
                </p>
              </div>

              {/* Акцентна лінія знизу */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              
              {/* Стрілочка */}
              <div className="absolute top-6 right-6 text-neutral-300 group-hover:text-blue-500 transition-colors">
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Додатковий блок внизу */}
        <div className="mt-12 text-center">
          <p className="text-neutral-600 mb-4">
            Не знайшли потрібну категорію?
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:shadow-lg hover:scale-105"
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
