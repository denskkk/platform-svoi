'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Briefcase, Building2, Cake, Camera, Eye, Facebook, GraduationCap, Globe, Heart, Instagram, Linkedin, Loader2, Mail, MapPin, MessageCircle, MoreHorizontal, Pencil, Phone, Send, Share2, Star, UserCheck, UserPlus } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ServiceImage } from '@/components/ui/ServiceImage';
import { ReportButton } from '@/components/ui/ReportButton';
import { BlockButton } from '@/components/feed/BlockButton';
import { PermissionButton } from '@/components/ui/RequirePermission';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';
import { formatRating } from '@/lib/format';
import { translateEducation } from '@/lib/translations';

interface Stats { followers: number; following: number; isFollowing: boolean; likes?: number }

const splitTags = (v: unknown): string[] =>
  String(v ?? '').split(/[,\n;]+/).map((s) => s.trim()).filter(Boolean).slice(0, 10);

/**
 * Кабінет людини: обкладинка, аватарка, ім'я з галочкою, лічильники, «про мене» одним блоком (без схованої «докладної» анкети),
 * контакти й соцмережі, кнопки дій. Нижче — вкладки й сітка дописів (ProfilePosts).
 * Усе, що ще є в старій анкеті (сім'я, житло, транспорт, вподобання), редагується в «Редагувати профіль» і не засмічує кабінет.
 */
