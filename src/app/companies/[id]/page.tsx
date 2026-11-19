'use client';

import { OwnerClubs } from '@/components/clubs/OwnerClubs';
import { bannerFallbackStyle } from '@/lib/banner';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BadgeCheck, Bookmark, BookmarkCheck, Clock, Globe, Loader2, MapPin, MessageCircle, Navigation, Phone, QrCode as QrCodeIcon, Share2, Star } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { cn } from '@/lib/utils';
import { authHeaders, jsonHeaders, readStoredUser } from '@/lib/feedClient';

interface Company {
  id: number; name: string; logoUrl: string | null; bannerUrl: string | null; category: string | null; description: string | null; mission: string | null;
  servicesList: string | null; priceRange: string | null; workHours: string | null; city: string | null; region: string | null; address: string | null; latitude?: number | null; longitude?: number | null;
  phone: string | null; email: string | null; website: string | null; telegram: string | null; viber: string | null; contactName: string | null;
  socialLinks: Record<string, string>; gallery: string[]; videoUrl: string | null; yearFounded: number | null;
  isVerified: boolean; rating: number; reviewsCount: number; isOwn: boolean; isFavorite: boolean; referralPercent: number | null;
}

const btn = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition active:scale-95';

export default function CompanyPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { t, locale } = useI18n();
  const toast = useToast();
  const [c, setC] = useState<Company | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading');
  const [favBusy, setFavBusy] = useState(false);
  const [refId, setRefId] = useState<number | null>(null);
  const [leadOpen, setLeadOpen] = useState(false);
  const [lead, setLead] = useState({ customerName: '', customerContact: '', note: '' });
  const [dealBusy, setDealBusy] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!readStoredUser()) { router.replace(`/auth/login?returnUrl=/companies/${params.id}`); return; }
    const ref = Number(new URLSearchParams(window.location.search).get('ref'));
    if (Number.isInteger(ref) && ref > 0) setRefId(ref);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/companies/${params.id}`, { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
        if (res.status === 401) { router.replace(`/auth/login?returnUrl=/companies/${params.id}`); return; }
        if (res.status === 404) { if (!cancelled) setState('missing'); return; }
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) { setC(data.company); setState('ok'); }
      } catch {
        if (!cancelled) setState('error');
      }
    })();
    return () => { cancelled = true; };
  }, [params.id, router]);

  if (state === 'loading') return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>;
  if (state !== 'ok' || !c) {
    return (
      <div className="max-w-md mx-auto p-8 text-center space-y-3">
        <p className="text-neutral-600">{state === 'missing' ? t('companies.notFound') : t('companies.loadFailed')}</p>
        <Link href="/companies" className="text-primary-600 font-semibold hover:underline">{t('companies.backToList')}</Link>
      </div>
    );
  }

  const place = [c.address, c.city].filter(Boolean).join(', ');
  const pin = c.latitude != null && c.longitude != null ? `${c.latitude},${c.longitude}` : null;
  const dest = pin || place;
  const routeUrl = dest ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}` : null;
  const mapUrl = dest ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dest)}` : null;

  const toggleFav = async () => {
    if (favBusy) return;
    setFavBusy(true);
    const next = !c.isFavorite;
    try {
      const res = next
        ? await fetch('/api/favorites', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ targetUserId: c.id }) })
        : await fetch(`/api/favorites?targetUserId=${c.id}`, { method: 'DELETE', credentials: 'include', headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      setC({ ...c, isFavorite: next });
      toast.success(t(next ? 'companies.saved' : 'companies.unsaved'));
    } catch (e: any) {
      toast.error(e?.message || t('feed.toast.actionFailed'));
    } finally {
      setFavBusy(false);
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: c.name, url }); return; }
      await navigator.clipboard.writeText(url);
      toast.success(t('feed.post.linkCopied'));
    } catch { /* користувач закрив діалог */ }
  };

  const me = readStoredUser();
  const copyRefLink = async () => {
    if (!me) return;
    const url = `${window.location.origin}/companies/${c.id}?ref=${me.id}`;
    try { await navigator.clipboard.writeText(url); toast.success(t('deals.linkCopied')); } catch { toast.info(url); }
  };
  const sendDeal = async (body: Record<string, unknown>) => {
    if (dealBusy) return;
    setDealBusy(true);
    try {
      const res = await fetch('/api/deals', { method: 'POST', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ businessId: c.id, ...body }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error);
      toast.success(t('deals.sent'));
      setLeadOpen(false); setLead({ customerName: '', customerContact: '', note: '' }); setApplied(true);
    } catch (e: any) {
      toast.error(e?.message || t('feed.toast.actionFailed'));
    } finally { setDealBusy(false); }
  };

  const rows: { label: string; value: string | null }[] = [
    { label: t('companies.fields.services'), value: c.servicesList },
    { label: t('companies.fields.priceRange'), value: c.priceRange },
    { label: t('companies.fields.mission'), value: c.mission },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 pb-28 md:pb-10">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-sm md:rounded-b-2xl overflow-hidden">
          <div className="h-36 sm:h-52 relative" style={bannerFallbackStyle(c.id)}>
            {c.bannerUrl && <img src={c.bannerUrl} alt="" decoding="async" className="w-full h-full object-cover" />}
            <Link href="/companies" aria-label={t('companies.backToList')} className="absolute top-3 left-3 bg-white/90 rounded-full p-2 shadow"><ArrowLeft className="w-5 h-5" /></Link>
          </div>
          <div className="px-4 pb-4">
            <div className="relative z-10 flex items-end gap-3 -mt-10">
              <UserAvatar src={c.logoUrl} alt={c.name} fallbackName={c.name} className="w-24 h-24 rounded-2xl border-4 border-white bg-white shrink-0" />
            </div>
            <h1 className="mt-2 text-2xl font-bold text-neutral-900 flex items-center gap-1.5">{c.name}{c.isVerified && <BadgeCheck className="w-5 h-5 text-primary-600" />}</h1>
            <p className="text-neutral-500">{[c.category, c.city].filter(Boolean).join(' · ')}</p>
            {c.reviewsCount > 0 && (
              <Link href={`/profile/${c.id}`} className="mt-1 inline-flex items-center gap-1 text-sm text-neutral-600 hover:underline">
                <Star className="w-4 h-4 text-amber-400 fill-current" />{c.rating.toLocaleString(locale === 'uk' ? 'uk-UA' : 'en', { maximumFractionDigits: 1 })} · {t('companies.reviews', { count: c.reviewsCount })}
              </Link>
            )}

            <div className="mt-4 grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              {!c.isOwn && <Link href={`/chat?with=${c.id}`} className={cn(btn, 'bg-primary-500 text-white hover:bg-primary-600')}><MessageCircle className="w-4 h-4" />{t('companies.write')}</Link>}
              {c.phone && <a href={`tel:${c.phone.replace(/[^+0-9]/g, '')}`} className={cn(btn, 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200')}><Phone className="w-4 h-4" />{t('companies.call')}</a>}
              {routeUrl && <a href={routeUrl} target="_blank" rel="noopener noreferrer" className={cn(btn, 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200')}><Navigation className="w-4 h-4" />{t('companies.route')}</a>}
              {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className={cn(btn, 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200')}><Globe className="w-4 h-4" />{t('companies.website')}</a>}
              {!c.isOwn && (
                <button type="button" onClick={toggleFav} disabled={favBusy} aria-pressed={c.isFavorite} className={cn(btn, 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200')}>
                  {c.isFavorite ? <BookmarkCheck className="w-4 h-4 text-primary-600" /> : <Bookmark className="w-4 h-4" />}{t(c.isFavorite ? 'companies.savedBtn' : 'companies.save')}
                </button>
              )}
              <button type="button" onClick={share} className={cn(btn, 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200')}><Share2 className="w-4 h-4" />{t('companies.share')}</button>
              <Link href={`/companies/${c.id}/qr`} className={cn(btn, 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200')}><QrCodeIcon className="w-4 h-4" />{t('companies.qr.button')}</Link>
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-0 mt-3 space-y-3">
          {c.referralPercent !== null && !c.isOwn && me && (
            <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3 border border-accent-200">
              <h2 className="font-semibold text-neutral-900">{t('deals.program.title', { percent: c.referralPercent })}</h2>
              <p className="text-sm text-neutral-600">{t('deals.program.note')}</p>
              {refId && refId !== me.id && !applied && (
                <div className="rounded-xl bg-primary-50 p-3 space-y-2">
                  <p className="text-sm text-primary-900">{t('deals.program.referredHint')}</p>
                  <button type="button" disabled={dealBusy} onClick={() => sendDeal({ mode: 'link', referrerId: refId })} className="rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-2 disabled:opacity-60">{t('deals.program.iCame')}</button>
                </div>
              )}
              {applied && <p className="text-sm text-green-700 font-medium">{t('deals.sent')}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={copyRefLink} className={cn(btn, 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200')}>{t('deals.program.copyLink')}</button>
                {me.accountType !== 'viewer' && <button type="button" onClick={() => setLeadOpen((v) => !v)} className={cn(btn, 'bg-accent-500 text-white hover:bg-accent-600')}>{t('deals.program.passClient')}</button>}
              </div>
              {leadOpen && (
                <form onSubmit={(e) => { e.preventDefault(); sendDeal({ mode: 'lead', ...lead }); }} className="space-y-2">
                  <input value={lead.customerName} onChange={(e) => setLead({ ...lead, customerName: e.target.value })} required maxLength={120} placeholder={t('deals.program.clientName')} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-base md:text-sm" />
                  <input value={lead.customerContact} onChange={(e) => setLead({ ...lead, customerContact: e.target.value })} required minLength={5} maxLength={100} placeholder={t('deals.program.clientContact')} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-base md:text-sm" />
                  <textarea value={lead.note} onChange={(e) => setLead({ ...lead, note: e.target.value })} maxLength={300} rows={2} placeholder={t('deals.program.note2')} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-base md:text-sm" />
                  <button type="submit" disabled={dealBusy} className="rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-5 py-2 disabled:opacity-60">{t('deals.program.send')}</button>
                </form>
              )}
            </section>
          )}

          {me && <OwnerClubs ownerId={c.id} />}

          {c.description && (
            <section className="bg-white rounded-2xl shadow-sm p-4">
              <h2 className="font-semibold text-neutral-900 mb-1">{t('companies.about')}</h2>
              <p className="text-neutral-700 whitespace-pre-wrap break-words">{c.description}</p>
            </section>
          )}

          {rows.some((r) => r.value) && (
            <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              {rows.filter((r) => r.value).map((r) => (
                <div key={r.label}>
                  <h2 className="font-semibold text-neutral-900 text-sm">{r.label}</h2>
                  <p className="text-neutral-700 whitespace-pre-wrap break-words">{r.value}</p>
                </div>
              ))}
            </section>
          )}

          <section className="bg-white rounded-2xl shadow-sm p-4 space-y-2.5 text-neutral-700">
            <h2 className="font-semibold text-neutral-900">{t('companies.contacts')}</h2>
            {place && <p className="flex gap-2"><MapPin className="w-5 h-5 shrink-0 text-neutral-400" /><span>{place}{mapUrl && <> · <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{t('companies.openMap')}</a></>}</span></p>}
            {c.workHours && <p className="flex gap-2"><Clock className="w-5 h-5 shrink-0 text-neutral-400" /><span>{c.workHours}</span></p>}
            {c.phone && <p className="flex gap-2"><Phone className="w-5 h-5 shrink-0 text-neutral-400" /><a href={`tel:${c.phone.replace(/[^+0-9]/g, '')}`} className="hover:underline">{c.phone}</a></p>}
            {c.email && <p className="break-all"><a href={`mailto:${c.email}`} className="text-primary-600 hover:underline">{c.email}</a></p>}
            {c.contactName && <p className="text-sm text-neutral-500">{t('companies.fields.contactName')}: {c.contactName}</p>}
            {(c.telegram || c.viber) && <p className="text-sm text-neutral-500">{[c.telegram && `Telegram: ${c.telegram}`, c.viber && `Viber: ${c.viber}`].filter(Boolean).join(' · ')}</p>}
            {Object.entries(c.socialLinks).length > 0 && (
              <ul className="text-sm space-y-0.5">
                {Object.entries(c.socialLinks).map(([k, v]) => (
                  <li key={k} className="break-all">{k === 'other' ? '' : `${k}: `}{/^https?:\/\//i.test(v) ? <a href={v} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">{v}</a> : v}</li>
                ))}
              </ul>
            )}
          </section>

          {c.gallery.length > 0 && (
            <section className="bg-white rounded-2xl shadow-sm p-4">
              <h2 className="font-semibold text-neutral-900 mb-2">{t('companies.gallery')}</h2>
              <div className="grid grid-cols-3 gap-1.5">
                {c.gallery.map((u) => <img key={u} src={u} alt="" loading="lazy" decoding="async" className="aspect-square w-full object-cover rounded-lg" />)}
              </div>
            </section>
          )}

          {c.videoUrl && /^https?:\/\//i.test(c.videoUrl) && (
            <a href={c.videoUrl} target="_blank" rel="noopener noreferrer" className="block bg-white rounded-2xl shadow-sm p-4 text-primary-600 font-semibold hover:underline">{t('companies.video')}</a>
          )}

          <Link href={`/profile/${c.id}`} className="block text-center text-sm text-neutral-500 hover:underline py-2">{t('companies.fullProfile')}</Link>
        </div>
      </div>
    </div>
  );
}
