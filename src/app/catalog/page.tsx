'use client'

import { useState, useEffect } from 'react'
import { Search, SlidersHorizontal, Star, MapPin } from 'lucide-react'
import Link from 'next/link'

export default function CatalogPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [showFilters, setShowFilters] = useState(false)
  const [services, setServices] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadServices()
  }, [searchQuery, selectedCategory, selectedCity])

  const loadData = async () => {
    try {
      const [categoriesRes, citiesRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/cities')
      ])
      
      const categoriesData = await categoriesRes.json()
      const citiesData = await citiesRes.json()
      
      setCategories(categoriesData.categories || [])
      setCities(citiesData.cities || [])
    } catch (err) {
      console.error('Error loading data:', err)
    }
  }

  const loadServices = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('q', searchQuery)
      if (selectedCategory) params.append('category', selectedCategory)
      if (selectedCity) params.append('city', selectedCity)
      
      const response = await fetch(`/api/services?${params.toString()}`)
      const data = await response.json()
      
      setServices(data.services || [])
    } catch (err) {
      console.error('Error loading services:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Пошукова панель */}
      <div className="bg-white border-b border-neutral-200 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Пошук */}
            <div className="flex-grow relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Що шукаєте?"
                className="block w-full pl-10 pr-3 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Фільтри кнопка (mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center justify-center space-x-2 px-4 py-3 border-2 border-primary-500 text-primary-600 rounded-lg font-medium"
            >
              <SlidersHorizontal className="w-5 w-5" />
              <span>Фільтри</span>
            </button>
          </div>

          {/* Фільтри (desktop) */}
          <div className={`${showFilters ? 'block' : 'hidden'} md:block mt-4`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Категорія */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Усі категорії</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>

              {/* Місто */}
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Усі міста</option>
                {cities.map((city: any) => (
                  <option key={city.id} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>

              {/* Сортування */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="popular">🔝 Популярні</option>
                <option value="new">🆕 Нові</option>
                <option value="rating">⭐ За відгуками</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Результати */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Каталог послуг
          </h1>
          <p className="text-neutral-600">
            {loading ? 'Завантаження...' : `Знайдено ${services.length} ${services.length === 1 ? 'послуга' : services.length < 5 ? 'послуги' : 'послуг'}`}
          </p>
        </div>

        {/* Список послуг */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-neutral-500">Завантаження послуг...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-500 mb-4">Послуг не знайдено</p>
            <p className="text-sm text-neutral-400">Спробуйте змінити фільтри або пошуковий запит</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service: any) => (
              <Link
                key={service.id}
                href={`/profile/${service.user.id}`}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
              >
                {/* Зображення послуги або емоджі категорії */}
                {service.imageUrl ? (
                  <div className="w-full h-48 overflow-hidden bg-neutral-100">
                    <img
                      src={service.imageUrl}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="relative h-48 bg-gradient-to-br from-primary-200 to-accent-200">
                    <div className="absolute inset-0 flex items-center justify-center text-6xl group-hover:scale-110 transition-transform">
                      {service.category?.emoji || '📦'}
                    </div>
                  </div>
                )}

                {/* Контент */}
                <div className="p-5">
                  <h3 className="font-semibold text-lg text-neutral-900 mb-1 group-hover:text-primary-600 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-primary-600 font-medium mb-3">
                    {service.user.firstName} {service.user.lastName}
                  </p>

                  {/* Рейтинг та місто */}
                  <div className="flex items-center justify-between mb-3 text-sm">
                    {service.user.totalReviews > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-amber-400 fill-current" />
                        <span className="font-medium">{Number(service.user.avgRating).toFixed(1)}</span>
                        <span className="text-neutral-500">({service.user.totalReviews})</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1 text-neutral-600">
                      <MapPin className="w-4 h-4" />
                      <span>{service.city}</span>
                    </div>
                  </div>

                  {/* Опис */}
                  {service.description && (
                    <p className="text-neutral-700 text-sm mb-3 whitespace-pre-line line-clamp-4">
                      {service.description}
                    </p>
                  )}

                  {/* Ціна */}
                  {(service.priceFrom || service.priceTo) && (
                    <div className="text-primary-600 font-semibold">
                      {service.priceFrom && service.priceTo ? (
                        `${service.priceFrom} - ${service.priceTo} ${service.priceUnit || 'грн'}`
                      ) : service.priceFrom ? (
                        `від ${service.priceFrom} ${service.priceUnit || 'грн'}`
                      ) : (
                        `до ${service.priceTo} ${service.priceUnit || 'грн'}`
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
