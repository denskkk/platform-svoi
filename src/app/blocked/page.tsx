'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ban, Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders } from '@/lib/feedClient';

interface Blocked { userId: number; name: string; avatarUrl: string | null }

export default function BlockedUsersPage() {
  const router = useRouter();
  const { t } = useI18n();
  const toast = useToast();
  const [items, setItems] = useState<Blocked[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/blocks', { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (res.status === 401) { router.replace('/auth/login?returnUrl=/blocked'); return; }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setItems(data.blocks);
      setError('');
    } catch (e: any) {
      setError(e?.message || t('feed.blocked.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [router, t]);

  useEffect(() => { load(); }, [load]);

  const unblock = async (userId: number) => {
    const prev = items;
    setItems((list) => list.filter((i) => i.userId !== userId));
    try {
      const res = await fetch(`/api/blocks?userId=${userId}`, { method: 'DELETE', credentials: 'include', headers: authHeaders() });
      if (!res.ok) throw new Error();
      toast.success(t('feed.toast.unblocked'));
    } catch {
      setItems(prev);
      toast.error(t('feed.toast.actionFailed'));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-xl px-3 sm:px-4 pt-4 pb-28 md:pb-10 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('feed.blocked.title')}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t('feed.blocked.description')}</p>
        </div>

        {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
        {!loading && error && <p className="text-sm text-red-600 text-center">{error}</p>}
        {!loading && !error && items.length === 0 && <EmptyState icon={Ban} title={t('feed.blocked.empty')} description="" />}

        <ul className="space-y-2">
          {items.map((u) => (
            <li key={u.userId} className="flex items-center gap-3 bg-white rounded-2xl border border-neutral-200/70 p-3">
              <UserAvatar src={u.avatarUrl} alt={u.name} fallbackName={u.name} className="w-11 h-11 rounded-full" />
              <span className="flex-1 min-w-0 truncate font-medium text-neutral-900">{u.name}</span>
              <button type="button" onClick={() => unblock(u.userId)} className="rounded-full bg-neutral-100 hover:bg-neutral-200 text-sm font-semibold px-4 py-2">
                {t('feed.blocked.unblock')}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
