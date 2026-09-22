import { notFound } from 'next/navigation'
import { isPaymentsEnabled } from '@/lib/featureFlags'

export default function EarnPage() {
  if (!isPaymentsEnabled()) notFound()
  notFound()
}
