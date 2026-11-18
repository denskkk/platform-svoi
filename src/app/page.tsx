import { HomeRedirect } from '@/components/features/home/HomeRedirect'
import { SocialLanding } from '@/components/features/home/SocialLanding'
import { CategoriesSection } from '@/components/features/home/CategoriesSection'
import { PopularProfiles } from '@/components/features/home/PopularProfiles'
import { CTASection } from '@/components/features/home/CTASection'

export default function Home() {
  return (
    <div className="ukrainian-pattern">
      <HomeRedirect />
      <SocialLanding />
      <CategoriesSection />
      <PopularProfiles />
      <CTASection />
    </div>
  )
}
