'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, MapPin } from 'lucide-react'
import { UserOrCompanyAvatar } from '@/components/ui/UserOrCompanyAvatar'

export function PopularProfiles() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      const response = await fetch('/api/users/top?limit=4')
      const data = await response.json()
      setProfiles(data.users || [])
    } catch (error) {
      console.error('Error loading profiles:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-neutral-600">Завантаження...</p>
          </div>
        </div>
      </section>
    )
  }

  if (profiles.length === 0) {
    return null
  }

  return (
    <section className="py-20 bg-gradient-to-b from-white via-neutral-50 to-white relative overflow-hidden">
      {/* Декоративні елементи */}
      <div className="absolute top-10 right-10 w-40 h-40 bg-primary-200 rounded-full blur-3xl opacity-20 animate-float"></div>
      <div className="absolute bottom-10 left-10 w-32 h-32 bg-accent-200 rounded-full blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-block mb-4 px-4 py-2 bg-gradient-to-r from-accent-100 to-primary-100 rounded-full">
            <p className="text-sm font-semibold text-accent-700">⭐ Рекомендовані</p>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold text-neutral-900 mb-4">
            Популярні профілі
          </h2>
          <p className="text-lg md:text-xl text-neutral-600">
            Познайомся з нашими <span className="font-semibold text-accent-600">найкращими</span> фахівцями
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {profiles.map((profile) => {
            // Для бізнес користувачів показуємо логотип компанії, якщо він є
            const displayImage = profile.businessInfo?.logoUrl || profile.avatarUrl;
            const displayName = profile.businessInfo?.companyName || `${profile.firstName} ${profile.lastName}`;
            
            return (
              <div
                key={profile.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-neutral-100 hover:border-primary-300 card-hover"
              >
                {/* Фото */}
                <div className="relative h-48 bg-gradient-to-br from-primary-200 to-accent-200 overflow-hidden">
                  <UserOrCompanyAvatar
                    user={profile}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Градієнтний оверлей */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Контент */}
                <div className="p-6">
                  <h3 className="font-bold text-xl text-neutral-900 mb-1 group-hover:text-primary-700 transition-colors">
                    {displayName}
                  </h3>
                  {profile.profession && (
                    <p className="text-primary-600 font-semibold mb-3 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-primary-500 rounded-full inline-block"></span>
                      {profile.profession}
                    </p>
                  )}

                  {/* Рейтинг та місто */}
                  <div className="flex items-center justify-between mb-3 text-sm">
                    {profile.totalReviews > 0 ? (
                      <div className="flex items-center space-x-1 text-amber-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="font-medium">{Number(profile.avgRating).toFixed(1)}</span>
                        <span className="text-neutral-500">({profile.totalReviews})</span>
                      </div>
                    ) : (
                      <div className="text-sm text-neutral-500">Новий користувач</div>
                    )}
                    <div className="flex items-center space-x-1 text-neutral-600">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.city}</span>
                    </div>
                  </div>

                  {/* Опис */}
                  {profile.bio && (
                    <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                      {profile.bio}
                    </p>
                  )}

                  {/* Кількість послуг */}
                  {profile._count?.services > 0 && (
                    <p className="text-sm text-neutral-500 mb-4">
                      {profile._count.services} {profile._count.services === 1 ? 'послуга' : 'послуг'}
                    </p>
                  )}

                  {/* Кнопка */}
                  <Link
                    href={`/profile/${profile.id}`}
                    className="block w-full text-center py-2 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Детальніше
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Кнопка "Показати більше" */}
        <div className="text-center mt-12">
          <Link
            href="/catalog"
            className="inline-block px-8 py-3 border-2 border-primary-500 text-primary-600 hover:bg-primary-500 hover:text-white font-semibold rounded-lg transition-colors"
          >
            Переглянути всі профілі
          </Link>
        </div>
      </div>
    </section>
  )
}
