'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, MapPin } from 'lucide-react'

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
    <section className="py-20 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Популярні профілі
          </h2>
          <p className="text-lg text-neutral-600">
            Познайомся з нашими найкращими фахівцями
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
                className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
              >
                {/* Фото */}
                <div className="relative h-48 bg-gradient-to-br from-primary-200 to-accent-200">
                  {displayImage ? (
                    <img
                      src={`${displayImage}${displayImage.includes('?') ? '&' : '?'}t=${Date.now()}`}
                      alt={displayName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        if (!img.dataset.retried) {
                          img.dataset.retried = 'true';
                          img.src = displayImage;
                        } else {
                          img.style.display = 'none';
                          const parent = img.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'absolute inset-0 flex items-center justify-center text-6xl text-white font-bold';
                            fallback.textContent = `${profile.firstName?.[0] || ''}${profile.lastName?.[0] || ''}`;
                            parent.appendChild(fallback);
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-6xl text-white font-bold">
                      {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </div>
                  )}
                </div>

                {/* Контент */}
                <div className="p-5">
                  <h3 className="font-semibold text-lg text-neutral-900 mb-1">
                    {displayName}
                  </h3>
                  {profile.profession && (
                    <p className="text-primary-600 font-medium mb-2">
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
