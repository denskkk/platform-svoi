'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Banknote, Receipt, Eye, Handshake, Info, QrCode, Settings, Users, Wallet, LogOut } from 'lucide-react';
import { MenuGroup, MenuRow, MenuShell } from '@/components/cabinet/MenuShell';
import { AccountSwitcher } from '@/components/cabinet/AccountSwitcher';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useI18n } from '@/i18n/client';
import { authHeaders } from '@/lib/feedClient';

interface Cabinet { invited: number; completedDeals: number; isBusiness: boolean }

/** Меню кабінету (три смужки в профілі): баланс, «Заробляти зі своїми», QR, налаштування, про нас. */
export default function MenuPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [c, setC] = useState<Cabinet | null>(null);

  useEffect(() => {
    fetch('/api/me/cabinet', { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null)).then((d) => d && setC(d)).catch(() => {});
  }, []);

  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch { /* вихід локально */ }
    try { localStorage.removeItem('token'); localStorage.removeItem('user'); window.dispatchEvent(new Event('auth:changed')); } catch { /* noop */ }
    router.push('/');
  };

  return (
    <MenuShell title={t('cabinet.menu.title')} backHref="/profile">
      <AccountSwitcher />

      <MenuGroup title={t('cabinet.menu.resources')}>
        <MenuRow href="/menu/balance" icon={<Wallet className="w-5 h-5" />} label={t('cabinet.menu.balance')}
          hint={c ? `${t('cabinet.balance.invited')}: ${c.invited} · ${t('cabinet.balance.deals')}: ${c.completedDeals}` : t('cabinet.menu.balanceHint')} />
      </MenuGroup>

      <MenuGroup title={t('cabinet.menu.tools')}>
        <MenuRow href="/menu/earn" icon={<Handshake className="w-5 h-5" />} label={t('cabinet.menu.earn')} />
        <MenuRow href="/menu/qr" icon={<QrCode className="w-5 h-5" />} label={t('cabinet.menu.qr')} />
        <MenuRow href="/menu/viewers" icon={<Eye className="w-5 h-5" />} label={t('cabinet.menu.viewers')} />
        <MenuRow href="/invoices" icon={<Receipt className="w-5 h-5" />} label={t('cabinet.menu.invoices')} />
        <MenuRow href="/earnings" icon={<Banknote className="w-5 h-5" />} label={t('cabinet.menu.deals')} />
      </MenuGroup>

      {c?.isBusiness && (
        <MenuGroup title={t('cabinet.menu.business')}>
          <MenuRow href="/business/stats" icon={<BarChart3 className="w-5 h-5" />} label={t('cabinet.menu.bizStats')} />
          <MenuRow href="/business/clients" icon={<Users className="w-5 h-5" />} label={t('cabinet.menu.bizClients')} />
        </MenuGroup>
      )}

      <MenuGroup>
        <MenuRow href="/menu/settings" icon={<Settings className="w-5 h-5" />} label={t('cabinet.menu.settings')} />
        <MenuRow href="/menu/about" icon={<Info className="w-5 h-5" />} label={t('cabinet.menu.about')} />
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="font-semibold text-neutral-900">{t('cabinet.menu.language')}</span>
          <LanguageSwitcher variant="buttons" />
        </div>
        <MenuRow onClick={logout} icon={<LogOut className="w-5 h-5 text-red-600" />} label={t('cabinet.menu.logout')} />
      </MenuGroup>
    </MenuShell>
  );
}
