'use client';

import { Info, Lightbulb, Mail, ShieldCheck } from 'lucide-react';
import { MenuGroup, MenuRow, MenuShell } from '@/components/cabinet/MenuShell';
import { useI18n } from '@/i18n/client';

/** «Про нас і нашу ідею»: кілька розділів, у кожному своя сторінка. */
export default function AboutHubPage() {
  const { t } = useI18n();
  return (
    <MenuShell title={t('cabinet.about.title')}>
      <MenuGroup>
        <MenuRow href="/menu/about/idea" icon={<Lightbulb className="w-5 h-5" />} label={t('cabinet.about.items.idea')} />
        <MenuRow href="/menu/about/plans" icon={<Info className="w-5 h-5" />} label={t('cabinet.about.items.plans')} />
        <MenuRow href="/menu/about/safety" icon={<ShieldCheck className="w-5 h-5" />} label={t('cabinet.about.items.safety')} />
        <MenuRow href="/menu/about/contacts" icon={<Mail className="w-5 h-5" />} label={t('cabinet.about.items.contacts')} />
      </MenuGroup>
    </MenuShell>
  );
}
