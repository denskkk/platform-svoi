'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/i18n/client';
import { authHeaders, readStoredUser } from '@/lib/feedClient';

/** Посилання на кабінет персоналу для співробітників із роллю (модератор тощо). Повні адміністратори мають /admin. */
export function StaffLink({ className, onClick, icon }: { className: string; onClick?: () => void; icon?: string }) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const user = readStoredUser();
    if (!user) return;
    const key = `staffAccess:${user.id}`;
    try {
      const cached = sessionStorage.getItem(key);
      if (cached !== null) { setShow(cached === '1'); return; }
    } catch { /* sessionStorage недоступний */ }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/me', { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const ok = !data.isAdmin && Array.isArray(data.permissions) && data.permissions.length > 0;
        try { sessionStorage.setItem(key, ok ? '1' : '0'); } catch { /* ignore */ }
        if (!cancelled) setShow(ok);
      } catch { /* мережева помилка — просто не показуємо */ }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!show) return null;
  return (
    <Link href="/admin/staff" className={className} onClick={onClick}>
      {icon && <span className="text-xl mr-3">{icon}</span>}
      {icon ? <span>{t('staff.manage.hubLink')}</span> : t('staff.manage.hubLink')}
    </Link>
  );
}
