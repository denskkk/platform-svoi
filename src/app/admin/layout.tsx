import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Адмін-панель УЦМ — СВІЙ ДЛЯ СВОЇХ',
  description: 'Панель адміністратора для управління платформою',
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
