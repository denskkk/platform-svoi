export interface User {
  id: string
  name: string
  email: string
  phone?: string
  city: string
  type: 'individual' | 'business' | 'viewer'
  avatar?: string
  createdAt: Date
}

export interface IndividualProfile extends User {
  type: 'individual'
  profession: string
  about?: string
  services: string[]
  experience?: string
  education?: string
  rating: number
  reviewsCount: number
  workingHours?: string
  telegram?: string
  instagram?: string
}

export interface BusinessProfile extends User {
  type: 'business'
  companyName: string
  description: string
  services: string[]
  address?: string
  workingHours: {
    [key: string]: string
  }
  website?: string
  facebook?: string
  instagram?: string
  rating: number
  reviewsCount: number
  photos?: string[]
}

export interface Review {
  id: string
  authorId: string
  authorName: string
  profileId: string
  rating: number
  text: string
  date: Date
  photos?: string[]
}

export interface Message {
  id: string
  chatId: string
  senderId: string
  receiverId: string
  text: string
  timestamp: Date
  read: boolean
  attachments?: {
    type: 'image' | 'file'
    url: string
    name: string
  }[]
}

export interface Chat {
  id: string
  participants: string[]
  lastMessage?: Message
  unreadCount: number
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  slug: string
  emoji: string
  description?: string
}

export interface SearchFilters {
  query?: string
  category?: string
  city?: string
  minRating?: number
  sortBy?: 'popular' | 'new' | 'rating' | 'price-low' | 'price-high'
}
