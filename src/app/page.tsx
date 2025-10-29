import { HeroSection } from '@/components/features/home/HeroSection'
import { CategoriesSection } from '@/components/features/home/CategoriesSection'
import { PopularProfiles } from '@/components/features/home/PopularProfiles'
import { ValuesSection } from '@/components/features/home/ValuesSection'
import { CTASection } from '@/components/features/home/CTASection'

export default function Home() {
  return (
    <div className="ukrainian-pattern">
      <HeroSection />
      <CategoriesSection />
      <PopularProfiles />
      <ValuesSection />
      <CTASection />
    </div>
  )
}
