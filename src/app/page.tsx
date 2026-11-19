import { HomeRedirect } from '@/components/features/home/HomeRedirect'
import { FeedPage } from '@/components/feed/FeedPage'

// Гість одразу бачить соціальну мережу (публічну стрічку); будь-яка дія веде на вхід чи реєстрацію.
export default function Home() {
  return (
    <>
      <HomeRedirect />
      <FeedPage />
    </>
  )
}
