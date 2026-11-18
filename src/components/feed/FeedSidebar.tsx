'use client';

import Link from 'next/link';
import { Bookmark, Building2, FolderKanban, MessageCircle, Newspaper, Search, Store } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';

interface Props {
  user: { id?: number; firstName?: string; lastName?: string; avatarUrl?: string | null } | null;
}

/** Ліва колонка десктопної версії (як у Facebook): швидкі розділи. */
export function FeedSidebar({ user }: Props) {
  const { t } = useI18n();
  const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  const items = [
    { href: '/feed', icon: Newspaper, label: t('feed.sidebar.feed'), color: 'text-primary-600', active: true },
    { href: '/projects', icon: FolderKanban, label: t('feed.sidebar.projects'), color: 'text-accent-600' },
    { href: '/search', icon: Search, label: t('feed.sidebar.search'), color: 'text-neutral-600' },
    { href: '/chat', icon: MessageCircle, label: t('feed.sidebar.chat'), color: 'text-green-600' },
    { href: '/saved', icon: Bookmark, label: t('feed.sidebar.saved'), color: 'text-purple-600' },
    { href: '/my-listings', icon: Store, label: t('feed.sidebar.listings'), color: 'text-orange-600' },
    { href: '/business/apply', icon: Building2, label: t('feed.sidebar.business'), color: 'text-blue-600' },
  ];

  return (
    <nav aria-label={t('feed.sidebar.menu')} className="hidden lg:block sticky top-20 self-start space-y-1">
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
