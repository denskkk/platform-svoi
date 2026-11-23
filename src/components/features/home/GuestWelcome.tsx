'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Clapperboard, Globe, Newspaper, Store, Users } from 'lucide-react';
import { useAuthStatus } from '@/components/ui/AuthGate';
import { LANG_CHOSEN_KEY, LanguageStep } from '@/components/auth/LanguageStep';
import { useI18n } from '@/i18n/client';
import { localeLabels } from '@/i18n/config';

/**
 * Перший екран для тих, хто ще не увійшов (і в застосунку, і на сайті): спочатку вибір мови, потім «Зареєструватися / Увійти».
 * Стрічку гості не бачать: соцмережа відкривається лише після реєстрації. Авторизованих HomeRedirect відправляє у стрічку.
 */
export function GuestWelcome() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { status } = useAuthStatus();
  const [langStep, setLangStep] = useState(false);

  useEffect(() => { try { if (!localStorage.getItem(LANG_CHOSEN_KEY)) setLangStep(true); } catch { /* ignore */ } }, []);
  useEffect(() => { if (status === 'authed') router.replace('/feed'); }, [status, router]);

  if (status === 'authed') return <div className="fixed inset-0 z-[60] bg-white" aria-hidden />;
  if (langStep) return <div className="fixed inset-0 z-[60] overflow-y-auto bg-white"><LanguageStep onDone={() => setLangStep(false)} /></div>;

  const points = [
    { icon: Newspaper, text: t('home.welcome.p1') },
    { icon: Clapperboard, text: t('home.welcome.p2') },
    { icon: Store, text: t('home.welcome.p3') },
    { icon: Users, text: t('home.welcome.p4') },
  ];

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-gradient-to-b from-primary-50 via-white to-white">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-6 pt-[calc(3rem+var(--safe-area-inset-top,0px))] pb-[calc(1.5rem+var(--safe-area-inset-bottom,0px))]">
        <div className="flex-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" width={88} height={88} className="mx-auto rounded-3xl shadow-lg" style={{ height: 88, width: 88 }} />
          <h1 className="mt-6 text-center text-3xl font-extrabold leading-tight text-neutral-900">{t('home.welcome.title')}</h1>
          <p className="mt-3 text-center text-base text-neutral-600">{t('home.welcome.subtitle')}</p>
          <ul className="mt-8 space-y-3">
            {points.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-neutral-100">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700"><Icon className="h-5 w-5" aria-hidden /></span>
                <span className="text-[15px] font-medium text-neutral-800">{text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-8">
          <Link href="/auth/register" className="block w-full rounded-full bg-primary-500 py-3.5 text-center text-lg font-extrabold text-neutral-900 hover:bg-primary-600">{t('home.welcome.register')}</Link>
          <Link href="/auth/login" className="mt-3 block w-full rounded-full border-2 border-neutral-300 bg-white py-3 text-center text-base font-semibold text-neutral-800 hover:bg-neutral-50">{t('home.welcome.login')}</Link>
          <p className="mt-3 text-center text-xs text-neutral-500">{t('home.welcome.note')}</p>
          <button type="button" onClick={() => setLangStep(true)} className="mx-auto mt-4 flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800">
            <Globe className="h-4 w-4" aria-hidden />{localeLabels[locale]}
          </button>
        </div>
      </div>
    </div>
  );
}
