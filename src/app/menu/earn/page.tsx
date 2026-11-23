'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { MenuGroup, MenuRow, MenuShell } from '@/components/cabinet/MenuShell';
import { useI18n } from '@/i18n/client';

interface Project { slug: string; icon: string | null; nameUk: string; nameEn: string; status: string }

/** «Заробляти зі своїми»: коротко як це працює + окрема сторінка для кожного проєкту. */
export default function EarnHubPage() {
  const { t, locale } = useI18n();
  const [projects, setProjects] = useState<Project[] | null>(null);
  useEffect(() => {
    fetch('/api/projects', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : { projects: [] })).then((d) => setProjects(d.projects || [])).catch(() => setProjects([]));
  }, []);

  return (
    <MenuShell title={t('cabinet.earn.title')}>
      <section className="rounded-3xl p-5 text-white bg-gradient-to-br from-[#0b2a6b] via-[#123b8f] to-[#0a1f44] shadow-lg">
        <p className="text-sm text-white/90">{t('cabinet.earn.intro')}</p>
        <ol className="mt-4 space-y-2.5 text-sm">
          {['s1', 's2', 's3'].map((k, i) => (
            <li key={k} className="flex gap-3"><span className="shrink-0 w-6 h-6 rounded-full bg-primary-500 text-neutral-900 font-bold text-xs flex items-center justify-center">{i + 1}</span><span>{t(`cabinet.earn.${k}`)}</span></li>
          ))}
        </ol>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link href="/menu/qr" className="rounded-xl bg-primary-500 text-neutral-900 font-bold text-center py-2.5 text-sm">{t('cabinet.balance.invite')}</Link>
          <Link href="/menu/balance" className="rounded-xl bg-white/15 text-white font-bold text-center py-2.5 text-sm">{t('cabinet.balance.title')}</Link>
        </div>
      </section>

      <div>
        <h2 className="font-bold text-neutral-900 px-1">{t('cabinet.earn.byProject')}</h2>
        <p className="text-xs text-neutral-500 px-1 mb-2">{t('cabinet.earn.byProjectHint')}</p>
        {projects === null ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div> : projects.length === 0 ? (
          <p className="text-sm text-neutral-500 px-1">{t('cabinet.earn.none')}</p>
        ) : (
          <MenuGroup>
            {projects.map((p) => (
              <MenuRow key={p.slug} href={`/projects/${p.slug}/earn`} icon={<span className="text-xl">{p.icon || '✨'}</span>} label={(locale === 'uk' ? p.nameUk : p.nameEn) || p.nameUk} />
            ))}
          </MenuGroup>
        )}
      </div>
    </MenuShell>
  );
}
