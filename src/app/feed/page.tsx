import type { Metadata } from 'next'
import { FeedPage } from '@/components/feed/FeedPage'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function Feed() {
  return <FeedPage />
}
