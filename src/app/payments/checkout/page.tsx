import { notFound } from 'next/navigation'
import { isPaymentsEnabled } from '@/lib/featureFlags'

export default function CheckoutPage() {
  if (!isPaymentsEnabled()) notFound()
  notFound()
}
