'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { MenuGroup, MenuRow, MenuShell } from '@/components/cabinet/MenuShell';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders, readStoredUser } from '@/lib/feedClient';
import type { SettingsData } from '@/lib/userSettings';

type Field =
  | { type: 'toggle'; group: keyof SettingsData; key: string; label: string; hint?: string }
  | { type: 'select'; group: keyof SettingsData; key: string; label: string; options: string[] }
  | { type: 'text'; group: keyof SettingsData; key: string; label: string }
  | { type: 'number'; group: keyof SettingsData; key: string; label: string; min: number; max: number };

const AUD = ['everyone', 'friends', 'nobody'];

/** Поля кожного розділу налаштувань. Усе зберігається в /api/settings одразу після зміни. */
const SECTIONS: Record<string, Field[]> = {
  privacy: [
    { type: 'toggle', group: 'privacy', key: 'privateAccount', label: 'privateAccount', hint: 'privateAccountHint' },
    { type: 'toggle', group: 'privacy', key: 'showProfileOnLinkShare', label: 'showProfileOnLinkShare' },
    { type: 'select', group: 'privacy', key: 'showFollowing', label: 'showFollowing', options: ['everyone', 'me'] },
    { type: 'select', group: 'privacy', key: 'showLikedPosts', label: 'showLikedPosts', options: ['everyone', 'me'] },
    { type: 'toggle', group: 'privacy', key: 'allowDownloads', label: 'allowDownloads' },
    { type: 'toggle', group: 'privacy', key: 'recordProfileViews', label: 'recordProfileViews' },
    { type: 'toggle', group: 'privacy', key: 'showProfileViewers', label: 'showProfileViewers' },
  ],
  comments: [
    { type: 'select', group: 'privacy', key: 'comments', label: 'comments', options: AUD },
    { type: 'select', group: 'privacy', key: 'mentions', label: 'mentions', options: AUD },
  ],
  messages: [{ type: 'select', group: 'privacy', key: 'messages', label: 'messages', options: AUD }],
  contacts: [
    { type: 'select', group: 'contacts', key: 'phone', label: 'phone', options: ['hidden', 'everyone'] },
    { type: 'select', group: 'contacts', key: 'email', label: 'email', options: ['hidden', 'everyone'] },
  ],
  preferred: [
    { type: 'select', group: 'feed', key: 'scope', label: 'scope', options: ['region', 'country', 'all'] },
    { type: 'text', group: 'feed', key: 'country', label: 'country' },
    { type: 'text', group: 'feed', key: 'region', label: 'region' },
    { type: 'text', group: 'feed', key: 'interests', label: 'interests' },
  ],
  business: [
    { type: 'toggle', group: 'business', key: 'clientsCanWrite', label: 'clientsCanWrite' },
    { type: 'select', group: 'business', key: 'targetGender', label: 'targetGender', options: ['all', 'male', 'female'] },
    { type: 'number', group: 'business', key: 'targetAgeMin', label: 'targetAgeMin', min: 13, max: 99 },
    { type: 'number', group: 'business', key: 'targetAgeMax', label: 'targetAgeMax', min: 13, max: 99 },
    { type: 'text', group: 'business', key: 'targetCountry', label: 'targetCountry' },
    { type: 'text', group: 'business', key: 'targetRegion', label: 'targetRegion' },
  ],
  promotion: [
    { type: 'select', group: 'business', key: 'targetGender', label: 'targetGender', options: ['all', 'male', 'female'] },
    { type: 'number', group: 'business', key: 'targetAgeMin', label: 'targetAgeMin', min: 13, max: 99 },
    { type: 'number', group: 'business', key: 'targetAgeMax', label: 'targetAgeMax', min: 13, max: 99 },
    { type: 'text', group: 'business', key: 'targetCountry', label: 'targetCountry' },
    { type: 'text', group: 'business', key: 'targetRegion', label: 'targetRegion' },
    { type: 'toggle', group: 'business', key: 'promotePostsByDefault', label: 'promotePostsByDefault' },
  ],
};
const TITLES: Record<string, string> = {
  posts: 'posts', preferred: 'preferred', family: 'family', accountInfo: 'accountInfo', security: 'security', shareProfile: 'shareProfile',
  privacy: 'privacy', comments: 'comments', messages: 'messages', contacts: 'contacts', promotion: 'promotion', language: 'language', business: 'business',
};
const BUSINESS_ONLY = new Set(['business', 'promotion']);

