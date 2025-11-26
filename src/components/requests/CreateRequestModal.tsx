'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
// import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const REQUEST_TYPES: { key: string; label: string; priceKey?: string }[] = [
  { key: 'partner', label: 'Пошук партнера (пари)', priceKey: 'partner_search' },
  { key: 'job', label: 'Заявка на роботу', priceKey: 'job_request' },
  { key: 'service', label: 'Запит на послугу', priceKey: 'service_request' },
  { key: 'employee', label: 'Пошук співробітника', priceKey: 'employee_search' },
  { key: 'investor', label: 'Пошук інвестора', priceKey: 'investor_search' },
  { key: 'other', label: 'Розширений пошук', priceKey: 'advanced_search' },
];

// Базова вартість створення заявки на послугу
const SERVICE_REQUEST_BASE_PRICE = 5; // 5 УЦМ
const SERVICE_REQUEST_PROMO_PRICE = 2; // +2 УЦМ за просування
const SERVICE_REQUEST_PROMO_DAYS = 3; // 3 дні в топі

// Server-driven prices will be fetched from /api/ucm/costs
type CostsMap = Record<string, number>;

const FALLBACK_COSTS: CostsMap = {
  partner_search: 5,
  job_request: 3,
  service_request: 5, // Оновлено на 5 УЦМ
  employee_search: 4,
  investor_search: 5,
  advanced_search: 2,
};

