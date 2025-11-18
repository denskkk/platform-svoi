/**
 * Сторінка реферальної програми
 * /referrals
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getUser } from '@/lib/client-auth'
import { Share2, Users, Gift, Copy, Check, TrendingUp } from 'lucide-react'

export default function ReferralsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [referralCode, setReferralCode] = useState<string>('')
  const [referralStats, setReferralStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const currentUser = getUser()
    if (!currentUser) {
      router.push('/auth/login')
      return
    }
    setUser(currentUser)
    loadReferralData(Number(currentUser.id))
  }, [router])

  const loadReferralData = async (userId: number) => {
    try {
      // Отримуємо реферальний код
      const codeRes = await fetch('/api/referrals/code', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const codeData = await codeRes.json()
      setReferralCode(codeData.code || '')

      // Отримуємо статистику рефералів
      const statsRes = await fetch(`/api/referrals/stats?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const statsData = await statsRes.json()
      setReferralStats(statsData)
    } catch (error) {
      console.error('Error loading referral data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReferralLink = () => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/auth/register?ref=${referralCode}`
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getReferralLink())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const shareReferral = async () => {
    const text = `Приєднуйтесь до платформи "Свій для Своїх"! Реєструйтеся за моїм посиланням і отримайте бонус 1 уцмку: ${getReferralLink()}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Запрошення на платформу "Свій для Своїх"',
          text: text,
          url: getReferralLink()
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      copyToClipboard()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full mb-4">
            <Gift className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            Реферальна програма
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Запрошуйте друзів на платформу і заробляйте уцмки разом!
          </p>
        </div>

        {/* Як це працює */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary-600" />
            Як це працює?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">1. Поділіться посиланням</h3>
              <p className="text-neutral-600">Надішліть своє реферальне посилання друзям</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-accent-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">2. Друг реєструється</h3>
              <p className="text-neutral-600">Ваш друг створює акаунт за посиланням</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">3. Обидва отримують бонус</h3>
              <p className="text-neutral-600">Ви отримуєте 1 уцмку, друг теж отримує 1 уцмку</p>
            </div>
          </div>
        </div>

        {/* Ваше посилання */}
        <div className="bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl shadow-xl p-8 mb-8 text-white">
          <h2 className="text-2xl font-bold mb-4">Ваше реферальне посилання</h2>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4 mb-4">
            <p className="text-sm font-mono break-all">{getReferralLink()}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={copyToClipboard}
              className="flex-1 sm:flex-none bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Скопійовано!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Копіювати
                </>
              )}
            </button>
            <button
              onClick={shareReferral}
              className="flex-1 sm:flex-none bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-colors flex items-center justify-center gap-2"
            >
              <Share2 className="w-5 h-5" />
              Поділитися
            </button>
          </div>
        </div>

        {/* Статистика */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-neutral-600 font-medium">Запрошено друзів</h3>
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <p className="text-3xl font-bold text-neutral-900">
              {referralStats?.totalInvited || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-neutral-600 font-medium">Заробле но уцмок</h3>
              <Gift className="w-5 h-5 text-accent-600" />
            </div>
            <p className="text-3xl font-bold text-neutral-900">
              {referralStats?.totalEarned || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-neutral-600 font-medium">Активні реферали</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-neutral-900">
              {referralStats?.activeReferrals || 0}
            </p>
          </div>
        </div>

        {/* Список рефералів */}
        {referralStats?.referrals && referralStats.referrals.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Ваші реферали</h2>
            <div className="space-y-4">
              {referralStats.referrals.map((referral: any) => (
                <div key={referral.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-neutral-900">
                      {referral.firstName} {referral.lastName}
                    </p>
                    <p className="text-sm text-neutral-600">
                      Приєднався: {new Date(referral.createdAt).toLocaleDateString('uk-UA')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-neutral-600">Заробили</p>
                    <p className="font-bold text-primary-600">+1 уцмка</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
