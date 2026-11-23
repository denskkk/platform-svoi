'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Bookmark, Building2, FolderKanban, MessageCircle, Newspaper, Search, Users, Wallet } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';

interface Props {
  user: { id?: number; firstName?: string; lastName?: string; avatarUrl?: string | null } | null;
}

function useItems() {
  const { t } = useI18n();
  return [
    { href: '/feed', icon: Newspaper, label: t('feed.sidebar.feed'), color: 'text-primary-600', active: true },
    { href: '/projects', icon: FolderKanban, label: t('feed.sidebar.projects'), color: 'text-accent-600' },
    { href: '/search', icon: Search, label: t('feed.sidebar.search'), color: 'text-neutral-600' },
    { href: '/chat', icon: MessageCircle, label: t('feed.sidebar.chat'), color: 'text-green-600' },
    { href: '/companies', icon: Building2, label: t('feed.sidebar.companies'), color: 'text-indigo-600' },
    { href: '/earnings', icon: Wallet, label: t('feed.sidebar.earnings'), color: 'text-emerald-600' },
    { href: '/clubs', icon: Users, label: t('feed.sidebar.clubs'), color: 'text-cyan-600' },
    { href: '/friends', icon: Users, label: t('feed.sidebar.friends'), color: 'text-blue-600' },
    { href: '/saved', icon: Bookmark, label: t('feed.sidebar.saved'), color: 'text-purple-600' },
    { href: '/business/stats', icon: Building2, label: t('feed.sidebar.company'), color: 'text-blue-600' },
  ];
}

/** Ліва колонка десктопної версії (як у Facebook): швидкі розділи. */
export function FeedSidebar({ user }: Props) {
  const { t } = useI18n();
  const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const items = useItems().map((i, k) => ({ ...i, active: k === 0 }));

  return (
    <nav data-guest-ok aria-label={t('feed.sidebar.menu')} className="hidden lg:block sticky top-20 self-start space-y-1 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
      {user?.id && (
        <Link href={`/profile/${user.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-neutral-200/60">
          <UserAvatar src={user.avatarUrl} alt={name} fallbackName={name || '?'} className="w-9 h-9 rounded-full" />
          <span className="font-semibold text-[15px] text-neutral-900 truncate">{name || t('feed.sidebar.profile')}</span>
        </Link>
      )}
      {items.map(({ href, icon: Icon, label, color, active }) => (
        <Link key={href} href={href} className={cn('flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-neutral-200/60', active && 'bg-neutral-200/60')}>
          <Icon className={cn('w-8 h-8 p-1', color)} />
          <span className="text-[15px] font-medium text-neutral-900 truncate">{label}</span>
        </Link>
      ))}
    </nav>
  );
}


/** Телефон: кнопка «Меню» у стрічці відкриває бокову панель з тими самими розділами, що й на десктопі. */
export function FeedMenuDrawer({ user }: Props) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const items = useItems();
  const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);
  return (
    <div data-guest-ok className="lg:hidden">
      <button type="button" onClick={() => setOpen(true)} aria-label={t('cabinet.feedMenu.open')} aria-expanded={open}
        className="h-11 w-11 shrink-0 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] flex items-center justify-center text-neutral-800">
        <Menu className="w-5 h-5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t('feed.sidebar.menu')}>
          <button type="button" aria-label={t('cabinet.feedMenu.close')} onClick={() => setOpen(false)} className="absolute inset-0 bg-black/50" />
          <nav className="absolute left-0 top-0 bottom-0 w-[82%] max-w-xs bg-neutral-50 shadow-2xl overflow-y-auto pt-[calc(0.75rem+var(--safe-area-inset-top,0px))] pb-[calc(1rem+var(--safe-area-inset-bottom,0px))] px-3 space-y-1">
            <div className="flex items-center justify-between pb-1">
              <h2 className="font-bold text-lg text-neutral-900">{t('feed.sidebar.menu')}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label={t('cabinet.feedMenu.close')} className="h-9 w-9 rounded-full hover:bg-neutral-200 flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
            {user?.id && (
              <Link href={`/profile/${user.id}`} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-neutral-200/60">
                <UserAvatar src={user.avatarUrl} alt={name} fallbackName={name || '?'} className="w-9 h-9 rounded-full" />
                <span className="font-semibold text-[15px] text-neutral-900 truncate">{name || t('feed.sidebar.profile')}</span>
              </Link>
            )}
            {items.map(({ href, icon: Icon, label, color }) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-neutral-200/60 active:bg-neutral-200">
                <Icon className={cn('w-8 h-8 p-1', color)} />
                <span className="text-[15px] font-medium text-neutral-900 truncate">{label}</span>
              </Link>
            ))}
            <Link href="/menu" onClick={() => setOpen(false)} className="mt-2 block rounded-lg bg-primary-500 text-neutral-900 text-center font-bold py-2.5">{t('cabinet.feedMenu.full')}</Link>
          </nav>
        </div>
      )}
    </div>
  );
}
