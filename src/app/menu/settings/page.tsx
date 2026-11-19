'use client';

import { performLogout } from '@/lib/client-auth';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Eye, FileText, Globe, Headphones, Lock, LogOut, MapPin, Megaphone, Send, Share2, Shield, User, Users, Briefcase, SlidersHorizontal, Repeat, LayoutList, AtSign } from 'lucide-react';
import { MenuGroup, MenuRow, MenuShell } from '@/components/cabinet/MenuShell';
import { useI18n } from '@/i18n/client';
import { authHeaders } from '@/lib/feedClient';

/** Налаштування і конфіденційність — розділи як у TikTok. Бізнес-налаштування окремо від особистих. */
export default function SettingsHubPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [isBusiness, setIsBusiness] = useState(false);
  useEffect(() => {
    fetch('/api/me/cabinet', { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null)).then((d) => d && setIsBusiness(!!d.isBusiness)).catch(() => {});
  }, []);
  const s = (k: string) => t(`cabinet.settings.sections.${k}`);
  const i = 'w-5 h-5';

  const logout = async () => {
    await performLogout('/auth/login');
  };

  return (
    <MenuShell title={t('cabinet.settings.title')}>
      {isBusiness && (
        <MenuGroup title={t('cabinet.settings.businessOnly')}>
          <MenuRow href="/menu/settings/business" icon={<Briefcase className={i} />} label={s('business')} hint={t('cabinet.settings.businessHint')} />
          <MenuRow href="/menu/settings/promotion" icon={<Megaphone className={i} />} label={s('promotion')} />
        </MenuGroup>
      )}

      <MenuGroup title={t('cabinet.settings.activity')}>
        <MenuRow href="/menu/settings/posts" icon={<LayoutList className={i} />} label={s('posts')} />
        <MenuRow href="/menu/settings/preferred" icon={<SlidersHorizontal className={i} />} label={s('preferred')} />
        <MenuRow href="/notifications" icon={<Bell className={i} />} label={s('notifications')} />
        <MenuRow href="/menu/settings/family" icon={<Users className={i} />} label={s('family')} badge={t('cabinet.shell.soon')} />
      </MenuGroup>

      <MenuGroup title={t('cabinet.settings.account')}>
        <MenuRow href="/menu/settings/accountInfo" icon={<User className={i} />} label={s('accountInfo')} />
        <MenuRow href="/menu/settings/security" icon={<Shield className={i} />} label={s('security')} />
        <MenuRow href="/menu/settings/shareProfile" icon={<Share2 className={i} />} label={s('shareProfile')} />
      </MenuGroup>

      <MenuGroup title={t('cabinet.settings.visibility')}>
        <MenuRow href="/menu/settings/privacy" icon={<Lock className={i} />} label={s('privacy')} />
        <MenuRow href="/menu/settings/comments" icon={<AtSign className={i} />} label={s('comments')} />
        <MenuRow href="/menu/settings/messages" icon={<Send className={i} />} label={s('messages')} />
        <MenuRow href="/menu/settings/privacy" icon={<Eye className={i} />} label={t('cabinet.settings.fields.showProfileViewers')} />
      </MenuGroup>

      <MenuGroup title={t('cabinet.settings.content')}>
        <MenuRow href="/menu/settings/promotion" icon={<Megaphone className={i} />} label={s('promotion')} />
        <MenuRow href="/menu/settings/language" icon={<Globe className={i} />} label={s('language')} />
        <MenuRow href="/menu/settings/contacts" icon={<MapPin className={i} />} label={s('contacts')} />
      </MenuGroup>

      <MenuGroup title={t('cabinet.settings.support')}>
        <MenuRow href="/support" icon={<Headphones className={i} />} label={s('supportCenter')} />
        <MenuRow href="/privacy" icon={<Lock className={i} />} label={s('privacyCenter')} />
        <MenuRow href="/terms-of-use" icon={<FileText className={i} />} label={s('terms')} />
      </MenuGroup>

      <MenuGroup title={t('cabinet.settings.session')}>
        <MenuRow onClick={logout} icon={<Repeat className={i} />} label={s('switch')} />
        <MenuRow onClick={logout} icon={<LogOut className={`${i} text-red-600`} />} label={s('logout')} />
      </MenuGroup>
    </MenuShell>
  );
}
