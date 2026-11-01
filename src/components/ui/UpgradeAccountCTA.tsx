"use client";
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useI18n } from '@/i18n/client';

const CreateRequestModal = dynamic(() => import('@/components/requests/CreateRequestModal'), { ssr: false });

export function UpgradeAccountCTA({ currentType }: { currentType: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <div className="border-2 border-dashed border-blue-300 rounded-2xl p-6 bg-blue-50/40 text-center">
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">{t('common.upgradeCta.title')}</h3>
      <p className="text-sm text-neutral-600 mb-4">
        {t('common.upgradeCta.description')}
      </p>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm"
      >
        {t('common.upgradeCta.button')} <ArrowRight className="w-4 h-4" />
      </button>

      <CreateRequestModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
