import type { Metadata } from 'next'
import { getT } from '@/i18n/server'

export function generateMetadata(): Metadata {
  const { t } = getT()
  return {
    title: t('admin.meta.title'),
    description: t('admin.meta.description'),
  }
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  )
}
