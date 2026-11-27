// Заповнює width/height/is_vertical для вже оброблених відео. Запуск на VPS у папці проєкту:  node scripts/backfill-video-dims.mjs
// Потрібні ffprobe, DATABASE_URL (з .env) і UPLOADS_DIR (за замовчуванням ./public/uploads або як у проєкті).
import { PrismaClient } from '@prisma/client';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const prisma = new PrismaClient();
const root = process.env.UPLOADS_DIR || join(process.cwd(), 'public', 'uploads');
const rows = await prisma.postVideo.findMany({ where: { status: 'ready', isVertical: null, url: { not: null } }, select: { id: true, url: true } });
let ok = 0, miss = 0;
for (const v of rows) {
  const rel = String(v.url).replace(/^\/uploads\//, '');
  const file = [join(root, rel), join(root, '..', String(v.url).replace(/^\//, ''))].find(existsSync);
  if (!file) { miss++; continue; }
  try {
    const out = execFileSync(process.env.FFPROBE_PATH || 'ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', file]).toString().trim();
    const [w, h] = out.split(',').map(Number);
    if (w > 0 && h > 0) { await prisma.postVideo.update({ where: { id: v.id }, data: { width: w, height: h, isVertical: h > w } }); ok++; }
  } catch { miss++; }
}
console.log(`updated ${ok}, skipped ${miss}, total ${rows.length}`);
await prisma.$disconnect();
