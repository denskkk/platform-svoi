import Link from 'next/link'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
  searchParams?: Record<string, string>
}

export function Pagination({ currentPage, totalPages, baseUrl, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null

  const createUrl = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    return `${baseUrl}?${params.toString()}`
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const showPages = 5 // Скільки сторінок показувати
    
    if (totalPages <= showPages) {
      // Якщо всього мало сторінок - показуємо всі
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    // Завжди показуємо першу сторінку
    pages.push(1)

    let start = Math.max(2, currentPage - 1)
    let end = Math.min(totalPages - 1, currentPage + 1)

    // Додаємо ... якщо потрібно
    if (start > 2) {
      pages.push('...')
    }

    // Додаємо сторінки навколо поточної
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    // Додаємо ... якщо потрібно
    if (end < totalPages - 1) {
      pages.push('...')
    }

    // Завжди показуємо останню сторінку
    if (totalPages > 1) {
      pages.push(totalPages)
    }

    return pages
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex items-center justify-center gap-2 mt-12 animate-fade-in">
      {/* First Page */}
      {currentPage > 1 && (
        <Link
          href={createUrl(1)}
          className="p-2 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:hover:border-gray-200"
          aria-label="Перша сторінка"
        >
          <ChevronsLeft className="w-5 h-5 text-gray-600" />
        </Link>
      )}

      {/* Previous Page */}
      {currentPage > 1 && (
        <Link
          href={createUrl(currentPage - 1)}
          className="p-2 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
          aria-label="Попередня сторінка"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-2">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-4 py-2 text-gray-400">
                ...
              </span>
            )
          }

          const isActive = page === currentPage

          return (
            <Link
              key={page}
              href={createUrl(page as number)}
              className={`min-w-[2.5rem] px-4 py-2 rounded-lg font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-110'
                  : 'border-2 border-gray-200 text-gray-700 hover:border-blue-500 hover:bg-blue-50'
              }`}
            >
              {page}
            </Link>
          )
        })}
      </div>

      {/* Next Page */}
      {currentPage < totalPages && (
        <Link
          href={createUrl(currentPage + 1)}
          className="p-2 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
          aria-label="Наступна сторінка"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </Link>
      )}

      {/* Last Page */}
      {currentPage < totalPages && (
        <Link
          href={createUrl(totalPages)}
          className="p-2 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
          aria-label="Остання сторінка"
        >
          <ChevronsRight className="w-5 h-5 text-gray-600" />
        </Link>
      )}

      {/* Page info */}
      <div className="ml-4 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-600 font-medium">
        Сторінка <span className="font-bold text-blue-600">{currentPage}</span> з <span className="font-bold">{totalPages}</span>
      </div>
    </div>
  )
}
