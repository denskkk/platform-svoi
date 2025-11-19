"use client";
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';

const CreateRequestModal = dynamic(() => import('@/components/requests/CreateRequestModal'), { ssr: false });

export function UpgradeAccountCTA({ currentType }: { currentType: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-2 border-dashed border-blue-300 rounded-2xl p-6 bg-blue-50/40 text-center">
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">Розширити можливості</h3>
      <p className="text-sm text-neutral-600 mb-4">
        Ваш поточний рівень: <strong>{currentType}</strong>. Замість переходу на апгрейд ви можете створити заявку прямо зараз.
      </p>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm"
      >
        Створити заявку <ArrowRight className="w-4 h-4" />
      </button>

      <CreateRequestModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
