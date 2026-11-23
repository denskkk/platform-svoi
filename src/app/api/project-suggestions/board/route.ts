/**
 * GET /api/project-suggestions/board?projectSlug=&kind=market&q=&country= — публічна дошка заявок, які адміністрація опублікувала
 * (статус «published»). Контакти (телефон, пошта, фото-файли) і автор НЕ віддаються: зв'язок лише через пропозицію покупця / повідомлення платформи.
 */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getApiT } from '@/i18n/server';

export const dynamic = 'force-dynamic';
const KINDS = ['market', 'request'];

/** Прибирає з тексту заявки все приватне: телефон, e-mail, посилання на файли */
function publicText(text: string): string {
  return text
    .split('|').map((x) => x.trim())
    // i18n-ignore: службові назви полів у збережених заявках
    .filter((x) => x && !/\/uploads\//.test(x) && !/^(телефон|phone|e-?mail|email|електронна пошта|контактна особа|contact person|назва господарства|company)\s*:/i.test(x))
    .join(' | ').replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '…').replace(/\+?\d[\d ()-]{7,}\d/g, '…').slice(0, 800);
}

export async function GET(request: NextRequest) {
  const t = getApiT(request);
  try {
    const sp = new URL(request.url).searchParams;
    const slug = (sp.get('projectSlug') || '').slice(0, 60);
    const kind = KINDS.includes(sp.get('kind') || '') ? String(sp.get('kind')) : 'market';
    const q = (sp.get('q') || '').trim().slice(0, 80);
    const country = (sp.get('country') || '').trim().slice(0, 60);
    if (!slug) return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    const and: any[] = [];
    if (q) and.push({ text: { contains: q, mode: 'insensitive' } });
    if (country) and.push({ text: { contains: country, mode: 'insensitive' } });
    const rows = await prisma.projectSuggestion.findMany({
      where: { projectSlug: slug, kind, status: 'published', ...(and.length ? { AND: and } : {}) },
      orderBy: { id: 'desc' }, take: 50, select: { id: true, text: true, createdAt: true },
    });
    return NextResponse.json({ items: rows.map((r: any) => ({ id: r.id, text: publicText(r.text), createdAt: r.createdAt })) });
  } catch (e) {
    console.error('[project-suggestions board]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
