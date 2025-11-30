'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, MapPin, Award, Briefcase } from 'lucide-react'
import { UserOrCompanyAvatar } from '@/components/ui/UserOrCompanyAvatar'
import { SkeletonGrid, UserCardSkeleton } from '@/components/ui/SkeletonCard'

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
      <section className="py-20 bg-gradient-to-b from-white via-neutral-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <SkeletonGrid count={4} type="user" />
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
              <Link
                key={profile.id}
                href={`/profile/${profile.id}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 border border-neutral-100 hover:border-primary-300 hover:-translate-y-2 relative"
              >
                {/* Badge для топ-рейтингу */}
                {profile.totalReviews > 0 && Number(profile.avgRating) >= 4.5 && (
                  <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    <span>ТОП</span>
                  </div>
                )}

                {/* Фото з градієнтом */}
                <div className="relative h-56 bg-gradient-to-br from-primary-100 via-accent-100 to-primary-200 overflow-hidden">
                  <UserOrCompanyAvatar
                    user={profile}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Градієнтний оверлей */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Floating Badge з професією */}
                  {profile.profession && (
                    <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <p className="text-primary-700 font-bold text-sm flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        {profile.profession}
                      </p>
                    </div>
                  )}
                </div>

                {/* Контент */}
                <div className="p-6">
                  <h3 className="font-bold text-xl text-neutral-900 mb-2 group-hover:text-primary-700 transition-colors line-clamp-1">
                    {displayName}
                  </h3>

                  {/* Рейтинг та місто */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-100">
                    {profile.totalReviews > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5 text-amber-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="font-bold text-neutral-900">{Number(profile.avgRating).toFixed(1)}</span>
                        </div>
                        <span className="text-xs text-neutral-500">({profile.totalReviews})</span>
                      </div>
                    ) : (
                      <div className="text-xs text-neutral-500 bg-neutral-50 px-2 py-1 rounded-full">
                        Новий
                      </div>
                    )}
                    <div className="flex items-center gap-1 text-neutral-600">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-sm">{profile.city}</span>
                    </div>
                  </div>

                  {/* Опис */}
                  {profile.bio && (
                    <p className="text-sm text-neutral-600 mb-4 line-clamp-2 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}

                  {/* Кількість послуг */}
                  {profile._count?.services > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary-50 to-accent-50 rounded-lg mb-4">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-primary-700">
                        {profile._count.services} {profile._count.services === 1 ? 'послуга' : 'послуг'}
                      </span>
                    </div>
                  )}

                  {/* Кнопка з анімацією */}
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <div className="w-full text-center py-2.5 px-4 bg-gradient-to-r from-primary-500 to-primary-600 group-hover:from-primary-600 group-hover:to-primary-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-md group-hover:shadow-xl relative overflow-hidden">
                      <span className="relative z-10">Переглянути профіль</span>
                      <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                    </div>
                  </div>
                </div>
              </Link>
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
