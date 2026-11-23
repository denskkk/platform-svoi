'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { MenuShell } from '@/components/cabinet/MenuShell';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useI18n } from '@/i18n/client';
import { authHeaders } from '@/lib/feedClient';

interface Viewer { id: number; name: string; avatarUrl: string | null; at: string }

/** Хто заходив до мого профілю за 30 днів. */
export default function ViewersPage() {
  const { t, locale } = useI18n();
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [enabled, setEnabled] = useState(true);
  const [viewers, setViewers] = useState<Viewer[]>([]);

  const load = () => {
    setState('loading');
    fetch('/api/profile-views', { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setEnabled(d.enabled !== false); setViewers(d.viewers || []); setState('ready'); })
      .catch(() => setState('error'));
  };
  useEffect(load, []);

  return (
    <MenuShell title={t('cabinet.viewers.title')}>
      {state === 'loading' && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
      {state === 'error' && <div className="rounded-2xl bg-white border border-red-100 p-5 text-center space-y-3"><p className="text-sm text-red-600">{t('cabinet.shell.error')}</p><button onClick={load} className="rounded-full bg-primary-500 text-white font-semibold px-5 py-2 text-sm">{t('cabinet.shell.retry')}</button></div>}
      {state === 'ready' && !enabled && (
        <div className="rounded-2xl bg-white border border-neutral-200 p-5 text-center space-y-3">
          <p className="text-sm text-neutral-700">{t('cabinet.viewers.disabled')}</p>
          <Link href="/menu/settings/privacy" className="inline-block rounded-full bg-primary-500 font-bold px-5 py-2 text-sm">{t('cabinet.viewers.settings')}</Link>
        </div>
      )}
      {state === 'ready' && enabled && (
        <>
          <p className="text-xs text-neutral-500 px-1">{t('cabinet.viewers.note')}</p>
          {viewers.length === 0 ? (
            <div className="rounded-2xl bg-white border border-neutral-200 p-6 text-center text-sm text-neutral-600">{t('cabinet.viewers.empty')}</div>
          ) : (
            <ul className="rounded-2xl bg-white border border-neutral-200/70 shadow-sm divide-y divide-neutral-100 overflow-hidden">
              {viewers.map((v) => (
                <li key={v.id}>
                  <Link href={`/profile/${v.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50">
                    <UserAvatar src={v.avatarUrl} alt={v.name} fallbackName={v.name} className="w-10 h-10 rounded-full" />
                    <span className="min-w-0 flex-1 font-semibold text-neutral-900 truncate">{v.name}</span>
                    <span className="text-xs text-neutral-500">{new Date(v.at).toLocaleDateString(locale)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </MenuShell>
  );
}
