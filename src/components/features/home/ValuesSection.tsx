'use client'

import { Heart, Users, Shield } from 'lucide-react'

const values = [
  {
    icon: Shield,
    title: 'Довіра',
    description: 'Профілі, відгуки та рейтинги допомагають обрати надійного виконавця. Ми дбаємо про вашу безпеку.',
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
    <section className="py-20 bg-gradient-to-br from-white via-neutral-50 to-white relative overflow-hidden">
      {/* Фонові елементи */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-400 rounded-full blur-3xl"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-primary-100 to-accent-100 rounded-full">
            <p className="text-sm font-semibold text-primary-700">💎 Що нас об'єднує</p>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-neutral-900 mb-4">
            Наші цінності
          </h2>
          <p className="text-lg md:text-xl text-neutral-600 max-w-2xl mx-auto">
            На чому базується наша <span className="font-semibold text-primary-600">спільнота</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {values.map((value, index) => {
            const Icon = value.icon
            
            return (
              <div
                key={index}
                className="text-center group p-8 rounded-3xl hover:bg-white/80 transition-all duration-300 hover:shadow-xl"
              >
                {/* Іконка */}
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br mb-6 shadow-xl group-hover:shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                  style={{
                    background: `linear-gradient(135deg, ${value.color.includes('blue') ? '#3B82F6, #2563EB' : value.color.includes('red') ? '#EF4444, #EC4899' : '#FFCA00, #007FE6'})`
                  }}
                >
                  <Icon className="w-10 h-10 text-white" />
                </div>

                {/* Заголовок */}
                <h3 className="font-display text-2xl md:text-3xl font-bold text-neutral-900 mb-4 group-hover:text-primary-700 transition-colors">
                  {value.title}
                </h3>

                {/* Опис */}
                <p className="text-neutral-600 leading-relaxed text-base md:text-lg">
                  {value.description}
                </p>
                
                {/* Декоративна лінія */}
                <div className="mt-6 h-1 w-0 group-hover:w-20 mx-auto bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"></div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
