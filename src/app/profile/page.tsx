'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfileIndexRedirect() {
  const router = useRouter()

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user')
      const user = stored ? JSON.parse(stored) : null
      if (user?.id) {
        router.replace(`/profile/${user.id}`)
      } else {
        router.replace('/auth/login')
      }
    } catch {
      router.replace('/auth/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center text-neutral-600">
      Завантаження...
    </div>
  )
}
