'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { useToast } from '@/components/ui/Toast';
import { localizedPath } from '@/i18n/routes';
import { PubState, dismissPublish, getPublish, retryPublish, subscribePublish } from '@/lib/publishQueue';

/** Плашка фонової публікації: прогрес завантаження, «Опубліковано» або помилка з кнопкою «Повторити». Студія при цьому вже закрита. */
export function PublishBar() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const [s, setS] = useState<PubState | null>(getPublish());

  useEffect(() => subscribePublish(() => { const v = getPublish(); setS(v ? { ...v } : null); }), []);

  // Не губимо завантаження, якщо людина закриває вкладку під час публікації
  useEffect(() => {
    if (s?.status !== 'running') return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [s?.status]);

  const status = s?.status;
  const kind = s?.kind;
  const go = s?.go;
  useEffect(() => {
    if (status !== 'done') return;
    toast.success(t(kind === 'story' ? 'feed.stories.added' : 'cabinet.studio.published'));
    if (kind === 'story') window.dispatchEvent(new Event('svoi:stories-changed'));
    const here = window.location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
    // Якщо людина вже на потрібній сторінці — оновлюємо її, щоб новий допис одразу з’явився; інакше пропонуємо перейти
    const tm = setTimeout(() => {
      if (kind === 'post' && here === go) { window.location.reload(); return; }
      dismissPublish();
    }, kind === 'post' && here === go ? 900 : 7000);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (!s) return null;
  const phaseText = s.phase === 'processing' ? t('cabinet.studio.processing') : s.phase === 'saving' ? t('cabinet.studio.publishing') : `${t('cabinet.studio.uploading')} ${s.pct}%`;
  const here = typeof window !== 'undefined' ? (window.location.pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/') : '/';

  return (
    <div role="status" aria-live="polite" className="fixed left-3 right-3 z-[75] bottom-[calc(5rem+var(--safe-area-inset-bottom,0px))] lg:bottom-4 lg:left-auto lg:right-4 lg:w-96 rounded-2xl bg-white p-3 shadow-2xl ring-1 ring-black/10">
      <div className="flex items-center gap-3">
        {s.status === 'running' && <Loader2 className="h-5 w-5 shrink-0 animate-spin text-primary-600" />}
        {s.status === 'done' && <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />}
        {s.status === 'failed' && <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-neutral-900">
            {s.status === 'done' ? t(s.kind === 'story' ? 'feed.stories.added' : 'cabinet.studio.published') : s.status === 'failed' ? t('cabinet.studio.publishFailed') : phaseText}
          </p>
          {s.status === 'failed' && s.error && <p className="line-clamp-2 text-xs text-neutral-500">{s.error}</p>}
          {s.status === 'running' && (
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-neutral-200"><div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${Math.max(4, s.pct)}%` }} /></div>
          )}
        </div>
        {s.status === 'failed' && <button type="button" onClick={retryPublish} className="shrink-0 rounded-full bg-primary-500 px-3 py-1.5 text-sm font-extrabold text-neutral-900">{t('cabinet.studio.retryPublish')}</button>}
        {s.status === 'done' && s.go !== here && <button type="button" onClick={() => { router.push(localizedPath(s.go, locale)); dismissPublish(); }} className="shrink-0 rounded-full bg-primary-500 px-3 py-1.5 text-sm font-extrabold text-neutral-900">{t('cabinet.studio.view')}</button>}
        {s.status !== 'running' && <button type="button" onClick={dismissPublish} aria-label={t('cabinet.create.close')} className="shrink-0 rounded-full p-1.5 hover:bg-neutral-100"><X className="h-4 w-4" /></button>}
      </div>
    </div>
  );
}
