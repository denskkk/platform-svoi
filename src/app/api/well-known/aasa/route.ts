/**
 * /.well-known/apple-app-site-association (через rewrite у next.config.js) — universal links для iOS.
 * Потрібна змінна APPLE_TEAM_ID (10 символів із developer.apple.com → Membership). Без неї — 404.
 */
import { NextResponse } from 'next/server';
import { APP_PATH_PREFIXES, IOS_BUNDLE_ID } from '@/lib/appLinks';

export const dynamic = 'force-dynamic';

export async function GET() {
  const team = (process.env.APPLE_TEAM_ID || '').trim();
  if (!/^[A-Z0-9]{10}$/.test(team)) return new NextResponse('Not configured', { status: 404 });
  const appID = `${team}.${IOS_BUNDLE_ID}`;
  const paths = APP_PATH_PREFIXES.map((p) => (p.endsWith('/') ? `${p}*` : `${p}*`));
  const body = {
    applinks: {
      apps: [],
      details: [{ appID, appIDs: [appID], paths, components: paths.map((p) => ({ '/': p })) }],
    },
  };
  return new NextResponse(JSON.stringify(body), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' } });
}
