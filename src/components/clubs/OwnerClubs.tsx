'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { useI18n } from '@/i18n/client';

interface ClubItem { id: number; name: string; description: string | null; joinMode: string; membersCount: number; joined: boolean }

/** Групи та школи, які веде бізнес чи спеціаліст (тренер, лікар, громада): вступ вільний або за заявкою. */
export function OwnerClubs({ ownerId }: { ownerId: number }) {
  const { t } = useI18n();
  const [items, setItems] = useState<ClubItem[]>([]);

  useEffect(() => {
    let off = false;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    fetch(`/api/clubs?owner=${ownerId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => (r.ok ? r.json() : { clubs: [] }))
      .then((d) => { if (!off) setItems(Array.isArray(d.clubs) ? d.clubs : []); })
      .catch(() => {});
    return () => { off = true; };
  }, [ownerId]);

  if (items.length === 0) return null;
  return (
    <section className="bg-white rounded-2xl shadow-sm p-4 space-y-2">
      <h2 className="font-semibold text-neutral-900">{t('companies.groups.title')}</h2>
      <ul className="space-y-2">
        {items.map((g) => (
          <li key={g.id}>
            <Link href={`/clubs/${g.id}`} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3 hover:bg-neutral-50">
              <span className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center shrink-0"><Users className="w-5 h-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-neutral-900 truncate">{g.name}</span>
                <span className="block text-xs text-neutral-500">{g.membersCount} {t('companies.groups.members')} · {g.joined ? t('companies.groups.joined') : g.joinMode === 'approval' ? t('companies.groups.byRequest') : t('companies.groups.open')}</span>
              </span>
              <span className="text-sm font-semibold text-primary-700">{t('companies.groups.view')}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
