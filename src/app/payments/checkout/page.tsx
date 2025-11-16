"use client"
import React from 'react'
import PayButton from '@/components/payments/PayButton'
import { formatUCM } from '@/lib/utils'

export default function CheckoutPage() {
  const [amount, setAmount] = React.useState<number>(100)

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold">Поповнення балансу</h1>
      <p className="text-sm text-muted-foreground">Внутрішня валюта: уцмка</p>
      <div className="space-y-2">
        <label className="block text-sm font-medium">Сума</label>
        <input
          type="number"
          min={1}
          step="1"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full rounded-md border px-3 py-2"
        />
        <div className="text-sm">До сплати: {formatUCM(amount)}</div>
      </div>
      <PayButton amount={amount} className="px-4 py-2 rounded-md bg-black text-white">
        Оплатити {formatUCM(amount)}
      </PayButton>
    </div>
  )
}
