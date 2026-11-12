'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { authHeaders } from '@/lib/feedClient';

/** Дзвіночок зі значком кількості непрочитаних; оновлюється раз на хвилину та при поверненні у застосунок. */
export function NotificationBell({ className = '' }: { className?: string }) {
  const { t } = useI18n();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?countOnly=1', { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setCount(Number(data.unreadCount) || 0);
    } catch {
      /* мережа недоступна — тихо ігноруємо */
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => { if (document.visibilityState === 'visible') refresh(); }, 60_000);
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    const onChanged = () => refresh();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('notifications:changed', onChanged);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('notifications:changed', onChanged);
    };
  }, [refresh]);

  return (
    <Link href="/notifications" aria-label={t('feed.notifications.title')} className={`relative p-2 hover:bg-neutral-100 rounded-lg transition-colors ${className}`}>
      <Bell className="w-5 h-5 text-neutral-600" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[11px] leading-none rounded-full bg-red-500 text-white border-2 border-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
