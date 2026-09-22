import { notFound } from 'next/navigation'
import { isPaymentsEnabled } from '@/lib/featureFlags'

export default function UpgradePage() {
  if (!isPaymentsEnabled()) notFound()
  notFound()
}
