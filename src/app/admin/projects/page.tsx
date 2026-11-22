'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';
import { foldersFor } from '@/lib/projectFolders';

interface Row {
  slug: string;
  icon: string | null;
  nameUk: string;
  nameEn: string;
  status: 'active' | 'coming_soon' | 'hidden';
  sortOrder: number;
  bannerUrl: string | null;
}

export default function AdminProjectsPage() {
  const { t, locale } = useI18n();
  const toast = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

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

  // Картинка проєкту: завантажуємо файл, одразу зберігаємо адресу як bannerUrl (плитка в списку й шапка сторінки проєкту)
  const setBanner = async (row: Row, url: string) => {
    const res = await fetch(`/api/admin/projects/${row.slug}`, { method: 'PATCH', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ bannerUrl: url }) });
    if (!res.ok) throw new Error();
    patch(row.slug, { bannerUrl: url || null });
  };

  const upload = async (row: Row, file: File | undefined) => {
    if (!file || uploading) return;
    setUploading(row.slug);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', 'banners');
      const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', headers: authHeaders(), body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error);
      await setBanner(row, data.url);
      toast.success(t('projects.admin.imageSaved'));
    } catch (e: any) {
      toast.error(e?.message || t('projects.admin.failed'));
    } finally {
      setUploading(null);
    }
  };

  const removeBanner = async (row: Row) => {
    try { await setBanner(row, ''); toast.success(t('projects.admin.imageRemoved')); } catch { toast.error(t('projects.admin.failed')); }
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
              <span className="relative h-14 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100 flex items-center justify-center text-2xl" aria-hidden={!r.bannerUrl}>
                {r.bannerUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={r.bannerUrl} alt={t('projects.admin.image')} className="h-full w-full object-cover" />
                  : (r.icon || '✨')}
              </span>
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
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50">
                {uploading === r.slug ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                {r.bannerUrl ? t('projects.admin.imageChange') : t('projects.admin.imageAdd')}
                <input type="file" accept="image/*" hidden onChange={(e) => { upload(r, e.target.files?.[0]); e.target.value = ''; }} />
              </label>
              {r.bannerUrl && (
                <button type="button" onClick={() => removeBanner(r)} aria-label={t('projects.admin.imageRemove')} title={t('projects.admin.imageRemove')} className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
              )}
              {foldersFor(r.slug).length > 0 && (
                <Link href={`/admin/projects/${r.slug}/folders`} className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50">
                  <ImagePlus className="w-4 h-4" /> {t('projects.admin.folders')}
                </Link>
              )}
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
