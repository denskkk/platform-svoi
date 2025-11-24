"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function EditBusinessSimplePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setUser(u);
        setPhone(u.phone || '');
        setCity(u.city || '');
        loadBusiness(u.id);
      } catch (e) {}
    } else {
      (async () => {
        try {
          const res = await fetch('/api/auth/me', { credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              setUser(data.user);
              setPhone(data.user.phone || '');
              setCity(data.user.city || '');
              loadBusiness(data.user.id);
            }
          }
        } catch (e) {}
      })();
    }
  }, []);

  async function loadBusiness(userId: number) {
    try {
      const res = await fetch(`/api/business-info?userId=${userId}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.businessInfo) {
          setBusiness(data.businessInfo);
          setCompanyName(data.businessInfo.companyName || '');
          setCompanyCode(data.businessInfo.companyCode || '');
          setPhone(data.businessInfo.phone || phone);
          setCity(data.businessInfo.city || city);
        }
      }
    } catch (e) {}
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!user) return setError('Користувач не знайдений');
    setLoading(true);
    try {
      // Update business info
      const body: any = { companyName, companyCode, phone, city };
      const res = await fetch('/api/business-info', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Помилка оновлення бізнес-профілю');
      } else {
        setSuccess('Бізнес-профіль оновлено');
        // update local storage user and business info
        try {
          const stored = JSON.parse(localStorage.getItem('user') || '{}');
          const merged = { ...stored, phone, city };
          localStorage.setItem('user', JSON.stringify(merged));
        } catch (e) {}
        setTimeout(() => router.push(`/profile/${user.id}`), 900);
      }
    } catch (e) {
      setError('Помилка мережі');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl">
      <h2 className="text-lg font-semibold mb-4">Просте редагування бізнес-профілю</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm">Назва компанії</label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full border px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm">ЄДРПОУ / Код</label>
          <input value={companyCode} onChange={(e) => setCompanyCode(e.target.value)} className="w-full border px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm">Телефон</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border px-2 py-1" />
        </div>
        <div>
          <label className="block text-sm">Місто</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full border px-2 py-1" />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <button type="submit" disabled={loading} className="px-3 py-1 bg-blue-600 text-white rounded">
            {loading ? 'Збереження...' : 'Зберегти'}
          </button>
          <button type="button" onClick={() => user && router.push(`/profile/${user.id}`)} className="px-3 py-1 border rounded">
            Відміна
          </button>
        </div>
        {error && <div className="text-red-600">{error}</div>}
        {success && <div className="text-green-600">{success}</div>}
      </form>
    </div>
  );
}
