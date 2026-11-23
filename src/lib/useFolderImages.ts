'use client';

import { useEffect, useState } from 'react';

/** Картинки папок проєкту: { 'a': url, 'a.b': url }. Якщо запит не вдався, плитки лишаються з іконками. */
export function useFolderImages(project: string | undefined): Record<string, string> {
  const [images, setImages] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!project) return;
    let cancelled = false;
    fetch(`/api/folder-images?project=${encodeURIComponent(project)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { images: {} }))
      .then((d) => { if (!cancelled) setImages(d.images || {}); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [project]);
  return images;
}
