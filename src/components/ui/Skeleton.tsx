import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  animation?: 'pulse' | 'wave' | 'none'
}

export function Skeleton({ 
  className = '', 
  variant = 'rectangular',
  animation = 'pulse'
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-none',
    rounded: 'rounded-lg'
  }

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'skeleton',
    none: ''
  }

  return (
    <div
      className={cn(
        'bg-neutral-200',
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
    />
  )
}

// Готові композиції для швидкого використання
export function ProfileCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg p-6 border-2 border-neutral-100">
      <div className="flex items-start gap-4 mb-4">
        <Skeleton variant="circular" className="w-14 h-14" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-5/6 mb-4" />
      <Skeleton variant="rounded" className="h-12 w-full" />
    </div>
  )
}

export function ServiceCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md border border-neutral-100">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton variant="rounded" className="h-10 w-28" />
        </div>
      </div>
    </div>
  )
}

export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-neutral-100">
      <Skeleton variant="circular" className="w-12 h-12" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton variant="rounded" className="h-8 w-20" />
    </div>
  )
}
