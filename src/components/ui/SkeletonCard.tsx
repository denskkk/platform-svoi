/**
 * Skeleton loader компоненти для різних типів карток
 */

export function ServiceCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-gray-100 animate-pulse">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Image skeleton */}
        <div className="w-full md:w-48 h-48 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl" />
        
        {/* Content skeleton */}
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-3/4" />
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-full" />
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-5/6" />
          
          <div className="flex items-center gap-4 pt-4">
            <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-1/2" />
              <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function UserCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-gray-100 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-14 h-14 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-1/2" />
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-full" />
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-5/6" />
      </div>
      
      <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
        <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-20" />
        <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-24" />
      </div>
    </div>
  )
}

export function RequestCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border-2 border-gray-100 animate-pulse">
      <div className="space-y-4">
        <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-3/4" />
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-full" />
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-5/6" />
        
        <div className="flex flex-wrap gap-2 pt-2">
          <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-24" />
          <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-20" />
          <div className="h-8 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-28" />
        </div>
        
        <div className="flex items-center gap-3 pt-4 border-t-2 border-gray-100">
          <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-100 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-1/2" />
            <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-1/3" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 6, type = 'service' }: { count?: number; type?: 'service' | 'user' | 'request' }) {
  const SkeletonComponent = 
    type === 'service' ? ServiceCardSkeleton :
    type === 'user' ? UserCardSkeleton :
    RequestCardSkeleton

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonComponent key={i} />
      ))}
    </div>
  )
}
