'use client';

import React, { useEffect, useState } from 'react';
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

export default function CreateRequestModal({ open, onClose }: { open: boolean; onClose: ()=>void }) {
  const router = useRouter();
  const [type, setType] = useState('partner');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [paid, setPaid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(()=>{
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r=>r.json())
      .then(d=>{
        if (d?.user) setBalance(Number(d.user.balanceUcm) || 0);
      })
      .catch(()=>{});
  }, [open]);

  const submit = async () => {
    setError(null);
    if (!title || !description) {
      setError('Будь ласка, заповніть заголовок та опис');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const body: any = { type, title, description };
      if (paid) body.paid = true;

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

      // On success, close and redirect to services (so it appears in list)
      onClose();
      router.push('/services');
    } catch (e: any) {
      setError(e.message || 'Помилка');
    } finally {
      setLoading(false);
    }
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

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input id="paid" type="checkbox" checked={paid} onChange={e=>setPaid(e.target.checked)} />
              <label htmlFor="paid" className="text-sm text-gray-700">Заплатити уцмки за підвищену видимість</label>
            </div>
            <div className="text-sm text-gray-600">Баланс: {balance !== null ? balance.toFixed(2) : '—'}</div>
          </div>

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
