'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Flag } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface ReportItem {
  id: number;
  category: string | null;
  reason: string;
  status: 'new' | 'in_review' | 'resolved' | 'rejected';
  createdAt: string;
  reporter: { id: number; firstName: string; lastName: string; email: string };
  reportedUser: { id: number; firstName: string; lastName: string; email: string; isActive: boolean };
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Нова',
  in_review: 'На розгляді',
  resolved: 'Опрацьована',
  rejected: 'Відхилена',
};

const CATEGORY_LABELS: Record<string, string> = {
  spam: 'Спам',
  fraud: 'Шахрайство',
  abuse: 'Образи / погрози',
  inappropriate: 'Недопустимий вміст',
  fake: 'Фальшивий профіль / відгук',
  other: 'Інше',
};

export default function AdminReportsPage() {
  const router = useRouter();
  const toast = useToast();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('new');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?status=${filter}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Помилка завантаження');
      setReports(data.reports);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored || !JSON.parse(stored).isAdmin) {
        router.push('/auth/login');
        return;
      }
    } catch {
      router.push('/auth/login');
      return;
    }
    load();
  }, [load, router]);

  const setStatus = async (id: number, status: string) => {
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Помилка оновлення');
      toast.success('Статус оновлено');
      load();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50/20 to-neutral-100 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push('/admin')}
          className="inline-flex items-center text-neutral-600 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Назад до адмін-панелі
        </button>

        <h1 className="text-3xl font-bold text-neutral-900 mb-6 flex items-center gap-3">
          <Flag className="w-8 h-8 text-red-500" />
          Скарги користувачів
        </h1>

        <div className="flex gap-2 mb-6 flex-wrap">
          {['new', 'in_review', 'resolved', 'rejected'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === s ? 'bg-primary-500 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-neutral-600">Завантаження...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-neutral-600 bg-white rounded-2xl shadow">Скарг немає</div>
        ) : (
          <div className="space-y-4">
            {reports.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl shadow p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div>
                    <div className="text-sm text-neutral-500">
                      #{r.id} · {new Date(r.createdAt).toLocaleString('uk-UA')} ·{' '}
                      <span className="font-medium">{CATEGORY_LABELS[r.category || 'other'] || r.category}</span>
                    </div>
                    <div className="mt-1">
                      На:{' '}
                      <Link href={`/profile/${r.reportedUser.id}`} className="font-semibold text-primary-700 hover:underline">
                        {r.reportedUser.firstName} {r.reportedUser.lastName}
                      </Link>{' '}
                      <span className="text-neutral-500 text-sm">({r.reportedUser.email})</span>
                    </div>
                    <div className="text-sm text-neutral-600">
                      Від: {r.reporter.firstName} {r.reporter.lastName} ({r.reporter.email})
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-neutral-100 text-sm font-medium">{STATUS_LABELS[r.status]}</span>
                </div>

                <p className="text-neutral-800 whitespace-pre-line mb-4">{r.reason}</p>

                <div className="flex gap-2 flex-wrap">
                  {r.status !== 'in_review' && (
                    <button onClick={() => setStatus(r.id, 'in_review')} className="px-3 py-1.5 text-sm rounded-lg bg-blue-100 text-blue-800 hover:bg-blue-200">
                      Взяти в роботу
                    </button>
                  )}
                  {r.status !== 'resolved' && (
                    <button onClick={() => setStatus(r.id, 'resolved')} className="px-3 py-1.5 text-sm rounded-lg bg-green-100 text-green-800 hover:bg-green-200">
                      Опрацьовано
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button onClick={() => setStatus(r.id, 'rejected')} className="px-3 py-1.5 text-sm rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
                      Відхилити
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