export default function SettingsSectionPage() {
  const { section } = useParams<{ section: string }>();
  const { t } = useI18n();
  const toast = useToast();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [isBusiness, setIsBusiness] = useState(false);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = useCallback(() => {
    setState('loading');
    Promise.all([
      fetch('/api/settings', { credentials: 'include', headers: authHeaders(), cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch('/api/me/cabinet', { credentials: 'include', headers: authHeaders(), cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]).then(([s, c]) => { setSettings(s.settings); setIsBusiness(!!c?.isBusiness); setState('ready'); }).catch(() => setState('error'));
  }, []);
  useEffect(load, [load]);

  const save = async (group: keyof SettingsData, key: string, value: unknown) => {
    if (!settings) return;
    const prev = settings;
    setSettings({ ...settings, [group]: { ...(settings[group] as object), [key]: value } } as SettingsData);
    try {
      const res = await fetch('/api/settings', { method: 'PUT', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ [group]: { [key]: value } }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error();
      setSettings(data.settings);
    } catch {
      setSettings(prev);
      toast.error(t('cabinet.shell.saveFailed'));
    }
  };

  const fields = SECTIONS[section];
  const known = !!TITLES[section];
  const title = known ? t(`cabinet.settings.sections.${TITLES[section]}`) : t('cabinet.settings.title');
  const f = (k: string) => t(`cabinet.settings.fields.${k}`);
  const o = (k: string) => t(`cabinet.settings.options.${k}`);
  const me = readStoredUser();
  const blocked = BUSINESS_ONLY.has(section) && state === 'ready' && !isBusiness;

  const renderField = (fd: Field) => {
    const val = settings ? (settings[fd.group] as any)[fd.key] : undefined;
    const row = 'flex items-center justify-between gap-3 px-4 py-3.5';
    if (fd.type === 'toggle') {
      return (
        <label key={fd.key} className={`${row} cursor-pointer`}>
          <span className="min-w-0"><span className="block font-semibold text-neutral-900">{f(fd.label)}</span>{fd.hint && <span className="block text-xs text-neutral-500">{f(fd.hint)}</span>}</span>
          <input type="checkbox" role="switch" checked={!!val} onChange={(e) => save(fd.group, fd.key, e.target.checked)} className="h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-neutral-300 checked:bg-accent-500 relative transition before:content-[''] before:absolute before:top-0.5 before:left-0.5 before:h-5 before:w-5 before:rounded-full before:bg-white before:transition checked:before:translate-x-5" />
        </label>
      );
    }
    if (fd.type === 'select') {
      return (
        <label key={fd.key} className={row}>
          <span className="font-semibold text-neutral-900">{f(fd.label)}</span>
          <select value={val} onChange={(e) => save(fd.group, fd.key, e.target.value)} className="rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm max-w-[55%]">
            {fd.options.map((op) => <option key={op} value={op}>{o(op)}</option>)}
          </select>
        </label>
      );
    }
    if (fd.type === 'number') {
      return (
        <label key={fd.key} className={row}>
          <span className="font-semibold text-neutral-900">{f(fd.label)}</span>
          <input type="number" inputMode="numeric" min={fd.min} max={fd.max} defaultValue={val} key={String(val)}
            onBlur={(e) => { const n = Number(e.target.value); if (Number.isFinite(n) && n !== val) save(fd.group, fd.key, n); }}
            className="w-20 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm text-right" />
        </label>
      );
    }
    return (
      <label key={fd.key} className={row}>
        <span className="font-semibold text-neutral-900 shrink-0">{f(fd.label)}</span>
        <input type="text" defaultValue={val} key={String(val)} maxLength={fd.key === 'interests' ? 300 : 80}
          onBlur={(e) => { if (e.target.value.trim() !== (val || '')) save(fd.group, fd.key, e.target.value.trim()); }}
          className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm" />
      </label>
    );
  };

  const shareProfile = async () => {
    const url = `${window.location.origin}/profile/${me?.id}`;
    try {
      if (navigator.share) await navigator.share({ title: t('cabinet.settings.shareText'), url });
      else { await navigator.clipboard.writeText(url); toast.success(t('cabinet.settings.linkCopied')); }
    } catch { /* вікно «Поділитися» закрито */ }
  };

  return (
    <MenuShell title={title} backHref="/menu/settings">
      {state === 'loading' && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
      {state === 'error' && <div className="rounded-2xl bg-white border border-red-100 p-5 text-center space-y-3"><p className="text-sm text-red-600">{t('cabinet.shell.error')}</p><button onClick={load} className="rounded-full bg-primary-500 text-white font-semibold px-5 py-2 text-sm">{t('cabinet.shell.retry')}</button></div>}

      {state === 'ready' && blocked && <div className="rounded-2xl bg-white border border-neutral-200 p-5 text-sm text-neutral-600">{t('cabinet.settings.businessHint')}</div>}

      {state === 'ready' && !blocked && fields && settings && (
        <>
          {section === 'contacts' && <p className="text-xs text-neutral-500 px-1">{f('contactsNote')}</p>}
          {section === 'promotion' && <p className="text-xs text-neutral-500 px-1">{t('cabinet.settings.promotionSoon')}</p>}
          <MenuGroup>{fields.map(renderField)}</MenuGroup>
        </>
      )}

      {state === 'ready' && !blocked && section === 'language' && (
        <div className="rounded-2xl bg-white border border-neutral-200/70 shadow-sm p-4 flex items-center justify-between gap-3">
          <span className="font-semibold text-neutral-900">{t('cabinet.menu.language')}</span>
          <LanguageSwitcher variant="buttons" />
        </div>
      )}

      {state === 'ready' && section === 'posts' && (
        <MenuGroup>
          <MenuRow href={me?.id ? `/profile/${me.id}#profile-posts` : '/profile'} label={t('cabinet.settings.postsLinks.my')} />
          <MenuRow href="/saved" label={t('cabinet.settings.postsLinks.saved')} />
          <MenuRow href="/my-listings" label={t('cabinet.settings.postsLinks.listings')} />
        </MenuGroup>
      )}

      {state === 'ready' && section === 'family' && <div className="rounded-2xl bg-white border border-neutral-200 p-5 text-sm text-neutral-700">{t('cabinet.settings.familySoon')}</div>}

      {state === 'ready' && section === 'accountInfo' && (
        <MenuGroup>
          <MenuRow href="/profile/edit" label={t('cabinet.settings.accountLinks.edit')} />
          {isBusiness && <MenuRow href="/profile/edit-business" label={t('cabinet.settings.accountLinks.editBusiness')} />}
          <MenuRow href="/blocked" label={t('cabinet.settings.accountLinks.blocked')} />
          <MenuRow href="/account-deletion" label={t('cabinet.settings.accountLinks.delete')} />
        </MenuGroup>
      )}

      {state === 'ready' && section === 'security' && (
        <>
          <p className="text-xs text-neutral-500 px-1">{t('cabinet.settings.securityText')}</p>
          <MenuGroup>
            <MenuRow href="/menu/settings/privacy" label={t('cabinet.settings.sections.privacy')} />
            <MenuRow href="/menu/settings/contacts" label={t('cabinet.settings.sections.contacts')} />
            <MenuRow href="/menu/settings/messages" label={t('cabinet.settings.sections.messages')} />
            <MenuRow href="/blocked" label={t('cabinet.settings.accountLinks.blocked')} />
          </MenuGroup>
        </>
      )}

      {state === 'ready' && section === 'shareProfile' && (
        <button type="button" onClick={shareProfile} className="w-full rounded-2xl bg-primary-500 hover:bg-primary-600 font-bold py-3.5">{t('cabinet.settings.shareOpen')}</button>
      )}

      {!known && state !== 'loading' && <Link href="/menu/settings" className="text-sm font-semibold text-accent-700 hover:underline">{t('cabinet.shell.back')}</Link>}
    </MenuShell>
  );
}
