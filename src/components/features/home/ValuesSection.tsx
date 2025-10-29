'use client'

import { Heart, Users, Shield } from 'lucide-react'

const values = [
  {
    icon: Shield,
    title: 'Довіра',
    description: 'Кожен профіль проходить перевірку. Ми дбаємо про вашу безпеку.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: Heart,
    title: 'Допомога',
    description: 'Підтримуємо одне одного. Разом ми сильніші і успішніші.',
    color: 'from-red-500 to-pink-600',
  },
  {
    icon: Users,
    title: 'Українське',
    description: 'Платформа для своїх. Розвиваємо українську економіку.',
    color: 'from-primary-500 to-accent-500',
  },
]

export function ValuesSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Наші цінності
          </h2>
          <p className="text-lg text-neutral-600">
            На чому базується наша спільнота
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, index) => {
            const Icon = value.icon
            
            return (
              <div
                key={index}
                className="text-center group"
              >
                {/* Іконка */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br mb-6 shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${value.color.includes('blue') ? '#3B82F6, #2563EB' : value.color.includes('red') ? '#EF4444, #EC4899' : '#FFCA00, #007FE6'})`
                  }}
                >
                  <Icon className="w-10 h-10 text-white" />
                </div>

                {/* Заголовок */}
                <h3 className="font-display text-2xl font-bold text-neutral-900 mb-3">
                  {value.title}
                </h3>

                {/* Опис */}
                <p className="text-neutral-600 leading-relaxed">
                  {value.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
