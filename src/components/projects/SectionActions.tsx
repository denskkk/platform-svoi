'use client';

import { useState } from 'react';
import { useI18n } from '@/i18n/client';
import { FieldsForm } from './FieldsForm';
import { MyRequests } from './MyRequests';

/**
 * Кнопки-заявки над каталогом розділу («Подати заявку на консультацію», «Приєднатися до команди», «Мої заявки»…).
 * Суфікс «!» в описі папки — форму відкрито одразу.
 */
export function SectionActions({ projectSlug, acts, label }: { projectSlug: string; acts: string[]; label: string }) {
  const { t } = useI18n();
  const ids = acts.map((a) => a.replace('!', ''));
  const [open, setOpen] = useState<string | null>(acts.find((a) => a.endsWith('!'))?.replace('!', '') ?? null);
  const btn = 'rounded-xl px-3 py-2.5 text-sm font-semibold text-center transition active:scale-95';
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ids.map((id) => (
          <button key={id} type="button" onClick={() => setOpen(open === id ? null : id)} aria-pressed={open === id}
            className={`${btn} ${open === id ? 'bg-primary-500 text-white' : 'bg-white text-neutral-900 shadow-sm hover:shadow-md'}`}>
            {t(`projects.f.${id}.title`)}
          </button>
        ))}
      </div>
      {open === 'mine' && <MyRequests projectSlug={projectSlug} />}
      {open && open !== 'mine' && (
        <div className="space-y-2">
          <p className="rounded-xl bg-black/30 backdrop-blur text-sm font-semibold text-white px-3 py-2">{t(`projects.f.${open}.title`)}: {label}</p>
          <FieldsForm key={open} projectSlug={projectSlug} formId={open} label={label} onSent={() => setOpen(null)} />
        </div>
      )}
    </div>
  );
}
