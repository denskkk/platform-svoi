/**
 * Компонент для платних функцій
 * Показує ціну та перевіряє баланс перед виконанням дії
 */

'use client'

import { useState } from 'react'
import { Coins, AlertCircle, Loader2 } from 'lucide-react'

interface PaidFeatureButtonProps {
  actionType: 'partner_search' | 'job_request' | 'service_request' | 'employee_search' | 'investor_search' | 'advanced_search'
  cost: number
  userBalance: number
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
  relatedEntityType?: string
  relatedEntityId?: number
  description?: string
  children?: React.ReactNode
  className?: string
  disabled?: boolean
}

export function PaidFeatureButton({
  actionType,
  cost,
  userBalance,
  onSuccess,
  onError,
  relatedEntityType,
  relatedEntityId,
  description,
  children,
  className = '',
  disabled = false
}: PaidFeatureButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const insufficientFunds = userBalance < cost

  const handleClick = () => {
    if (insufficientFunds) {
      onError?.('Недостатньо уцмок на балансі')
      return
    }
    setShowConfirm(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/paid-actions/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          actionType,
          relatedEntityType,
          relatedEntityId,
          description
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Помилка оплати')
      }

      onSuccess?.(data)
      setShowConfirm(false)
    } catch (error: any) {
      onError?.(error.message || 'Помилка оплати')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setShowConfirm(false)
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 mb-2">
              Підтвердження оплати
            </h3>
            <p className="text-neutral-600">
              З вашого балансу буде списано <span className="font-bold text-primary-600">{cost} уцмок</span>
            </p>
            {description && (
              <p className="text-sm text-neutral-500 mt-2">{description}</p>
            )}
          </div>

          <div className="bg-neutral-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-neutral-600">Поточний баланс:</span>
              <span className="font-bold text-neutral-900">{userBalance} уцмок</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-neutral-600">Вартість дії:</span>
              <span className="font-bold text-red-600">-{cost} уцмок</span>
            </div>
            <div className="border-t border-neutral-200 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-neutral-900">Залишок:</span>
                <span className="font-bold text-primary-600">{userBalance - cost} уцмок</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 px-6 py-3 border-2 border-neutral-300 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Скасувати
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Обробка...
                </>
              ) : (
                'Підтвердити'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || loading || insufficientFunds}
      className={`relative ${className} ${
        insufficientFunds
          ? 'opacity-50 cursor-not-allowed'
          : 'hover:opacity-90'
      }`}
    >
      {children}
      <div className="flex items-center gap-1 text-xs mt-1">
        <Coins className="w-3 h-3" />
        <span>{cost} уцмок</span>
      </div>
      {insufficientFunds && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
          <AlertCircle className="w-4 h-4" />
        </div>
      )}
    </button>
  )
}

// Простий компонент для відображення ціни дії
export function PaidActionPrice({ cost, inline = false }: { cost: number; inline?: boolean }) {
  if (inline) {
    return (
      <span className="inline-flex items-center gap-1 text-primary-600 font-semibold">
        <Coins className="w-4 h-4" />
        {cost} уцмок
      </span>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-full font-semibold">
      <Coins className="w-4 h-4" />
      <span>{cost} уцмок</span>
    </div>
  )
}
