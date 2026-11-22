/** POST /api/project-suggestions { projectSlug, kind: suggestion|complaint|product|specialist|market|request|consult|calc, text } — пропозиція чи скарга до проєкту */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-middleware';
import { getApiT } from '@/i18n/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getProject } from '@/lib/projects';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const t = getApiT(request);
  const { user, error } = await requireAuth(request);
  if (error) return error;
  try {
    const userId = Number(user.userId);
    if (!checkRateLimit(`suggest:${userId}`, { interval: 60 * 60 * 1000, maxRequests: 10 }).allowed) {
      return NextResponse.json({ error: t('api.common.tooManyRequests') }, { status: 429 });
    }
    const body = await request.json().catch(() => ({}));
    const kind = ['suggestion', 'complaint', 'product', 'specialist', 'market', 'unlock', 'request', 'consult', 'calc'].includes(body?.kind) ? body.kind : '';
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    const slug = String(body?.projectSlug || '');
    if (!kind || text.length < 5 || text.length > 1000 || !(kind === 'unlock' && slug === 'platform') && !(await getProject(slug))) {
      return NextResponse.json({ error: t('api.common.invalidData') }, { status: 400 });
    }
    await prisma.projectSuggestion.create({ data: { userId, projectSlug: slug, kind, text } });
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    console.error('[project-suggestions POST]', e);
    return NextResponse.json({ error: t('api.common.serverError') }, { status: 500 });
  }
}
