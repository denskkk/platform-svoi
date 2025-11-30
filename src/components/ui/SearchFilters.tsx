'use client'

import { useState } from 'react'
import { Search, MapPin, Filter, X } from 'lucide-react'

interface SearchFiltersProps {
  defaultSearch?: string
  defaultCity?: string
  defaultCategory?: string
  categories?: Array<{ value: string; label: string; emoji?: string }>
  cities?: string[]
  onSearch?: (params: { search: string; city: string; category: string }) => void
  showCategoryFilter?: boolean
  placeholder?: string
}

export function SearchFilters({
  defaultSearch = '',
  defaultCity = '',
  defaultCategory = '',
  categories = [],
  cities = [],
  onSearch,
  showCategoryFilter = true,
  placeholder = 'Пошук...'
}: SearchFiltersProps) {
  const [search, setSearch] = useState(defaultSearch)
  const [city, setCity] = useState(defaultCity)
  const [category, setCategory] = useState(defaultCategory)
  const [showFilters, setShowFilters] = useState(false)

  const hasActiveFilters = city || category || search

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch) {
      onSearch({ search, city, category })
    }
  }

  const handleClear = () => {
    setSearch('')
    setCity('')
    setCategory('')
    if (onSearch) {
      onSearch({ search: '', city: '', category: '' })
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-blue-100 hover:border-blue-200 transition-all animate-slide-up">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            Фільтри
          </h3>
          
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-auto text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Очистити
            </button>
          )}
          
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="ml-auto md:hidden px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors"
          >
            {showFilters ? 'Приховати' : 'Показати'}
          </button>
        </div>

        <div className={`grid grid-cols-1 ${showCategoryFilter ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 ${showFilters ? '' : 'hidden md:grid'}`}>
          {/* Search Input */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300"
            />
          </div>

          {/* Category Filter */}
          {showCategoryFilter && categories.length > 0 && (
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300 bg-white font-medium appearance-none cursor-pointer"
              >
                <option value="">📂 Всі категорії</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.emoji ? `${cat.emoji} ` : ''}{cat.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          )}

          {/* City Filter */}
          <div className="relative group">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
            {cities.length > 0 ? (
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300 bg-white font-medium appearance-none cursor-pointer"
              >
                <option value="">Всі міста</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Місто..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all hover:border-blue-300"
              />
            )}
            {cities.length > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className={`w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] btn-glow ${showFilters ? '' : 'hidden md:block'}`}
        >
          <span className="flex items-center justify-center gap-2">
            <Search className="w-5 h-5" />
            Знайти
          </span>
        </button>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {search && (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                <Search className="w-3 h-3" />
                {search}
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {category && (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                📂 {categories.find(c => c.value === category)?.label}
                <button
                  type="button"
                  onClick={() => setCategory('')}
                  className="hover:bg-purple-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {city && (
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
                <MapPin className="w-3 h-3" />
                {city}
                <button
                  type="button"
                  onClick={() => setCity('')}
                  className="hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </form>
    </div>
  )
}
