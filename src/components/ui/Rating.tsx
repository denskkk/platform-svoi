import { Star } from 'lucide-react'

interface RatingProps {
  value: number
  maxStars?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
}

export function Rating({ 
  value, 
  maxStars = 5, 
  size = 'md',
  showValue = false 
}: RatingProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  return (
    <div className="flex items-center space-x-1">
      {[...Array(maxStars)].map((_, i) => (
        <Star
          key={i}
          className={`${sizes[size]} ${
            i < Math.floor(value)
              ? 'text-amber-400 fill-current'
              : 'text-neutral-300'
          }`}
        />
      ))}
      {showValue && (
        <span className="ml-2 text-sm font-medium text-neutral-700">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  )
}
