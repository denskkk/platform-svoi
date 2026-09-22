import { notFound } from 'next/navigation'
import { isPaymentsEnabled } from '@/lib/featureFlags'

export default function PricingPage() {
  if (!isPaymentsEnabled()) notFound()
  notFound()
}
