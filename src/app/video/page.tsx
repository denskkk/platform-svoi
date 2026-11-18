'use client';

import Link from 'next/link';
import { Clapperboard } from 'lucide-react';
import { useI18n } from '@/i18n/client';

/** Розділ «Відео та історії»: чесна сторінка-заглушка, доки не обране постійне сховище для відео. */
export default function VideoPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-[70vh] bg-neutral-100 flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center">
          <Clapperboard className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">{t('feed.video.title')}</h1>
        <p className="text-neutral-600">{t('feed.video.description')}</p>
        <Link href="/feed" className="inline-block rounded-lg bg-primary-500 hover:bg-primary-600 text-white font-semibold px-5 py-2.5 transition">
          {t('feed.video.back')}
        </Link>
      </div>
    </div>
  );
}
