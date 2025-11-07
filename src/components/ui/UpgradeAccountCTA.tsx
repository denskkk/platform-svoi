"use client";
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function UpgradeAccountCTA({ currentType }: { currentType: string }) {
  return (
    <div className="border-2 border-dashed border-blue-300 rounded-2xl p-6 bg-blue-50/40 text-center">
      <h3 className="text-lg font-semibold text-neutral-900 mb-2">Розширити можливості</h3>
      <p className="text-sm text-neutral-600 mb-4">
        Ваш поточний рівень: <strong>{currentType}</strong>. Заповніть додаткові дані та отримайте доступ до нових функцій.
      </p>
      <Link
        href="/auth/upgrade"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm"
      >
        Перейти до апгрейду <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
