"use client"
import React from 'react'
import { formatUCM } from '@/lib/utils'
import { useToast } from '@/components/ui/Toast'

type Props = {
  amount: number
  description?: string
  className?: string
  children?: React.ReactNode
}

export function PayButton({ amount, description, className, children }: Props) {
  const [loading, setLoading] = React.useState(false)
  const toast = useToast();

  const handlePay = async () => {
    try {
      setLoading(true)
      const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || '') : ''
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amount, description }),
      })
      if (!res.ok) throw new Error('Не вдалося створити платіж')
      const data = await res.json()
      const { payUrl, payload } = data

      // Динамічна форма для редіректу на WayForPay
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = payUrl

      Object.entries(payload).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach((vv) => {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = `${k}[]`
            input.value = String(vv)
            form.appendChild(input)
          })
        } else if (v !== undefined && v !== null) {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = k
          input.value = String(v)
          form.appendChild(input)
        }
      })

      document.body.appendChild(form)
      form.submit()
    } catch (e) {
      console.error(e)
      toast.error('Сталася помилка під час створення платежу')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handlePay} disabled={loading} className={className}>
      {children ?? (loading ? 'Зачекайте…' : `Оплатити ${formatUCM(amount)}`)}
    </button>
  )
}

export default PayButton
