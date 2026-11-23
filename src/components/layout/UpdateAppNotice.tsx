'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { nativePlatform, shellOutdated } from '@/lib/nativeApp';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/appLinks';

const KEY = 'svoi:updateNoticeDismissed';
const DAY = 24 * 60 * 60 * 1000;

/** Смуга для старої збірки застосунку (без дозволів камери): попереджає про «Зробити фото» і веде до оновлення. */
export function UpdateAppNotice() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      if (!shellOutdated()) return;
      const ts = Number(localStorage.getItem(KEY) || 0);
      setShow(!ts || Date.now() - ts > DAY);
    } catch { setShow(false); }
  }, []);
  if (!show) return null;
  const href = nativePlatform() === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
  const dismiss = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch { /* ignore */ } setShow(false); };
  return (
    <div className="flex items-start gap-3 bg-amber-50 border-b border-amber-200 px-3 py-2 pt-[calc(0.5rem+var(--safe-area-inset-top,0px))] text-amber-900" role="status">
      <Download className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="min-w-0 flex-1 text-xs leading-snug">{t('feed.updateApp.text')}{href ? <> <a href={href} className="font-bold underline">{t('feed.updateApp.action')}</a></> : null}</p>
      <button type="button" onClick={dismiss} aria-label={t('cabinet.create.close')} className="shrink-0 p-1"><X className="h-4 w-4" /></button>
    </div>
  );
}
