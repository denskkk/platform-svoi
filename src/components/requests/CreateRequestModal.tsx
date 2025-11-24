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

// Server-driven prices will be fetched from /api/ucm/costs
type CostsMap = Record<string, number>;

const FALLBACK_COSTS: CostsMap = {
  partner_search: 5,
  job_request: 3,
  service_request: 3,
  employee_search: 4,
  investor_search: 5,
  advanced_search: 2,
};

export default function CreateRequestModal({ open, onClose }: { open: boolean; onClose: ()=>void }) {
  const router = useRouter();
  const [type, setType] = useState('partner');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budgetFrom, setBudgetFrom] = useState<string>('');
  const [budgetTo, setBudgetTo] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [paid, setPaid] = useState(true);
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

  const [serverCosts, setServerCosts] = useState<CostsMap | null>(null);

  useEffect(() => {
    if (!open) return;
    let canceled = false;
    fetch('/api/ucm/costs')
      .then(r => r.json())
      .then(d => {
        if (canceled) return;
        if (d?.costs) setServerCosts(d.costs as CostsMap);
      }).catch(() => {});
    return () => { canceled = true };
  }, [open]);

    useEffect(()=>{
      // ensure paid checkbox default for selected type (use server costs if available)
      const entry = REQUEST_TYPES.find(r => r.key === type);
      const priceKey = entry?.priceKey;
      const price = priceKey ? (serverCosts ? (serverCosts[priceKey] ?? 0) : (FALLBACK_COSTS[priceKey] ?? 0)) : 0;
      setPaid(price > 0);
    }, [type, serverCosts]);

  const submit = async () => {
    setError(null);
    if (!title || !description) {
      setError('Будь ласка, заповніть заголовок та опис');
      return;
    }

    // Check balance if paid (use server costs if available)
    const entry = REQUEST_TYPES.find(r => r.key === type);
    const priceKey = entry?.priceKey;
    const price = priceKey ? (serverCosts ? (serverCosts[priceKey] ?? 0) : /*fallback*/ 0) : 0;
    if (paid && (balance === null || balance < price)) {
      setError('Недостатньо уцмок на балансі для обраного типу заявки');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const body: any = { type, title, description };
      if (paid) body.paid = true;
      if (budgetFrom) body.budgetFrom = parseFloat(budgetFrom);
      if (budgetTo) body.budgetTo = parseFloat(budgetTo);

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

          {/* Цена убрана по требованию — бюджет можно обсуждать в переписке */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Фото (необов'язково)</label>
            {imagePreview ? (
              <div className="relative inline-block">
                <Image src={imagePreview} alt="preview" width={320} height={160} className="w-full max-w-xs h-40 object-cover rounded" />
              </div>
            ) : null}
            <input type="file" accept="image/*" onChange={handleImageChange} className="mt-2" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input id="paid" type="checkbox" checked={paid} onChange={e=>setPaid(e.target.checked)} />
              <label htmlFor="paid" className="text-sm text-gray-700">Заплатити уцмки за підвищену видимість</label>
              {REQUEST_TYPES.map(r=> r.key === type && r.priceKey ? (
                <span key={r.key} className="text-sm text-gray-600">({serverCosts ? `${serverCosts[r.priceKey] ?? 0} уцм` : 'завантаження...'})</span>
              ) : null)}
            </div>
            <div className="text-sm text-gray-600">Баланс: {balance !== null ? balance.toFixed(2) : '—'}</div>
          </div>

          {/* If user lacks funds, show top-up CTA */}
          {paid && serverCosts && (() => {
            const entry = REQUEST_TYPES.find(r=> r.key === type);
            const price = entry?.priceKey ? (serverCosts[entry.priceKey] ?? 0) : 0;
            if (balance !== null && balance < price) {
              return (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">Недостатньо уцмок: потрібно {price} уцм.</p>
                  <div className="mt-2">
                    <a href="/payments/checkout" className="inline-block px-4 py-2 bg-yellow-600 text-white rounded">Додати уцмок</a>
                    <button onClick={()=>setPaid(false)} className="ml-3 px-3 py-2 border rounded">Створити без оплати</button>
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
