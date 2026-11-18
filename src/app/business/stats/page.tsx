'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { useMoney } from '@/components/deals/DealStatus';
import { useI18n } from '@/i18n/client';
import { Building2 } from 'lucide-react';
import { authHeaders, readStoredUser } from '@/lib/feedClient';

interface Stats {
  audience: { followers: number; newFollowers30: number; favorites: number };
  content: { posts: number; likes: number; comments: number };
  listings: { active: number; views: number; clicks: number; clicks30: number };
  deals: { total: number; closed: number; turnover: number; commissions: number; open: number; disputed: number };
  program: { percent: number; status: string } | null;
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white border border-neutral-200/70 p-4">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}

/** Кабінет бізнесу: показники аудиторії, публікацій, оголошень і угод. */
export default function BusinessStatsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const money = useMoney();
  const [stats, setStats] = useState<Stats | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'none' | 'error'>('loading');

  useEffect(() => {
    if (!readStoredUser()) { router.replace('/auth/login?returnUrl=/business/stats'); return; }
    (async () => {
      try {
        const res = await fetch('/api/business-stats', { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
        if (res.status === 404) { setState('none'); return; }
        if (!res.ok) throw new Error();
        setStats(await res.json());
        setState('ready');
      } catch { setState('error'); }
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="mx-auto w-full max-w-2xl px-3 sm:px-4 pt-4 pb-28 md:pb-10 space-y-5">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-neutral-900">{t('business.stats.title')}</h1>
          <Link href="/business/clients" className="text-sm font-semibold text-primary-700 hover:underline">{t('business.stats.clients')}</Link>
        </div>
        {state === 'loading' && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
        {state === 'error' && <p className="text-center text-sm text-red-600 py-6">{t('business.stats.failed')}</p>}
        {state === 'none' && <EmptyState icon={Building2} title={t('business.stats.noCompany')} description={t('business.stats.noCompanyHint')} actionLabel={t('business.stats.apply')} actionHref="/business/apply" />}
        {state === 'ready' && stats && (
          <>
            <section className="space-y-2">
              <h2 className="font-semibold text-neutral-900">{t('business.stats.audience')}</h2>
              <div className="grid grid-cols-3 gap-3">
                <Card label={t('business.stats.followers')} value={stats.audience.followers} />
                <Card label={t('business.stats.newFollowers')} value={stats.audience.newFollowers30} />
                <Card label={t('business.stats.favorites')} value={stats.audience.favorites} />
              </div>
            </section>
            <section className="space-y-2">
              <h2 className="font-semibold text-neutral-900">{t('business.stats.content')}</h2>
              <div className="grid grid-cols-3 gap-3">
                <Card label={t('business.stats.posts')} value={stats.content.posts} />
                <Card label={t('business.stats.likes')} value={stats.content.likes} />
                <Card label={t('business.stats.comments')} value={stats.content.comments} />
              </div>
            </section>
            <section className="space-y-2">
              <h2 className="font-semibold text-neutral-900">{t('business.stats.listings')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card label={t('business.stats.activeListings')} value={stats.listings.active} />
                <Card label={t('business.stats.views')} value={stats.listings.views} />
                <Card label={t('business.stats.clicks')} value={stats.listings.clicks} />
                <Card label={t('business.stats.clicks30')} value={stats.listings.clicks30} />
              </div>
            </section>
            <section className="space-y-2">
              <h2 className="font-semibold text-neutral-900">{t('business.stats.deals')}</h2>
              {stats.program ? <p className="text-sm text-neutral-600">{t('business.stats.program', { percent: stats.program.percent })}</p> : <p className="text-sm text-neutral-500">{t('business.stats.noProgram')}</p>}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Card label={t('business.stats.openDeals')} value={stats.deals.open} />
                <Card label={t('business.stats.closedDeals')} value={stats.deals.closed} />
                <Card label={t('business.stats.disputed')} value={stats.deals.disputed} />
                <Card label={t('business.stats.turnover')} value={money(stats.deals.turnover)} />
                <Card label={t('business.stats.commissions')} value={money(stats.deals.commissions)} />
              </div>
            </section>
            <p className="text-center"><Link href={`/companies/${readStoredUser()?.id ?? ''}/qr`} className="text-sm font-semibold text-primary-700 hover:underline">{t('business.stats.qr')}</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
