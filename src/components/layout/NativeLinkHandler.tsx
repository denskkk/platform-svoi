'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nativePlatform } from '@/lib/nativeApp';
import { isAppPath, SITE_URL } from '@/lib/appLinks';

/**
 * Усередині застосунку: коли користувач натиснув посилання сайту (universal/app link), оболонка запускається на головній —
 * тут переходимо на потрібну сторінку (рілс, профіль...). Працює, коли в застосунок додано плагін @capacitor/app
 * (npm install @capacitor/app && npx cap sync); без плагіна нічого не робить.
 */
export function NativeLinkHandler() {
  const router = useRouter();
  useEffect(() => {
    if (nativePlatform() === 'web') return;
    const App = (window as any).Capacitor?.Plugins?.App;
    if (!App?.addListener) return;
    const host = new URL(SITE_URL).host;
    const go = (raw?: string) => {
      try {
        if (!raw) return;
        const u = new URL(raw);
        if (u.host !== host || !isAppPath(u.pathname)) return;
        router.push(`${u.pathname}${u.search}`);
      } catch { /* ignore */ }
    };
    let handle: { remove?: () => void } | undefined;
    Promise.resolve(App.addListener('appUrlOpen', (e: { url?: string }) => go(e?.url))).then((h: any) => { handle = h; }).catch(() => undefined);
    Promise.resolve(App.getLaunchUrl?.()).then((r: { url?: string } | undefined) => go(r?.url)).catch(() => undefined);
    return () => { try { handle?.remove?.(); } catch { /* ignore */ } };
  }, [router]);
  return null;
}
