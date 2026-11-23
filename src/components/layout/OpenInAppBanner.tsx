'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Smartphone, X } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { nativePlatform } from '@/lib/nativeApp';
import { APP_STORE_URL, androidIntentUrl, isAppPath, PLAY_STORE_URL } from '@/lib/appLinks';

const KEY = 'svoi:openAppDismissed';
const WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Смуга «Відкрити в застосунку» для відвідувача мобільного браузера на сторінках, якими діляться (рілс, допис, профіль, оголошення).
 * Android: кнопка відкриває застосунок через intent або веде в Google Play. iPhone: App Store (коли задано NEXT_PUBLIC_APP_STORE_URL).
 * Усередині самого застосунку не показується.
 */
export function OpenInAppBanner() {
  const { t } = useI18n();
  const pathname = usePathname() || '/';
  const [kind, setKind] = useState<'android' | 'ios' | null>(null);

  useEffect(() => {
    try {
      if (nativePlatform() !== 'web' || !isAppPath(pathname)) { setKind(null); return; }
      const ts = Number(localStorage.getItem(KEY) || 0);
      if (ts && Date.now() - ts < WEEK) { setKind(null); return; }
      const ua = navigator.userAgent;
      if (/Android/i.test(ua)) setKind('android');
      else if (/iPhone|iPad|iPod/i.test(ua) && APP_STORE_URL) setKind('ios');
      else setKind(null);
    } catch { setKind(null); }
  }, [pathname]);

  if (!kind) return null;
  const href = kind === 'android' ? androidIntentUrl(`${pathname}${typeof window !== 'undefined' ? window.location.search : ''}`) : APP_STORE_URL;
  const dismiss = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch { /* ignore */ } setKind(null); };

  return (
    <div className="md:hidden flex items-center gap-3 bg-[#0a1f44] px-3 py-2 pt-[calc(0.5rem+var(--safe-area-inset-top,0px))] text-white" role="region" aria-label={t('feed.openApp.title')}>
      <button type="button" onClick={dismiss} aria-label={t('cabinet.create.close')} className="shrink-0 p-1.5 text-white/70"><X className="h-4 w-4" /></button>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-neutral-900"><Smartphone className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-bold">{t('feed.openApp.title')}</p>
        <p className="truncate text-xs text-white/70">{t('feed.openApp.hint')}</p>
      </div>
      <a href={href} className="shrink-0 rounded-full bg-primary-500 px-4 py-2 text-sm font-extrabold text-neutral-900 active:scale-95 transition">{t('feed.openApp.action')}</a>
    </div>
  );
}
