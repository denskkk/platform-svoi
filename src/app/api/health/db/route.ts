import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function maskDatabaseUrl(raw?: string) {
  if (!raw) return 'NOT_SET';
  try {
    const norm = raw.replace(/^postgresql:\/\//, 'postgres://');
    const u = new URL(norm);
    return `${u.username || '(user)'}@${u.hostname}/${u.pathname.replace(/\//,'')}`;
  } catch {
    return 'UNPARSEABLE';
  }
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const masked = maskDatabaseUrl(process.env.DATABASE_URL);
  let connectivity: 'ok' | 'fail' | 'skipped' = 'skipped';
  let error: string | null = null;
  if (process.env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      connectivity = 'ok';
    } catch (e: any) {
      connectivity = 'fail';
      error = e?.message || 'Unknown error';
    }
  } else {
    error = 'DATABASE_URL not set in process.env';
  }
  return NextResponse.json({
    database: masked,
    connectivity,
    error,
    nodeEnv: process.env.NODE_ENV,
  });
}
