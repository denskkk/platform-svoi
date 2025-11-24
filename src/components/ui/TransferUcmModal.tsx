'use client'

import { useState } from 'react'
import { Gift, X, AlertCircle, CheckCircle } from 'lucide-react'

interface TransferUcmModalProps {
  recipientId: number
  recipientName: string
  currentUserBalance: number
  onSuccess?: () => void
  onClose?: () => void
}

export function TransferUcmModal({
  recipientId,
  recipientName,
  currentUserBalance,
  onSuccess,
  onClose
}: TransferUcmModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleOpen = () => {
    setIsOpen(true)
    setAmount('')
    setMessage('')
    setError('')
    setSuccess(false)
  }

  const handleClose = () => {
    setIsOpen(false)
    setAmount('')
    setMessage('')
    setError('')
    setSuccess(false)
    onClose?.()
  }

  const handleTransfer = async () => {
    setError('')
    
    const amountNum = parseFloat(amount)
    
    if (!amount || amountNum <= 0) {
      setError('Введіть суму більше 0')
      return
    }

    if (amountNum > currentUserBalance) {
      setError(`Недостатньо коштів. Ваш баланс: ${currentUserBalance.toFixed(2)} уцмка`)
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/ucm/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          recipientId,
          amount: amountNum,
          message: message.trim() || undefined
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Помилка переказу')
      }

      setSuccess(true)
      
      // Оновити баланс в localStorage
      try {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const user = JSON.parse(storedUser)
          user.balanceUcm = data.transfer.sender.newBalance
          localStorage.setItem('user', JSON.stringify(user))
          
          // Повідомити інші компоненти про зміну балансу
          window.dispatchEvent(new Event('auth:changed'))
        }
      } catch (e) {
        console.error('Error updating localStorage:', e)
      }

      // Затримка перед закриттям для показу успіху
      setTimeout(() => {
        handleClose()
        onSuccess?.()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Помилка при переказі')
    } finally {
      setLoading(false)
    }
  }

  const suggestedAmounts = [10, 25, 50, 100, 200]

  return (
    <>
      {/* Кнопка відкриття */}
      <button
        onClick={handleOpen}
        className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
      >
        <Gift className="w-5 h-5" />
        <span>Перекинути уцмки</span>
      </button>

      {/* Модальне вікно */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            {/* Заголовок */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Gift className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Переказ уцмок</h3>
                    <p className="text-green-100 text-sm">для {recipientName}</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Контент */}
            <div className="p-6 space-y-4">
              {/* Поточний баланс */}
              <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
                <p className="text-sm text-neutral-600 mb-1">Ваш баланс</p>
                <p className="text-2xl font-bold text-neutral-900">
                  {currentUserBalance.toFixed(2)} <span className="text-lg text-neutral-600">уцмка</span>
                </p>
              </div>

              {/* Сума переказу */}
              <div>
                <label htmlFor="amount" className="block text-sm font-semibold text-neutral-700 mb-2">
                  Сума переказу
                </label>
                <input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all text-lg font-semibold"
                  disabled={loading || success}
                />
              </div>

              {/* Швидкі суми */}
              <div>
                <p className="text-sm text-neutral-600 mb-2">Швидкий вибір:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedAmounts.map((suggested) => (
                    <button
                      key={suggested}
                      onClick={() => setAmount(suggested.toString())}
                      className="px-4 py-2 bg-neutral-100 hover:bg-green-100 border border-neutral-200 hover:border-green-300 rounded-lg text-sm font-semibold text-neutral-700 hover:text-green-700 transition-all"
                      disabled={loading || success || suggested > currentUserBalance}
                    >
                      {suggested}
                    </button>
                  ))}
                </div>
              </div>

              {/* Повідомлення */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold text-neutral-700 mb-2">
                  Повідомлення (необов'язково)
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Наприклад: За чудову роботу!"
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all resize-none"
                  disabled={loading || success}
                />
                <p className="text-xs text-neutral-500 mt-1">{message.length}/200</p>
              </div>

              {/* Помилка */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900">Помилка</p>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Успіх */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-green-900">Успішно!</p>
                    <p className="text-sm text-green-700">
                      Переказано {parseFloat(amount).toFixed(2)} уцмка для {recipientName}
                    </p>
                  </div>
                </div>
              )}

              {/* Кнопки */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 border-2 border-neutral-300 text-neutral-700 font-semibold rounded-xl hover:bg-neutral-50 transition-all"
                  disabled={loading}
                >
                  Скасувати
                </button>
                <button
                  onClick={handleTransfer}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={loading || success || !amount || parseFloat(amount) <= 0}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Переказ...
                    </span>
                  ) : success ? (
                    '✓ Готово'
                  ) : (
                    'Перекинути'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
