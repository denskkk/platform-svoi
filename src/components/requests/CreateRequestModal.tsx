'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const REQUEST_TYPES: { key: string; label: string }[] = [
  { key: 'partner', label: 'Пошук партнера (пари)' },
  { key: 'job', label: 'Заявка на роботу' },
  { key: 'service', label: 'Запит на послугу' },
  { key: 'employee', label: 'Пошук співробітника' },
  { key: 'investor', label: 'Пошук інвестора' },
  { key: 'other', label: 'Розширений пошук' },
];

export default function CreateRequestModal({ open, onClose }: { open: boolean; onClose: ()=>void }) {
  const router = useRouter();
  const [type, setType] = useState('partner');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!title || !description) {
      setError('Будь ласка, заповніть заголовок та опис');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const authHeaders: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};

      // Для заявок на послуги використовуємо окремий API endpoint
      if (type === 'service') {
        const payload = {
          title,
          description,
          isPublic: true,  // Публічна заявка (відображається в списку)
        };

        const res = await fetch('/api/service-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Помилка створення заявки');
          setLoading(false);
          return;
        }

        onClose();
        if (data?.request?.id) {
          router.push(`/service-requests/${data.request.id}`);
        } else {
          router.push('/service-requests');
        }
        return;
      }

      const body: any = { type, title, description };

      // Якщо вибрано зображення — спочатку завантажуємо його
      if (imageFile) {
        try {
          const form = new FormData();
          form.append('file', imageFile);
          form.append('type', 'requests');
          const upRes = await fetch('/api/upload', { method: 'POST', headers: authHeaders, credentials: 'include', body: form });
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
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Помилка створення заявки');
        setLoading(false);
        return;
      }

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
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Закрити"><X /></button>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Фото (необов'язково)</label>
            {imagePreview ? (
              <div className="relative inline-block">
                <Image src={imagePreview} alt="preview" width={320} height={160} unoptimized className="w-full max-w-xs h-40 object-cover rounded" />
              </div>
            ) : null}
            <input type="file" accept="image/*" onChange={handleImageChange} className="mt-2" />
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
