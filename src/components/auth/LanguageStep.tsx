'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Check, Globe } from 'lucide-react';
import { Locale, localeLabels, locales } from '@/i18n/config';
import { useI18n } from '@/i18n/client';
import { switchLocalePath } from '@/i18n/routes';
import { setLocaleCookie } from '@/components/ui/LanguageSwitcher';

export const LANG_CHOSEN_KEY = 'svoi_lang_chosen';

const NATIVE: Record<Locale, string> = { uk: 'Українська', en: 'English', ru: 'Русский', cs: 'Čeština', pl: 'Polski', de: 'Deutsch' }; // i18n-ignore
const FLAG: Record<Locale, string> = { uk: '🇺🇦', en: '🇬🇧', ru: '🇷🇺', cs: '🇨🇿', pl: '🇵🇱', de: '🇩🇪' };

/** Екран вибору мови перед реєстрацією (як у TikTok): список мов, галочка біля обраної, кнопка «Продовжити». Мова застосовується одразу. */
/** Мови, які не показуємо одразу: відкриваються лише за пунктом «Інші мови» внизу */
const HIDDEN: Locale[] = ['ru'];

export function LanguageStep({ onDone }: { onDone: () => void }) {
  const { locale, t } = useI18n();
  const pathname = usePathname() || '/';
  const [selected, setSelected] = useState<Locale>(locale);
  const [more, setMore] = useState(locale === 'ru');

  const apply = (target: Locale) => {
    setSelected(target);
    if (target === locale) return;
    // Одразу перемикаємо інтерфейс; повторно екран не показуємо
    try { localStorage.setItem(LANG_CHOSEN_KEY, '1'); } catch { /* ignore */ }
    setLocaleCookie(target);
    window.location.assign(switchLocalePath(pathname, target) + location.search);
  };

  const proceed = () => {
    try { localStorage.setItem(LANG_CHOSEN_KEY, '1'); } catch { /* ignore */ }
    apply(selected);
    if (selected === locale) onDone();
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="mx-auto w-full max-w-md flex-1 px-5 pt-14 pb-6">
        <Globe className="mx-auto h-10 w-10 text-primary-600" aria-hidden />
        <h1 className="mt-4 text-center text-2xl font-extrabold text-neutral-900">{t('auth.language.title')}</h1>
        <p className="mt-2 text-center text-sm text-neutral-500">{t('auth.language.subtitle')}</p>
        <ul className="mt-8 divide-y divide-neutral-200 rounded-2xl border border-neutral-200" role="radiogroup" aria-label={t('common.language.label')}>
          {locales.filter((code) => !HIDDEN.includes(code) || more).map((code) => (
            <li key={code}>
              <button type="button" role="radio" aria-checked={selected === code} lang={code} onClick={() => apply(code)}
                className="flex w-full items-center gap-3 px-4 py-4 text-left hover:bg-neutral-50">
                <span className="text-2xl" aria-hidden>{FLAG[code]}</span>
                <span className="flex-1 text-[17px] font-semibold text-neutral-900">{NATIVE[code]}<span className="ml-2 text-sm font-normal text-neutral-400">{localeLabels[code] !== NATIVE[code] ? localeLabels[code] : ''}</span></span>
                {selected === code && <Check className="h-6 w-6 text-primary-600" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
        {!more && <button type="button" onClick={() => setMore(true)} className="mx-auto mt-4 block text-sm text-neutral-400 underline-offset-2 hover:underline">{t('auth.language.more')}</button>}
      </div>
      <div className="mx-auto w-full max-w-md px-5 pb-[calc(1.5rem+var(--safe-area-inset-bottom,0px))]">
        <button type="button" onClick={proceed} className="w-full rounded-full bg-primary-500 hover:bg-primary-600 py-3.5 text-lg font-extrabold text-neutral-900">{t('auth.language.continue')}</button>
        <p className="mt-3 text-center text-xs text-neutral-400">{t('auth.language.hint')}</p>
      </div>
    </div>
  );
}
