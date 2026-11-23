'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { useI18n } from '@/i18n/client';
import { authHeaders, jsonHeaders } from '@/lib/feedClient';
import { foldersFor, ProjectFolder } from '@/lib/projectFolders';

/** Усі папки й підпапки проєкту з можливістю додати / змінити / прибрати картинку кожної. */
export default function AdminFolderImagesPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { t } = useI18n();
  const toast = useToast();
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const folders = foldersFor(slug);

  const load = useCallback(async () => {
    try {
      const me = await fetch('/api/admin/projects', { credentials: 'include', headers: authHeaders(), cache: 'no-store' });
      if (me.status === 401 || me.status === 403) { setForbidden(true); return; }
      const res = await fetch(`/api/folder-images?project=${encodeURIComponent(slug)}`, { cache: 'no-store' });
      const data = await res.json();
      setImages(data.images || {});
    } catch {
      toast.error(t('projects.admin.failed'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const save = async (path: string, url: string) => {
    const res = await fetch('/api/admin/folder-images', { method: 'PUT', credentials: 'include', headers: jsonHeaders(), body: JSON.stringify({ project: slug, path, imageUrl: url }) });
    if (!res.ok) throw new Error();
    setImages((prev) => {
      const next = { ...prev };
      if (url) next[path] = url; else delete next[path];
      return next;
    });
  };

  const upload = async (path: string, file: File | undefined) => {
    if (!file || busy) return;
    setBusy(path);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('type', 'misc');
      const res = await fetch('/api/upload', { method: 'POST', credentials: 'include', headers: authHeaders(), body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error);
      await save(path, data.url);
      toast.success(t('projects.admin.imageSaved'));
    } catch (e: any) {
      toast.error(e?.message || t('projects.admin.failed'));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (path: string) => {
    setBusy(path);
    try { await save(path, ''); toast.success(t('projects.admin.imageRemoved')); } catch { toast.error(t('projects.admin.failed')); } finally { setBusy(null); }
  };

  const row = (f: ProjectFolder, path: string, depth: number) => {
    const img = images[path];
    return (
      <li key={path}>
        <div className="flex items-center gap-3 bg-white rounded-xl border border-neutral-200 p-2.5" style={{ marginLeft: depth * 20 }}>
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-100 flex items-center justify-center text-2xl">
            {img
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={img} alt="" className="h-full w-full object-cover" />
              : <span aria-hidden>{f.icon}</span>}
          </span>
          <span className="flex-1 min-w-0 text-sm font-medium text-neutral-900 break-words">{t(f.labelKey)}</span>
          <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-50">
            {busy === path ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
            <span className="hidden sm:inline">{img ? t('projects.admin.imageChange') : t('projects.admin.imageAdd')}</span>
            <input type="file" accept="image/*" hidden onChange={(e) => { upload(path, e.target.files?.[0]); e.target.value = ''; }} />
          </label>
          {img && (
            <button type="button" disabled={busy === path} onClick={() => remove(path)} aria-label={t('projects.admin.imageRemove')} title={t('projects.admin.imageRemove')} className="shrink-0 rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 className="w-4 h-4" /></button>
          )}
        </div>
        {f.children && (
          <ul className="mt-2 space-y-2">
            {f.children.map((c) => row(c, `${path}.${c.key}`, depth + 1))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-3xl mx-auto px-4 space-y-4">
        <Link href="/admin/projects" className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-primary-700">
          <ArrowLeft className="w-4 h-4" /> {t('projects.admin.foldersBack')}
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('projects.admin.foldersTitle')}</h1>
          <p className="text-sm text-neutral-500">{t('projects.admin.foldersSubtitle')}</p>
        </div>

        {loading && <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>}
        {forbidden && <p className="text-red-600 text-sm">{t('projects.admin.forbidden')}</p>}
        {!loading && !forbidden && folders.length === 0 && <p className="text-sm text-neutral-500">{t('projects.admin.foldersEmpty')}</p>}

        {!forbidden && (
          <ul className="space-y-2">
            {folders.map((f) => row(f, f.key, 0))}
          </ul>
        )}
      </div>
    </div>
  );
}
