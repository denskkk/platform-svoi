'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, X } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';

interface Row { id: number; name: string; avatarUrl: string | null; canWrite: boolean }

/** Панель власника: заявки на вступ, права писати, видалення учасників. */
export function ClubManage({ clubId, onChanged }: { clubId: number; onChanged: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const [pending, setPending] = useState<Row[]>([]);
  const [members, setMembers] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/clubs/${clubId}/requests`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (!res.ok) throw new Error();
      const d = await res.json();
      setPending(d.pending || []); setMembers(d.members || []);
    } catch { /* панель необов'язкова */ } finally { setLoading(false); }
  }, [clubId]);
  useEffect(() => { load(); }, [load]);

  const act = async (userId: number, action: string) => {
    if (busy) return;
    setBusy(userId);
    try {
      const res = await fetch(`/api/clubs/${clubId}/requests`, { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ userId, action }) });
      if (!res.ok) throw new Error();
      await load();
      if (action === 'approve' || action === 'remove') onChanged();
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setBusy(null); }
  };

  const person = (r: Row) => (
    <Link href={`/profile/${r.id}`} className="flex items-center gap-2.5 min-w-0 flex-1">
      <UserAvatar src={r.avatarUrl} alt={r.name} fallbackName={r.name} className="w-9 h-9 rounded-full shrink-0" />
      <span className="truncate text-sm font-medium">{r.name}</span>
    </Link>
  );

  return (
    <section className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
      <h2 className="font-semibold text-neutral-900">{t('clubs.manage.title')}</h2>
      {loading && <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />}
      {!loading && (
        <>
          <div>
            <h3 className="text-sm font-semibold text-neutral-700 mb-2">{t('clubs.manage.requests')}</h3>
            {pending.length === 0 ? <p className="text-sm text-neutral-500">{t('clubs.manage.noRequests')}</p> : (
              <ul className="space-y-2">
                {pending.map((r) => (
                  <li key={r.id} className="flex items-center gap-2">
                    {person(r)}
                    <button type="button" disabled={busy === r.id} onClick={() => act(r.id, 'approve')} className="inline-flex items-center gap-1 rounded-lg bg-primary-500 text-neutral-900 text-xs font-bold px-3 py-1.5"><Check className="w-3.5 h-3.5" />{t('clubs.manage.approve')}</button>
                    <button type="button" disabled={busy === r.id} onClick={() => act(r.id, 'reject')} className="inline-flex items-center gap-1 rounded-lg bg-neutral-100 text-xs font-semibold px-3 py-1.5"><X className="w-3.5 h-3.5" />{t('clubs.manage.reject')}</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {members.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-700 mb-2">{t('clubs.manage.members')}</h3>
              <ul className="space-y-2">
                {members.map((r) => (
                  <li key={r.id} className="flex items-center gap-2">
                    {person(r)}
                    <button type="button" disabled={busy === r.id} onClick={() => act(r.id, r.canWrite ? 'deny_write' : 'allow_write')}
                      className={`rounded-lg text-xs font-semibold px-3 py-1.5 ${r.canWrite ? 'bg-accent-100 text-accent-800' : 'bg-neutral-100'}`}>
                      {r.canWrite ? t('clubs.manage.denyWrite') : t('clubs.manage.allowWrite')}
                    </button>
                    <button type="button" disabled={busy === r.id} onClick={() => act(r.id, 'remove')} aria-label={t('clubs.manage.remove')} className="rounded-lg bg-red-50 text-red-700 p-1.5"><X className="w-4 h-4" /></button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
