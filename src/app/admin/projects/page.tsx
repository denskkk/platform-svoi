'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';

interface Row {
  slug: string;
  icon: string | null;
  nameUk: string;
  nameEn: string;
  status: 'active' | 'coming_soon' | 'hidden';
  sortOrder: number;
}

export default function AdminProjectsPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/projects', { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
        if (res.status === 403 || res.status === 401) { setForbidden(true); return; }
        const data = await res.json();
        setRows(data.projects);
      } catch {
        toast.error(t('projects.admin.failed'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = (slug: string, p: Partial<Row>) => setRows((prev) => prev.map((r) => (r.slug === slug ? { ...r, ...p } : r)));

  const save = async (row: Row) => {
    setSaving(row.slug);
    try {
      const res = await fetch(`/api/admin/projects/${row.slug}`, {
        method: 'PATCH', credentials: 'include', headers: jsonHeaders(),
        body: JSON.stringify({ status: row.status, sortOrder: row.sortOrder }),
      });
      if (!res.ok) throw new Error();
      toast.success(t('projects.admin.saved'));
    } catch {
      toast.error(t('projects.admin.failed'));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-3xl mx-auto px-4 space-y-4">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-700">
          <ArrowLeft className="w-4 h-4" /> {t('projects.admin.back')}
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('projects.admin.title')}</h1>
          <p className="text-sm text-neutral-500">{t('projects.admin.subtitle')}</p>
        </div>

        {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
        {forbidden && <p className="text-red-600 text-sm">{t('projects.admin.forbidden')}</p>}

        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.slug} className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-neutral-200 p-3">
              <span className="text-2xl" aria-hidden>{r.icon || '✨'}</span>
              <span className="flex-1 min-w-[8rem] font-medium">{locale === 'uk' ? r.nameUk : r.nameEn}</span>
              <label className="text-xs text-neutral-500 flex items-center gap-1">
                {t('projects.admin.status')}
                <select value={r.status} onChange={(e) => patch(r.slug, { status: e.target.value as Row['status'] })} className="rounded-lg border border-neutral-300 px-2 py-1 text-sm text-neutral-900">
                  <option value="active">{t('projects.admin.statusActive')}</option>
                  <option value="coming_soon">{t('projects.admin.statusSoon')}</option>
                  <option value="hidden">{t('projects.admin.statusHidden')}</option>
                </select>
              </label>
              <label className="text-xs text-neutral-500 flex items-center gap-1">
                {t('projects.admin.order')}
                <input type="number" min={0} value={r.sortOrder} onChange={(e) => patch(r.slug, { sortOrder: Number(e.target.value) })} className="w-20 rounded-lg border border-neutral-300 px-2 py-1 text-sm text-neutral-900" />
              </label>
              <button type="button" disabled={saving === r.slug} onClick={() => save(r)} className="rounded-lg bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold px-4 py-1.5 disabled:opacity-50">
                {t('projects.admin.save')}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
