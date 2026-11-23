/**
 * /.well-known/assetlinks.json (через rewrite у next.config.js) — app links для Android.
 * Потрібна змінна ANDROID_CERT_SHA256: SHA-256 відбиток сертифіката підпису (Play Console → Цілісність застосунку → «Ключ підпису»);
 * можна кілька через кому (ключ підпису Play + ключ завантаження). Без неї — 404.
 */
import { NextResponse } from 'next/server';
import { ANDROID_PACKAGE } from '@/lib/appLinks';

export const dynamic = 'force-dynamic';

export async function GET() {
  const prints = (process.env.ANDROID_CERT_SHA256 || '').split(',').map((s) => s.trim().toUpperCase()).filter((s) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(s));
  if (!prints.length) return new NextResponse('Not configured', { status: 404 });
  const body = [{ relation: ['delegate_permission/common.handle_all_urls'], target: { namespace: 'android_app', package_name: ANDROID_PACKAGE, sha256_cert_fingerprints: prints } }];
  return new NextResponse(JSON.stringify(body), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' } });
}
