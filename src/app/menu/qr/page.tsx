'use client';

import { useEffect, useState } from 'react';
import { Copy, Download, Loader2, Share2 } from 'lucide-react';
import { MenuShell } from '@/components/cabinet/MenuShell';
import { QrCode, downloadQrSvg } from '@/components/ui/QrCode';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders } from '@/lib/feedClient';

/** QR-код і посилання-запрошення. Показує лише кількість запрошених, не список. */
export default function MyQrPage() {
  const { t } = useI18n();
  const toast = useToast();
  const [data, setData] = useState<{ refCode: string; invited: number } | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');

  const load = () => {
    setState('loading');
    fetch('/api/me/cabinet', { credentials: 'include', headers: authHeaders(), cache: 'no-store' })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setData(d); setState('ready'); }).catch(() => setState('error'));
  };
  useEffect(load, []);

  const link = data ? `${window.location.origin}/invite/${data.refCode}` : '';

  const copy = async () => {
    try { await navigator.clipboard.writeText(link); toast.success(t('cabinet.qr.copied')); }
    catch { window.prompt(t('cabinet.qr.link'), link); }
  };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: t('cabinet.qr.shareText'), text: t('cabinet.qr.shareText'), url: link });
      else await copy();
    } catch { /* користувач закрив вікно «Поділитися» */ }
  };

  return (
    <MenuShell title={t('cabinet.qr.title')}>
      {state === 'loading' && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
      {state === 'error' && <div className="rounded-2xl bg-white border border-red-100 p-5 text-center space-y-3"><p className="text-sm text-red-600">{t('cabinet.shell.error')}</p><button onClick={load} className="rounded-full bg-primary-500 text-white font-semibold px-5 py-2 text-sm">{t('cabinet.shell.retry')}</button></div>}
      {state === 'ready' && data && (
        <>
          <section className="rounded-3xl bg-white border border-neutral-200/70 shadow-sm p-5 text-center">
            <p className="font-bold text-neutral-900">{t('cabinet.qr.scan')}</p>
            <p className="text-xs text-neutral-500 mt-1">{t('cabinet.qr.scanHint')}</p>
            <QrCode value={link} size={240} className="mx-auto mt-4 w-60 max-w-full" />
            <p className="mt-4 inline-block rounded-full bg-primary-100 text-primary-900 font-bold px-4 py-1.5 text-sm">{t('cabinet.qr.invited', { count: data.invited })}</p>
          </section>

          <section className="rounded-2xl bg-white border border-neutral-200/70 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{t('cabinet.qr.link')}</p>
            <p className="rounded-xl bg-neutral-100 px-3 py-2 text-sm break-all text-neutral-800 select-all">{link}</p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={copy} className="rounded-xl bg-neutral-100 hover:bg-neutral-200 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-1.5"><Copy className="w-4 h-4" />{t('cabinet.qr.copy')}</button>
              <button onClick={share} className="rounded-xl bg-primary-500 hover:bg-primary-600 py-2.5 text-sm font-bold inline-flex items-center justify-center gap-1.5"><Share2 className="w-4 h-4" />{t('cabinet.qr.share')}</button>
              <button onClick={() => downloadQrSvg(link, 'svoi-qr.svg')} className="rounded-xl bg-neutral-100 hover:bg-neutral-200 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-1.5"><Download className="w-4 h-4" />{t('cabinet.qr.download')}</button>
            </div>
          </section>
          <p className="text-xs text-neutral-500 px-1">{t('cabinet.qr.privacy')}</p>
        </>
      )}
    </MenuShell>
  );
}