export default function CreateRequestModal({ open, onClose }: { open: boolean; onClose: ()=>void }) {
  const router = useRouter();
  const [type, setType] = useState('partner');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  // promote = whether user wants to pay extra for promotion/visibility
  const [promote, setPromote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(()=>{
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` }, credentials: 'include' })
      .then(r=>r.json())
      .then(d=>{
        if (d?.user) setBalance(Number(d.user.balanceUcm) || 0);
      })
      .catch(()=>{});
  }, [open]);

  const [serverCosts, setServerCosts] = useState<any | null>(null);

  useEffect(() => {
    if (!open) return;
    let canceled = false;
    fetch('/api/ucm/costs')
      .then(r => r.json())
      .then(d => {
        if (canceled) return;
        if (d) setServerCosts(d);
      }).catch(() => {});
    return () => { canceled = true };
  }, [open]);

    useEffect(()=>{
      // default: don't promote by default; promotion is optional
      setPromote(false);
    }, [type, serverCosts]);

  const submit = async () => {
    setError(null);
    if (!title || !description) {
      setError('Будь ласка, заповніть заголовок та опис');
      return;
    }
    
    // Для заявок на послуги використовуємо фіксовану вартість
    const base = type === 'service' ? SERVICE_REQUEST_BASE_PRICE : (() => {
      const entry = REQUEST_TYPES.find(r => r.key === type);
      const priceKey = entry?.priceKey;
      return priceKey ? (serverCosts?.costs?.[priceKey] ?? FALLBACK_COSTS[priceKey] ?? 0) : 0;
    })();
    
    const promoExtra = type === 'service' ? SERVICE_REQUEST_PROMO_PRICE : (() => {
      const entry = REQUEST_TYPES.find(r => r.key === type);
      const priceKey = entry?.priceKey;
      return priceKey ? (serverCosts?.promoExtras?.[priceKey] ?? 0) : 0;
    })();
    
    const total = base + (promote ? promoExtra : 0);
    
    if (total > 0 && (balance === null || balance < total)) {
      setError(`Недостатньо УЦМ: потрібно ${total} УЦМ, у вас ${balance || 0} УЦМ`);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Для заявок на послуги використовуємо окремий API endpoint
      if (type === 'service') {
        const payload = {
          title,
          description,
          isPublic: true,  // Публічна заявка (відображається в списку)
          isPromoted: promote,  // Чи просувати в топ
        };

        const res = await fetch('/api/service-requests', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || 'Помилка створення заявки');
          setLoading(false);
          return;
        }

        // Успішно створено
        onClose();
        if (data?.request?.id) {
          router.push(`/service-requests/${data.request.id}`);
        } else {
          router.push('/service-requests');
        }
        return;
      }

      // Для інших типів заявок використовуємо старий API
      const body: any = { type, title, description };
      if (promote) body.paid = true;

      // If an image was selected, upload it first
      if (imageFile) {
        try {
          const form = new FormData();
          form.append('file', imageFile);
          form.append('type', 'requests');
          const upRes = await fetch('/api/upload', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: form });
          const upData = await upRes.json();
          if (upRes.ok && upData.url) {
            body.imageUrl = upData.url.split('?')[0];
          }
        } catch (ue) {
          console.warn('[CreateRequestModal] image upload failed', ue);
        }
      }

      const res = await fetch('/api/requests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Помилка створення заявки');
        setLoading(false);
        return;
      }

      // On success, close and redirect to the created request detail
      onClose();
      if (data?.requestId) {
        router.push(`/requests/${data.requestId}`);
      } else {
        router.push('/services');
      }
    } catch (e: any) {
      setError(e.message || 'Помилка');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Оберіть зображення');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Файл занадто великий. Максимум 10MB');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  if (!open) return null;

  return (
    <div className="fixed z-50 inset-0 flex items-center justify-center">
      <div className="fixed inset-0 bg-black opacity-30" onClick={onClose} />
      <div className="relative bg-white rounded-lg max-w-xl w-full p-6 z-20">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-bold">Створити заявку</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700"><X /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип заявки</label>
            <select value={type} onChange={e=>setType(e.target.value)} className="w-full p-2 border rounded">
              {REQUEST_TYPES.map(t=> <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full p-2 border rounded" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Опис</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} rows={5} className="w-full p-2 border rounded" />
          </div>

          {/* Cost breakdown (server-defined): base creation cost + optional promotion extra */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-900 mb-2 font-semibold">💰 Вартість створення заявки</div>
            <div className="text-sm text-gray-700">
              {(() => {
                const entry = REQUEST_TYPES.find(r => r.key === type);
                const priceKey = entry?.priceKey;
                // Для service_request використовуємо фіксовані ціни
                const base = type === 'service' ? SERVICE_REQUEST_BASE_PRICE : (priceKey ? (serverCosts?.costs?.[priceKey] ?? FALLBACK_COSTS[priceKey] ?? 0) : 0);
                const promoExtra = type === 'service' ? SERVICE_REQUEST_PROMO_PRICE : (priceKey ? (serverCosts?.promoExtras?.[priceKey] ?? 0) : 0);
                const total = base + (promote ? promoExtra : 0);
                return (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Створення заявки:</span>
                      <span className="font-medium">{base} УЦМ</span>
                    </div>
                    {promote && promoExtra > 0 && (
                      <div className="flex justify-between text-yellow-700">
                        <span>🔥 Просування в ТОП ({SERVICE_REQUEST_PROMO_DAYS} дні):</span>
                        <span className="font-medium">+{promoExtra} УЦМ</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 mt-2 border-t border-blue-200">
                      <span className="font-semibold">Всього:</span>
                      <span className="font-bold text-blue-700">{total} УЦМ</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Фото (необов'язково)</label>
            {imagePreview ? (
              <div className="relative inline-block">
                <Image src={imagePreview} alt="preview" width={320} height={160} className="w-full max-w-xs h-40 object-cover rounded" />
              </div>
            ) : null}
            <input type="file" accept="image/*" onChange={handleImageChange} className="mt-2" />
          </div>

          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-4">
            <label className="flex items-start cursor-pointer">
              <input 
                id="promote" 
                type="checkbox" 
                checked={promote} 
                onChange={e=>setPromote(e.target.checked)}
                className="mt-1 w-5 h-5 text-yellow-600 rounded focus:ring-2 focus:ring-yellow-500"
              />
              <div className="ml-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-gray-900">🔥 Просунути в ТОП</span>
                  <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-bold rounded-full">+{SERVICE_REQUEST_PROMO_PRICE} УЦМ</span>
                </div>
                <p className="text-sm text-gray-700 mt-1">
                  Ваша заявка буде показуватись першою протягом <strong>{SERVICE_REQUEST_PROMO_DAYS} днів</strong> і отримає більше відгуків від виконавців
                </p>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div className="text-sm text-gray-700">Ваш баланс:</div>
            <div className="text-base font-bold text-blue-600">{balance !== null ? `${balance.toFixed(0)} УЦМ` : '—'}</div>
          </div>

          {/* If user lacks funds for the total, show top-up CTA */}
          {(() => {
            const base = type === 'service' ? SERVICE_REQUEST_BASE_PRICE : (() => {
              const entry = REQUEST_TYPES.find(r=> r.key === type);
              const priceKey = entry?.priceKey;
              return priceKey ? (serverCosts?.costs?.[priceKey] ?? FALLBACK_COSTS[priceKey] ?? 0) : 0;
            })();
            const promoExtra = type === 'service' ? SERVICE_REQUEST_PROMO_PRICE : (() => {
              const entry = REQUEST_TYPES.find(r=> r.key === type);
              const priceKey = entry?.priceKey;
              return priceKey ? (serverCosts?.promoExtras?.[priceKey] ?? 0) : 0;
            })();
            const total = base + (promote ? promoExtra : 0);
            
            if (balance !== null && balance < total) {
              const needed = total - balance;
              return (
                <div className="mt-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-800 mb-2">
                    ⚠️ Недостатньо УЦМ: потрібно {total} УЦМ, у вас {balance.toFixed(0)} УЦМ (не вистачає {needed} УЦМ)
                  </p>
                  <div className="flex gap-2">
                    <a href="/ucm" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                      Поповнити баланс
                    </a>
                    {promote && (
                      <button 
                        onClick={()=>setPromote(false)} 
                        className="px-3 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
                      >
                        Створити без просування ({base} УЦМ)
                      </button>
                    )}
                  </div>
                </div>
              )
            }
            return null
          })()}

          {error && <div className="text-sm text-red-600">{error}</div>}

          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 border rounded">Скасувати</button>
            <button onClick={submit} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
              {loading ? 'Створюємо...' : 'Створити заявку'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
