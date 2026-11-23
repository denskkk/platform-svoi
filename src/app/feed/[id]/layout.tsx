import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getPrivateAuthorIdsHiddenFrom } from '@/lib/userSettings';
import { parseId } from '@/lib/feed';
import { APP_STORE_URL, SITE_URL } from '@/lib/appLinks';

export const dynamic = 'force-dynamic';

/**
 * Превʼю посилання на допис/рілс для месенджерів і соцмереж (Telegram, Viber, WhatsApp, iMessage...): автор, текст, постер.
 * Показуємо лише те, що й так бачить гість у публічній стрічці (не прихований, не закритий, не зі спільноти, автор не приватний).
 * Баннер iOS «Відкрити» зʼявляється, коли задано NEXT_PUBLIC_APP_STORE_URL (id застосунку береться з посилання).
 */
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const brand = 'Свій для Своїх';
  const fallback: Metadata = { title: brand, robots: { index: false, follow: false } };
  try {
    const id = parseId(params.id);
    if (!id) return fallback;
    const hidden = await getPrivateAuthorIdsHiddenFrom(0);
    const post = await prisma.post.findFirst({
      where: { id, isHidden: false, isPrivate: false, clubId: null, author: { isActive: true }, ...(hidden.length ? { authorId: { notIn: hidden } } : {}) },
      select: {
        content: true,
        images: { take: 1, orderBy: { position: 'asc' }, select: { url: true } },
        videos: { take: 1, where: { status: 'ready' }, orderBy: { position: 'asc' }, select: { posterUrl: true } },
        author: { select: { firstName: true, lastName: true } },
      },
    });
    if (!post) return fallback;
    const author = `${post.author.firstName ?? ''} ${post.author.lastName ?? ''}`.trim() || brand;
    const text = (post.content || '').replace(/\s+/g, ' ').trim();
    const description = text ? (text.length > 140 ? `${text.slice(0, 137)}…` : text) : brand;
    const rawImage = post.videos[0]?.posterUrl || post.images[0]?.url || '';
    const image = rawImage ? (rawImage.startsWith('http') ? rawImage : `${SITE_URL}${rawImage}`) : '';
    const url = `${SITE_URL}/feed/${id}`;
    const appId = /id(\d+)/.exec(APP_STORE_URL)?.[1];
    return {
      title: `${author} — ${brand}`,
      description,
      robots: { index: false, follow: false },
      openGraph: { title: `${author} — ${brand}`, description, url, siteName: brand, type: 'article', ...(image ? { images: [{ url: image }] } : {}) },
      twitter: { card: image ? 'summary_large_image' : 'summary', title: `${author} — ${brand}`, description, ...(image ? { images: [image] } : {}) },
      ...(appId ? { other: { 'apple-itunes-app': `app-id=${appId}, app-argument=${url}` } } : {}),
    };
  } catch {
    return fallback;
  }
}

export default function FeedPostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
