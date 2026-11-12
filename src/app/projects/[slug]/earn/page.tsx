'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { authHeaders, jsonHeaders, readStoredUser } from '@/lib/feedClient';

interface EarnData {
  page: { titleUk: string; titleEn: string; bodyUk: string; bodyEn: string } | null;
  application: { id: number; status: 'pending' | 'approved' | 'rejected'; rejectReason: string | null } | null;
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-primary-50 text-primary-900',
  approved: 'bg-green-50 text-green-800',
  rejected: 'bg-red-50 text-red-700',
};
const inputCls = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary-400';

export default function EarnPage() {
  const params = useParams<{ slug: string }>();
  const { t, locale } = useI18n();
  const toast = useToast();
  const [data, setData] = useState<EarnData | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const [loggedIn, setLoggedIn] = useState(false);
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [reapply, setReapply] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${params.slug}/earn`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (res.status === 404) { setState('missing'); return; }
      if (!res.ok) throw new Error();
      setData(await res.json());
      setState('ready');
    } catch {
      setState('error');
    }
  }, [params.slug]);

  useEffect(() => { setLoggedIn(!!readStoredUser()); load(); }, [load]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/partner-applications', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ projectSlug: params.slug, phone, message }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(body.error || t('projects.earn.failed')); return; }
      toast.success(t('projects.earn.success'));
      setPhone(''); setMessage(''); setReapply(false);
      await load();
    } catch {
      toast.error(t('projects.earn.failed'));
    } finally {
      setSending(false);
    }
  };

  const title = (locale === 'uk' ? data?.page?.titleUk : data?.page?.titleEn) || data?.page?.titleUk || t('projects.earn.title');
  const body = (locale === 'uk' ? data?.page?.bodyUk : data?.page?.bodyEn) || data?.page?.bodyUk || t('projects.earn.defaultBody');
  const app = data?.application;
  const formVisible = !app || (app.status === 'rejected' && reapply);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-xl px-3 sm:px-4 pt-4 pb-28 md:pb-10 space-y-4">
        <Link href={`/projects/${params.slug}`} className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-700">
          <ArrowLeft className="w-4 h-4" /> {t('projects.earn.back')}
        </Link>

        {state === 'loading' && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
        {state === 'missing' && <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-center text-neutral-600">{t('projects.notFound')}</div>}
        {state === 'error' && <div className="bg-white rounded-2xl border border-red-100 p-6 text-center text-sm text-red-600">{t('projects.earn.loadFailed')}</div>}

        {state === 'ready' && (
          <>
            <article className="bg-white rounded-3xl border border-neutral-200/70 shadow-sm p-5 space-y-3">
              <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
              <p className="text-[15px] leading-relaxed text-neutral-800 whitespace-pre-wrap break-words">{body}</p>
            </article>

            {app && (
              <section className={cn('rounded-2xl p-4 space-y-1 border border-neutral-200/70', STATUS_STYLE[app.status])}>
                <p className="text-xs uppercase tracking-wide opacity-70">{t('projects.earn.statusTitle')}</p>
                <p className="font-semibold">{t(`projects.earn.status.${app.status}`)}</p>
                {app.status === 'pending' && <p className="text-sm">{t('projects.earn.pendingHint')}</p>}
                {app.status === 'approved' && <p className="text-sm">{t('projects.earn.approvedHint')}</p>}
                {app.status === 'rejected' && app.rejectReason && <p className="text-sm">{t('projects.earn.reason')}: {app.rejectReason}</p>}
                {app.status === 'rejected' && !reapply && (
                  <button type="button" onClick={() => setReapply(true)} className="mt-1 rounded-full bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-5 py-2">{t('projects.earn.reapply')}</button>
                )}
              </section>
            )}

            {!loggedIn && (
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-center space-y-3">
                <p className="text-neutral-700">{t('projects.earn.loginRequired')}</p>
                <Link href={`/auth/login?returnUrl=/projects/${params.slug}/earn`} className="inline-block rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-2.5">{t('projects.earn.login')}</Link>
              </div>
            )}

            {loggedIn && formVisible && (
              <form onSubmit={submit} className="bg-white rounded-2xl border border-neutral-200/70 shadow-sm p-4 space-y-3">
                <h2 className="font-semibold text-neutral-900">{t('projects.earn.applyTitle')}</h2>
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-neutral-700">{t('projects.earn.phone')}</span>
                  <input className={inputCls} type="tel" inputMode="tel" required maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-neutral-700">{t('projects.earn.message')}</span>
                  <textarea className={inputCls} rows={4} required minLength={10} maxLength={2000} value={message} onChange={(e) => setMessage(e.target.value)} />
                  <span className="text-xs text-neutral-400">{t('projects.earn.messageHint')}</span>
                </label>
                <button type="submit" disabled={sending} className="w-full rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 disabled:opacity-60 flex items-center justify-center gap-2">
                  {sending && <Loader2 className="w-4 h-4 animate-spin" />}{sending ? t('projects.earn.sending') : t('projects.earn.submit')}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
