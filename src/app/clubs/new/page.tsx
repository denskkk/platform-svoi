'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { CLUB_CATEGORIES } from '@/lib/clubs';
import { jsonHeaders, readStoredUser } from '@/lib/feedClient';
import { canCreateGroups } from '@/lib/groupRights';

const inputCls = 'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary-400';

export default function NewClubPage() {
  const router = useRouter();
  const { t } = useI18n();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', description: '', category: 'other', city: '', joinMode: 'open', postMode: 'owner', visibility: 'public' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const me = readStoredUser();
    if (!me) router.replace('/auth/login?returnUrl=/clubs/new');
    else if (!canCreateGroups(me)) router.replace('/clubs');
  }, [router]);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/clubs', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(data.error || t('clubs.failed')); return; }
      router.push(`/clubs/${data.club.id}`);
    } catch {
      toast.error(t('clubs.failed'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <form onSubmit={submit} className="max-w-xl mx-auto px-4 py-4 space-y-3">
        <h1 className="text-2xl font-bold text-neutral-900">{t('clubs.createTitle')}</h1>
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <label className="block space-y-1"><span className="text-sm font-medium text-neutral-700">{t('clubs.fields.name')}</span>
            <input className={inputCls} value={form.name} onChange={set('name')} required maxLength={120} /></label>
          <label className="block space-y-1"><span className="text-sm font-medium text-neutral-700">{t('clubs.fields.category')}</span>
            <select className={inputCls} value={form.category} onChange={set('category')}>{CLUB_CATEGORIES.map((c) => <option key={c} value={c}>{t(`clubs.categories.${c}`)}</option>)}</select></label>
          <label className="block space-y-1"><span className="text-sm font-medium text-neutral-700">{t('clubs.fields.city')}</span>
            <input className={inputCls} value={form.city} onChange={set('city')} maxLength={100} /></label>
          <label className="block space-y-1"><span className="text-sm font-medium text-neutral-700">{t('clubs.fields.description')}</span>
            <textarea className={inputCls} rows={5} value={form.description} onChange={set('description')} required minLength={10} maxLength={3000} /></label>
          <label className="block space-y-1"><span className="text-sm font-medium text-neutral-700">{t('clubs.modes.joinMode')}</span>
            <select className={inputCls} value={form.joinMode} onChange={set('joinMode')}><option value="open">{t('clubs.modes.open')}</option><option value="approval">{t('clubs.modes.approval')}</option></select></label>
          <label className="block space-y-1"><span className="text-sm font-medium text-neutral-700">{t('clubs.modes.postMode')}</span>
            <select className={inputCls} value={form.postMode} onChange={set('postMode')}><option value="owner">{t('clubs.modes.owner')}</option><option value="members">{t('clubs.modes.members')}</option></select></label>
          <label className="block space-y-1"><span className="text-sm font-medium text-neutral-700">{t('clubs.modes.visibility')}</span>
            <select className={inputCls} value={form.visibility} onChange={set('visibility')}><option value="public">{t('clubs.modes.public')}</option><option value="members">{t('clubs.modes.visMembers')}</option></select></label>
          <button type="submit" disabled={sending} className="w-full rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 disabled:opacity-60 flex items-center justify-center gap-2">
            {sending && <Loader2 className="w-4 h-4 animate-spin" />}{t('clubs.createSubmit')}
          </button>
        </div>
      </form>
    </div>
  );
}
