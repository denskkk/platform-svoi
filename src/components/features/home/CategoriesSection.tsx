'use client'

import Link from 'next/link'
import { categories } from '@/lib/constants'

export function CategoriesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Обери свою категорію
          </h2>
          <p className="text-lg text-neutral-600">
            Знайди потрібного фахівця серед перевірених українців
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/catalog?category=${category.slug}`}
              className="group relative bg-neutral-50 hover:bg-primary-50 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="text-center">
                <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform">
                  {category.emoji}
                </div>
                <h3 className="font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
                  {category.name}
                </h3>
              </div>

              {/* Акцентна лінія */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-b-2xl transform scale-x-0 group-hover:scale-x-100 transition-transform" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
