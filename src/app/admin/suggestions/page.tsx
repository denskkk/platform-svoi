'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';

interface Item { id: number; projectSlug: string; kind: string; text: string; status: string; createdAt: string; user: { id: number; firstName: string; lastName: string; email: string } }

export default function AdminSuggestionsPage() {
  const { t, formatDate } = useI18n();
  const toast = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState('new');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/suggestions?status=${filter}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      setItems((await res.json()).items);
    } catch { toast.error(t('admin.suggestions.loadFailed')); } finally { setLoading(false); }
  }, [filter, toast, t]);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: number, status: string) => {
    const res = await fetch('/api/admin/suggestions', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    if (res.ok) load(); else toast.error(t('admin.suggestions.loadFailed'));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-neutral-600"><ArrowLeft className="w-4 h-4" />{t('admin.suggestions.back')}</Link>
      <h1 className="text-2xl font-bold">{t('admin.suggestions.title')}</h1>
      <div className="flex flex-wrap gap-2">
        {['new', 'review', 'offers', 'clarify', 'published', 'done', 'rejected', 'closed'].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${filter === s ? 'bg-primary-500' : 'bg-neutral-100'}`}>{t(`admin.suggestions.status.${s}`)}</button>
        ))}
      </div>
      {loading ? <p className="text-sm text-neutral-500">…</p> : items.length === 0 ? <p className="text-sm text-neutral-500">{t('admin.suggestions.empty')}</p> : items.map((i) => (
        <article key={i.id} className="rounded-2xl bg-white border border-neutral-200 p-4 space-y-2">
          <p className="text-xs text-neutral-500">{t(`admin.suggestions.kind.${i.kind}`)} · {i.projectSlug} · {formatDate(i.createdAt)}</p>
          <p className="text-sm whitespace-pre-wrap break-words">{i.text}</p>
          <p className="text-xs text-neutral-500">{i.user.firstName} {i.user.lastName} · {i.user.email}</p>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-neutral-500">{t('admin.suggestions.statusLabel')}</span>
            <select value={i.status} onChange={(e) => setStatus(i.id, e.target.value)} className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm">
              {['new', 'review', 'offers', 'clarify', 'published', 'done', 'rejected', 'closed'].map((s) => <option key={s} value={s}>{t(`admin.suggestions.status.${s}`)}</option>)}
            </select>
          </label>
        </article>
      ))}
    </div>
  );
}
