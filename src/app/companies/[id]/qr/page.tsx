'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { QrCode, downloadQrSvg } from '@/components/ui/QrCode';
import { useI18n } from '@/i18n/client';
import { authHeaders } from '@/lib/feedClient';

/** QR-сторінка компанії: код веде на сторінку компанії; можна завантажити або надрукувати (для столиків, вітрини, візиток). */
export default function CompanyQrPage() {
  const params = useParams<{ id: string }>();
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(`${window.location.origin}/companies/${params.id}?src=qr`);
    fetch(`/api/companies/${params.id}`, { credentials: 'include', headers: authHeaders() })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.company?.name) setName(d.company.name); })
      .catch(() => undefined);
  }, [params.id]);

  return (
    <div className="min-h-screen bg-neutral-50 print:bg-white">
      <div className="mx-auto max-w-md px-4 pt-4 pb-28 md:pb-10 space-y-4">
        <Link href={`/companies/${params.id}`} className="print:hidden inline-flex items-center gap-2 text-sm font-medium text-neutral-600 hover:text-primary-700">
          <ArrowLeft className="w-4 h-4" /> {t('companies.qr.back')}
        </Link>
        <div className="bg-white rounded-3xl border border-neutral-200/70 shadow-sm p-6 text-center space-y-4 print:shadow-none print:border-0">
          {name && <h1 className="text-xl font-bold text-neutral-900">{name}</h1>}
          <p className="text-sm text-neutral-600">{t('companies.qr.hint')}</p>
          {url && <QrCode value={url} size={280} className="mx-auto w-[280px] max-w-full [&>svg]:w-full [&>svg]:h-auto" />}
          <p className="text-xs text-neutral-400 break-all">{url}</p>
          <div className="print:hidden flex flex-col sm:flex-row gap-2 justify-center">
            <button type="button" disabled={!url} onClick={() => downloadQrSvg(url, `qr-company-${params.id}.svg`)} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 py-2.5 disabled:opacity-50">
              <Download className="w-4 h-4" /> {t('companies.qr.download')}
            </button>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-300 text-neutral-700 hover:bg-neutral-50 font-semibold px-6 py-2.5">
              <Printer className="w-4 h-4" /> {t('companies.qr.print')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
