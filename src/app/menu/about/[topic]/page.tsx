'use client';

import { useParams } from 'next/navigation';
import { MenuGroup, MenuRow, MenuShell } from '@/components/cabinet/MenuShell';
import { useI18n } from '@/i18n/client';

const TOPICS = ['idea', 'plans', 'safety', 'contacts'] as const;
const LINKS: Record<string, { href: string; key: string }[]> = {
  safety: [{ href: '/privacy', key: 'docs' }, { href: '/terms-of-use', key: 'terms' }],
  contacts: [{ href: '/contacts', key: 'contacts' }, { href: '/support', key: 'support' }],
};

export default function AboutTopicPage() {
  const { t } = useI18n();
  const { topic } = useParams<{ topic: string }>();
  const known = (TOPICS as readonly string[]).includes(topic);
  const paragraphs = topic === 'contacts' ? ['p1'] : ['p1', 'p2'];
  return (
    <MenuShell title={known ? t(`cabinet.about.${topic}.title`) : t('cabinet.about.title')} backHref="/menu/about">
      {known && (
        <>
          <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-sm p-5 space-y-3">
            {paragraphs.map((k) => <p key={k} className="text-[15px] leading-relaxed text-neutral-800">{t(`cabinet.about.${topic}.${k}`)}</p>)}
          </div>
          {LINKS[topic] && (
            <MenuGroup>
              {LINKS[topic].map((l) => <MenuRow key={l.href} href={l.href} label={t(`cabinet.about.${topic}.${l.key}`)} />)}
            </MenuGroup>
          )}
        </>
      )}
    </MenuShell>
  );
}
