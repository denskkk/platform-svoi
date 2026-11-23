'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';
import { RepPerson } from '@/lib/rep';

interface App {
  id: number; kind: string; placeName: string | null; message: string; phone?: string; specialization: string | null; status: string;
  unit: { id: number; name: string; level: string } | null; applicant?: RepPerson | null;
}

/** Кабінет керівника: його представництва, заявки до нього (прийняти / відхилити) і власні заявки. */
export default function LeaderCabinetPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useI18n();
  const toast = useToast();
  const [mine, setMine] = useState<{ units: { id: number; name: string; level: string; flag: string | null }[]; pending: number } | null>(null);
  const [inbox, setInbox] = useState<App[]>([]);
  const [out, setOut] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const h = { credentials: 'include' as const, headers: authHeaders(), cache: 'no-store' as const };
      const [m, i, o] = await Promise.all([
        fetch(`/api/rep/mine?project=${encodeURIComponent(slug)}`, h),
        fetch('/api/rep/applications?box=in', h),
        fetch('/api/rep/applications?box=out', h),
      ]);
      if (m.ok) setMine(await m.json());
      if (i.ok) setInbox((await i.json()).applications);
      if (o.ok) setOut((await o.json()).applications);
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  useEffect(() => { load(); }, [load]);

  const decide = async (id: number, status: 'accepted' | 'rejected') => {
    if (busy) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/rep/applications/${id}`, { method: 'PATCH', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ status }) });
      if (!res.ok) throw new Error();
      toast.success(t('projects.rep.leaderPage.done'));
      await load();
    } catch { toast.error(t('feed.toast.actionFailed')); } finally { setBusy(null); }
  };

  const pending = inbox.filter((a) => a.status === 'new');
  const card = 'rounded-2xl bg-white p-3 shadow-md space-y-1';
  return (
    <div className="min-h-screen bg-neutral-100 py-6">
      <div className="max-w-3xl mx-auto px-3 sm:px-4 space-y-4">
        <Link href={`/projects/${slug}`} className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-700"><ArrowLeft className="w-4 h-4" />{t('projects.rep.leaderPage.back')}</Link>
        <h1 className="text-2xl font-bold text-neutral-900">{t('projects.rep.leaderPage.title')}</h1>
        {loading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}

        {!loading && (
          <>
            <section className="space-y-2">
              <h2 className="font-semibold text-neutral-800">{t('projects.rep.leaderPage.mine')}</h2>
              {mine && mine.units.length === 0 && <p className="text-sm text-neutral-600">{t('projects.rep.leaderPage.none')}</p>}
              <ul className="space-y-2">
                {mine?.units.map((u) => (
                  <li key={u.id}>
                    <Link href={`/projects/${slug}?folder=network&unit=${u.id}`} className={`${card} block`}>
                      <span className="font-bold text-neutral-900">{u.flag ? `${u.flag} ` : ''}{u.name}</span>
                      <span className="block text-xs text-neutral-500">{t(`projects.rep.levels.${u.level}`)} · {t('projects.rep.leaderPage.open')} →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {mine && mine.units.length > 0 && (
              <section className="space-y-2">
                <h2 className="font-semibold text-neutral-800">{t('projects.rep.leaderPage.inbox')}{pending.length > 0 ? ` (${pending.length})` : ''}</h2>
                {pending.length === 0 && <p className="text-sm text-neutral-600">{t('projects.rep.leaderPage.inboxEmpty')}</p>}
                <ul className="space-y-2">
                  {pending.map((a) => (
                    <li key={a.id} className={card}>
                      <p className="text-sm font-bold text-neutral-900">{t(`projects.rep.kinds.${a.kind}`)} · {a.applicant?.name}</p>
                      <p className="text-xs text-neutral-500">{[a.unit?.name, a.placeName, a.specialization].filter(Boolean).join(' · ')}</p>
                      <p className="text-sm text-neutral-800 whitespace-pre-line">{a.message}</p>
                      {a.phone && <p className="text-xs text-neutral-600">{t('projects.rep.leaderPage.phone')}: <a className="font-semibold text-primary-700" href={`tel:${a.phone}`}>{a.phone}</a></p>}
                      <div className="flex gap-2 pt-1">
                        <button type="button" disabled={busy === a.id} onClick={() => decide(a.id, 'accepted')} className="rounded-full bg-primary-500 hover:bg-primary-600 font-bold px-4 py-1.5 text-sm disabled:opacity-50">{t('projects.rep.leaderPage.accept')}</button>
                        <button type="button" disabled={busy === a.id} onClick={() => decide(a.id, 'rejected')} className="rounded-full bg-neutral-100 font-semibold px-4 py-1.5 text-sm text-neutral-700 disabled:opacity-50">{t('projects.rep.leaderPage.reject')}</button>
                        {a.applicant && <Link href={`/profile/${a.applicant.id}`} className="ml-auto self-center text-sm font-semibold text-primary-700">{t('projects.rep.profileShort')}</Link>}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="space-y-2">
              <h2 className="font-semibold text-neutral-800">{t('projects.rep.leaderPage.myApps')}</h2>
              {out.length === 0 && <p className="text-sm text-neutral-600">{t('projects.rep.leaderPage.myEmpty')}</p>}
              <ul className="space-y-2">
                {out.map((a) => (
                  <li key={a.id} className={card}>
                    <p className="text-sm font-bold text-neutral-900">{t(`projects.rep.kinds.${a.kind}`)}</p>
                    <p className="text-xs text-neutral-500">{[a.unit?.name, a.placeName].filter(Boolean).join(' · ')} · {t(`projects.rep.leaderPage.status.${a.status}`)}</p>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
