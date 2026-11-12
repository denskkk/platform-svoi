'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/client';
import { authHeaders, readStoredUser } from '@/lib/feedClient';

interface Access { isAdmin: boolean; role: string | null; permissions: string[] }

const SECTIONS = [
  { key: 'listings', href: '/admin/listings', icon: '📋', perms: ['listings.moderate'] },
  { key: 'business', href: '/admin/business-applications', icon: '🏢', perms: ['business.review'] },
  { key: 'partners', href: '/admin/partners', icon: '🤝', perms: ['partners.review', 'content.edit'] },
  { key: 'reports', href: '/admin/reports', icon: '🚩', perms: ['reports.handle'] },
];

export default function StaffHubPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [access, setAccess] = useState<Access | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!readStoredUser()) { router.replace('/auth/login?returnUrl=/admin/staff'); return; }
    (async () => {
      try {
        const res = await fetch('/api/admin/me', { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
        if (res.ok) setAccess(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const visible = access ? SECTIONS.filter((s) => s.perms.some((p) => access.permissions.includes(p))) : [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-xl px-3 sm:px-4 pt-4 pb-28 md:pb-10 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('staff.hub.title')}</h1>
          <p className="text-sm text-neutral-500">{t('staff.hub.subtitle')}</p>
        </div>
        {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
        {!loading && (!access || visible.length === 0) && (
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-center text-neutral-600">{t('staff.hub.noAccess')}</div>
        )}
        {access && visible.length > 0 && (
          <>
            <p className="text-sm text-neutral-600">{t('staff.hub.role')}: <b>{access.isAdmin ? t('staff.hub.fullAdmin') : t(`staff.roles.${access.role}`)}</b></p>
            <ul className="space-y-2">
              {visible.map((s) => (
                <li key={s.key}>
                  <Link href={s.href} className="flex items-center gap-3 rounded-2xl bg-white border border-neutral-200/70 p-4 hover:border-primary-300 transition">
                    <span className="text-2xl" aria-hidden>{s.icon}</span>
                    <span className="font-semibold text-neutral-900">{t(`staff.hub.sections.${s.key}`)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
