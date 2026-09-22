export function isPaymentsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === 'true'
}