export function PersonCabinet({ profile, isOwn, currentUser, isFavorite, onToggleFavorite, onCoverChanged }: {
  profile: any; isOwn: boolean; currentUser: any; isFavorite: boolean; onToggleFavorite: () => void; onCoverChanged: (url: string) => void;
}) {
  const { t, locale } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const userId = Number(profile.id);
  const name = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
  const canWrite = !!currentUser && currentUser.accountType !== 'viewer';
  const canFollow = canWrite;
  const [stats, setStats] = useState<Stats | null>(null);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let off = false;
    fetch(`/api/users/${userId}/social`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!off && d) setStats(d); })
      .catch(() => undefined);
    return () => { off = true; };
  }, [userId]);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  const toggleFollow = async () => {
    if (!stats || busy) return;
    setBusy(true);
    const next = !stats.isFollowing;
    setStats({ ...stats, isFollowing: next, followers: Math.max(0, stats.followers + (next ? 1 : -1)) });
    try {
      const res = next
        ? await fetch('/api/follows', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ userId }) })
        : await fetch(`/api/follows?userId=${userId}`, { method: 'DELETE', credentials: 'include', headers: authHeaders() });
      if (!res.ok) throw new Error();
    } catch {
      setStats(stats);
      toast.error(t('feed.toast.actionFailed'));
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/profile/${userId}`;
    try {
      if (navigator.share) { await navigator.share({ title: name, url }); return; }
      await navigator.clipboard.writeText(url);
      toast.success(t('profile.cabinet.linkCopied'));
    } catch { /* користувач скасував */ }
  };

  const changeCover = async (file: File | undefined) => {
    if (!file || coverBusy) return;
    setCoverBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'banners');
      const up = await fetch('/api/upload', { method: 'POST', credentials: 'include', headers: authHeaders(), body: fd });
      const ud = await up.json().catch(() => ({}));
      if (!up.ok || !ud.url) throw new Error(ud.error);
      const res = await fetch(`/api/profile/${userId}`, { method: 'PUT', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ coverUrl: ud.url }) });
      if (!res.ok) throw new Error();
      onCoverChanged(ud.url);
    } catch (err: any) {
      toast.error(err?.message || t('profile.view.cover.failed'));
    } finally {
      setCoverBusy(false);
    }
  };

  const counters = [
    { label: t('feed.profile.stats.following'), value: stats?.following ?? 0 },
    { label: t('feed.profile.stats.followers'), value: stats?.followers ?? 0 },
    { label: t('feed.profile.stats.likes'), value: stats?.likes ?? 0 },
  ];

  // Факти про людину — один компактний ряд замість схованих анкетних блоків
  const facts: { icon: any; text: string }[] = [];
  if (profile.profession) facts.push({ icon: Briefcase, text: profile.profession });
  if (profile.workplace) facts.push({ icon: Building2, text: profile.workplace });
  if (profile.education) facts.push({ icon: GraduationCap, text: translateEducation(profile.education, locale) });
  if (profile.age) facts.push({ icon: Cake, text: t('profile.view.header.years', { count: profile.age }) });
  const tags = [...splitTags(profile.hobbies), ...splitTags(profile.sports), ...splitTags(profile.outdoorActivities)].slice(0, 12);

  const links = profile.socialLinks || {};
  const socials = [
    { key: 'instagram', href: links.instagram, icon: Instagram, label: 'Instagram' },
    { key: 'facebook', href: links.facebook, icon: Facebook, label: 'Facebook' },
    { key: 'telegram', href: links.telegram, icon: Send, label: 'Telegram' },
    { key: 'linkedin', href: links.linkedin, icon: Linkedin, label: 'LinkedIn' },
    { key: 'website', href: links.website, icon: Globe, label: t('profile.view.about.website') },
  ].filter((s) => !!s.href);

  const btn = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition active:scale-95';
  const hasContacts = !!profile.phone || (!!profile.email && !isOwn);

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-md">
      {/* Обкладинка */}
      <div className="relative h-32 sm:h-44 bg-gradient-to-br from-primary-300 via-primary-200 to-accent-200">
        {profile.coverUrl && <ServiceImage src={profile.coverUrl} alt="" className="h-full w-full object-cover" />}
        {isOwn && (
          <label className="absolute bottom-2 right-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-black/70">
            <input type="file" accept="image/*" hidden onChange={(e) => { changeCover(e.target.files?.[0]); e.target.value = ''; }} />
            {coverBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            {t('profile.view.cover.change')}
          </label>
        )}
      </div>

      <div className="px-4 pb-5 sm:px-6">
        {/* Аватарка накладається на обкладинку, праворуч — дії */}
        <div className="-mt-12 flex items-end justify-between gap-3">
          <UserAvatar src={profile.avatarUrl} alt={name} fallbackName={name} className="h-24 w-24 shrink-0 rounded-full ring-4 ring-white shadow-md" />
          <div className="flex items-center gap-2 pb-1">
            <button type="button" onClick={share} aria-label={t('profile.cabinet.share')} className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
              <Share2 className="h-[18px] w-[18px]" />
            </button>
            {!isOwn && (
              <div ref={menuRef} className="relative">
                <button type="button" onClick={() => setMenu((v) => !v)} aria-label={t('profile.cabinet.more')} aria-expanded={menu} className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
                {menu && (
                  <div className="absolute right-0 top-12 z-20 w-56 space-y-1 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl">
                    <PermissionButton permission="ADD_TO_FAVORITES" onClick={() => { onToggleFavorite(); setMenu(false); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50">
                      <Heart className={cn('h-4 w-4', isFavorite && 'fill-current text-red-500')} />
                      {isFavorite ? t('profile.cabinet.unfavorite') : t('profile.cabinet.favorite')}
                    </PermissionButton>
                    <ReportButton reportedUserId={profile.id} contentType="user" label={t('profile.view.actions.report')}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50" />
                    <BlockButton userId={profile.id} onBlocked={() => router.push('/feed')} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Ім'я */}
        <div className="mt-3 min-w-0">
          <h1 className="flex items-center gap-1.5 break-words text-2xl font-extrabold leading-tight text-neutral-900 sm:text-3xl">
            <span className="min-w-0 break-words">{name}</span>
            {profile.isVerified && <BadgeCheck className="h-6 w-6 shrink-0 text-accent-500" aria-hidden />}
          </h1>
          {profile.city && <p className="mt-1 inline-flex items-center gap-1 text-sm text-neutral-500"><MapPin className="h-4 w-4" />{profile.city}</p>}
          {Number(profile.totalReviews) > 0 && (
            <p className="mt-1 inline-flex items-center gap-1 text-sm text-neutral-600">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <b className="text-neutral-900">{formatRating(profile.avgRating, 1)}</b>
              <span className="text-neutral-400">·</span>
              {t('profile.view.header.reviewsCount', { count: profile.totalReviews })}
            </p>
          )}
        </div>

        {/* Лічильники */}
        <dl className="mt-4 grid grid-cols-3 divide-x divide-neutral-200 rounded-xl bg-neutral-50 py-3 text-center">
          {counters.map((c) => (
            <div key={c.label} className="px-2">
              <dd className="text-xl font-bold leading-none text-neutral-900">{c.value}</dd>
              <dt className="mt-1 text-xs text-neutral-500">{c.label}</dt>
            </div>
          ))}
        </dl>

        {/* Про мене */}
        {profile.bio && <p className="mt-4 whitespace-pre-line break-words text-[15px] leading-relaxed text-neutral-800">{profile.bio}</p>}
        {facts.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-neutral-600">
            {facts.map(({ icon: Icon, text }) => (
              <li key={text} className="inline-flex items-center gap-1.5"><Icon className="h-4 w-4 text-neutral-400" aria-hidden />{text}</li>
            ))}
          </ul>
        )}
        {tags.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag) => <li key={tag} className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-800">{tag}</li>)}
          </ul>
        )}

        {/* Контакти й соцмережі */}
        {(hasContacts || socials.length > 0) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {profile.phone && <a href={`tel:${profile.phone}`} className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-200"><Phone className="h-4 w-4" />{profile.phone}</a>}
            {profile.email && !isOwn && <a href={`mailto:${profile.email}`} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-200"><Mail className="h-4 w-4 shrink-0" /><span className="truncate">{profile.email}</span></a>}
            {socials.map(({ key, href, icon: Icon, label }) => (
              <a key={key} href={String(href)} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
                <Icon className="h-[18px] w-[18px]" />
              </a>
            ))}
          </div>
        )}

        {/* Основні дії */}
        <div className="mt-5 flex flex-wrap gap-2">
          {isOwn ? (
            <>
              <Link href="/profile/edit" className={cn(btn, 'flex-1 bg-primary-500 text-white hover:bg-primary-600')}><Pencil className="h-4 w-4" />{t('profile.view.actions.edit')}</Link>
              <Link href="/menu/viewers" className={cn(btn, 'flex-1 bg-neutral-100 text-neutral-800 hover:bg-neutral-200')}><Eye className="h-4 w-4" />{t('feed.profile.viewers')}</Link>
            </>
          ) : (
            <>
              {canFollow && (
                <button type="button" onClick={toggleFollow} disabled={busy || !stats}
                  className={cn(btn, 'flex-1', stats?.isFollowing ? 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300' : 'bg-primary-500 text-white hover:bg-primary-600')}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : stats?.isFollowing ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {stats?.isFollowing ? t('feed.post.following') : t('feed.post.follow')}
                </button>
              )}
              {canWrite && <Link href={`/chat?with=${profile.id}`} className={cn(btn, 'flex-1 bg-neutral-100 text-neutral-800 hover:bg-neutral-200')}><MessageCircle className="h-4 w-4" />{t('profile.view.actions.write')}</Link>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
