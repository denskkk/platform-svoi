/**
 * Request detail page (server component)
 * Shows details for a user-created request (job, partner, service, etc.)
 */

import Link from 'next/link'
import { ServiceImage } from '@/components/ui/ServiceImage'
import { MapPin, ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { UserOrCompanyAvatar } from '@/components/ui/UserOrCompanyAvatar'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function RequestDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  try {
    const req = await prisma.request.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            city: true,
            profession: true,
            avgRating: true,
            totalReviews: true,
            isVerified: true,
            businessInfo: {
              select: { companyName: true, logoUrl: true }
            }
          }
        }
      }
    })

    if (!req) {
      return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">Запит не знайдено</p>
            <Link href="/services" className="text-primary-600 hover:text-primary-700">До каталогу послуг</Link>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-neutral-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/services" className="inline-flex items-center text-neutral-600 hover:text-neutral-900 mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" />
            До каталогу послуг
          </Link>

          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <div className="mb-4 text-sm text-blue-600 font-semibold">
              {req.type === 'job' ? 'Робота' : req.type === 'partner' ? 'Пошук партнера' : req.type === 'service' ? 'Запит на послугу' : 'Запит'}
              {req.isPaid && req.priceUcm ? ` · промо за ${Number(req.priceUcm)} уцм` : ''}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-4">{req.title}</h1>

            {/* Image (if provided in metadata) - use client-side ServiceImage to avoid optimizer 400 errors */}
            {req.metadata && req.metadata.imageUrl ? (
              <div className="mb-6">
                <ServiceImage src={req.metadata.imageUrl} alt={req.title} className="w-full max-h-96 object-cover rounded-lg mb-4 h-[400px] object-cover" fallbackLetter={req.title?.slice(0,1)} />
              </div>
            ) : null}

            {req.description && (
              <div className="mb-6 text-neutral-700 whitespace-pre-line">{req.description}</div>
            )}

            <div className="border-t pt-4 mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <UserOrCompanyAvatar user={req.user as any} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <Link href={`/profile/${req.user.id}`} className="font-semibold text-neutral-900 hover:text-primary-600">
                      {req.user.businessInfo?.companyName || `${req.user.firstName} ${req.user.lastName}`}
                    </Link>
                    {req.user.city && (
                      <div className="text-sm text-neutral-600 flex items-center gap-1"><MapPin className="w-3 h-3" />{req.user.city}</div>
                    )}
                  </div>
                </div>

                <div className="text-sm text-neutral-500">Опубліковано: {new Date(req.createdAt).toLocaleDateString('uk-UA')}</div>
              </div>
            </div>

            {/* Additional meta */}
            <div className="mt-6 text-sm text-neutral-600 space-y-2">
              {req.budgetFrom && <div>Бюджет: від {Number(req.budgetFrom)} {req.priceUcm ? 'уцм' : 'грн'}</div>}
              {req.budgetTo && <div>До: {Number(req.budgetTo)} {req.priceUcm ? 'уцм' : 'грн'}</div>}
              {req.deadlineAt && <div>Термін: {new Date(req.deadlineAt).toLocaleDateString('uk-UA')}</div>}
            </div>

            <div className="mt-6">
              <Link href={`/chat?with=${req.user.id}`} className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg">Написати автору</Link>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (e) {
    console.error('Request detail error', e)
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-red-600">Помилка завантаження запиту</div>
      </div>
    )
  }
}
