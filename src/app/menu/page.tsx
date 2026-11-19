'use client';

import { performLogout } from '@/lib/client-auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Banknote, Bookmark, Building2, ClipboardList, Clapperboard, Heart, Inbox, Receipt, Eye, Handshake, Info, MessagesSquare, QrCode, Settings, Store, UserCircle, UserPlus, Users, UsersRound, Wallet, Wrench, Ban, LogOut, Pencil } from 'lucide-react';
import { MenuGroup, MenuRow, MenuShell } from '@/components/cabinet/MenuShell';
import { AccountSwitcher } from '@/components/cabinet/AccountSwitcher';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useI18n } from '@/i18n/client';
import { authHeaders, readStoredUser } from '@/lib/feedClient';

interface Cabinet { invited: number; completedDeals: number; isBusiness: boolean }

/** Меню кабінету (три смужки в профілі): баланс, «Заробляти зі своїми», QR, налаштування, про нас. */
export default function MenuPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [c, setC] = useState<Cabinet | null>(null);
  const [me, setMe] = useState<{ id: number } | null>(null);
  useEffect(() => { setMe(readStoredUser()); }, []);

  useEffect(() => {
    fetch('/api/me/cabinet', { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null)).then((d) => d && setC(d)).catch(() => {});
  }, []);

  const logout = async () => {
    await performLogout('/');
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

      <MenuGroup title={t('cabinet.menu.sections')}>
        {me && <MenuRow href={`/profile/${me.id}`} icon={<UserCircle className="w-5 h-5" />} label={t('layout.navbar.myProfile')} />}
        <MenuRow href="/profile/edit" icon={<Pencil className="w-5 h-5" />} label={t('layout.navbar.editProfile')} />
        <MenuRow href="/friends" icon={<UserPlus className="w-5 h-5" />} label={t('layout.navbar.friends')} />
        <MenuRow href="/clubs" icon={<UsersRound className="w-5 h-5" />} label={t('cabinet.menu.interestClubs')} />
        <MenuRow href="/chat/groups" icon={<MessagesSquare className="w-5 h-5" />} label={t('cabinet.groupChats.title')} />
        <MenuRow href="/saved" icon={<Bookmark className="w-5 h-5" />} label={t('cabinet.menu.saved')} />
        <MenuRow href="/favorites" icon={<Heart className="w-5 h-5" />} label={t('layout.navbar.favorites')} />
        <MenuRow href="/video" icon={<Clapperboard className="w-5 h-5" />} label={t('layout.navbar.video')} />
      </MenuGroup>

      <MenuGroup title={t('cabinet.menu.find')}>
        <MenuRow href="/catalog" icon={<Users className="w-5 h-5" />} label={t('layout.navbar.people')} />
        <MenuRow href="/services" icon={<Wrench className="w-5 h-5" />} label={t('layout.navbar.services')} />
        <MenuRow href="/public-requests" icon={<ClipboardList className="w-5 h-5" />} label={t('layout.navbar.requests')} />
        <MenuRow href="/service-requests?type=tome" icon={<Inbox className="w-5 h-5" />} label={t('cabinet.menu.requestsToMe')} />
        <MenuRow href="/service-requests?type=my" icon={<ClipboardList className="w-5 h-5" />} label={t('cabinet.menu.myRequests')} />
        <MenuRow href="/companies" icon={<Store className="w-5 h-5" />} label={t('cabinet.projects.offline')} />
      </MenuGroup>

      <MenuGroup title={t('cabinet.menu.applications')}>
        <MenuRow href="/business/apply" icon={<Building2 className="w-5 h-5" />} label={t('layout.navbar.businessApply')} />
        <MenuRow href="/organizations/apply" icon={<Building2 className="w-5 h-5" />} label={t('layout.navbar.organizationApply')} />
        <MenuRow href="/blocked" icon={<Ban className="w-5 h-5" />} label={t('layout.navbar.blockedUsers')} />
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
