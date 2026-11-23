// @ts-nocheck
/** Removes DB references to image files that do not exist on disk (folder_images, projects.banner_url),
 *  so that fill-folder-images can refill them. Existing (working) images are never touched. */
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

for (const f of ['.env.local', '.env']) {
  let t = ''; try { t = fs.readFileSync(path.join(process.cwd(), f), 'utf8'); } catch { continue; }
  for (const k of ['UPLOADS_DIR', 'DATABASE_URL']) { const m = t.match(new RegExp('^\\s*' + k + '\\s*=\\s*"?([^"\\r\\n]+)"?', 'm')); if (m && !process.env[k]) process.env[k] = m[1].trim(); }
}
const root = process.env.UPLOADS_DIR || path.join(process.cwd(), 'public', 'uploads');
const exists = (url: string) => !url || !url.startsWith('/uploads/') || fs.existsSync(path.join(root, url.replace(/^\/uploads\//, '')));
const prisma = new PrismaClient();
(async () => {
  console.log('Uploads folder:', root);
  const fi = await prisma.folderImage.findMany();
  // seed_f_* — згенеровані скриптом сіда плакати з текстом: замінюємо їх фото; завантажені вручну не чіпаємо
  const bad = fi.filter((r) => !exists(r.imageUrl) || /seed_f_/.test(r.imageUrl));
  for (const r of bad) await prisma.folderImage.deleteMany({ where: { project: r.project, path: r.path } });
  const pr = await prisma.project.findMany({ select: { slug: true, bannerUrl: true } });
  let nb = 0;
  for (const p of pr) if (p.bannerUrl && !exists(p.bannerUrl)) { await prisma.project.update({ where: { slug: p.slug }, data: { bannerUrl: null } }); nb++; }
  console.log(`Broken folder images removed: ${bad.length} of ${fi.length}; broken project banners cleared: ${nb}`);
})().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
