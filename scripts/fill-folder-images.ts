// @ts-nocheck
/**
 * Автопідбір картинок для папок проєктів з безкоштовного стоку Pexels (ліцензія дозволяє
 * безкоштовне використання без обов'язкової атрибуції).
 *
 *   $env:PEXELS_API_KEY="ваш_ключ"     (безкоштовно: https://www.pexels.com/api/ — реєстрація 1 хв)
 *   npx tsx scripts/fill-folder-images.ts                    # лише папки БЕЗ картинки (ваші ручні не чіпає)
 *   npx tsx scripts/fill-folder-images.ts --project=dating   # один проєкт
 *   npx tsx scripts/fill-folder-images.ts --top              # лише папки верхнього рівня
 *   npx tsx scripts/fill-folder-images.ts --force            # перезаписати й наявні
 *   npx tsx scripts/fill-folder-images.ts --dry              # лише показати запити, нічого не качати
 *
 * Файли лягають у <UPLOADS_DIR>/misc, адреси — у таблицю folder_images (як з адмінки).
 */
import { PrismaClient } from '@prisma/client';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { PROJECT_FOLDERS } from '../src/lib/projectFolders';

function readEnv() {
  for (const f of ['.env.local', '.env']) {
    let txt = '';
    try { txt = fs.readFileSync(path.join(process.cwd(), f), 'utf8'); } catch { continue; }
    for (const k of ['UPLOADS_DIR', 'DATABASE_URL', 'PEXELS_API_KEY']) {
      const m = txt.match(new RegExp('^\\s*' + k + '\\s*=\\s*"?([^"\\r\\n]+)"?', 'm'));
      if (m && !process.env[k]) process.env[k] = m[1].trim();
    }
  }
}
readEnv();

const args = process.argv.slice(2);
const flag = (n: string) => args.includes('--' + n);
const opt = (n: string) => (args.find((a) => a.startsWith('--' + n + '=')) || '').split('=')[1];
const KEY = process.env.PEXELS_API_KEY;
if (!KEY && !flag('dry')) { console.error('Немає PEXELS_API_KEY. Отримайте безкоштовний ключ на https://www.pexels.com/api/ і задайте: $env:PEXELS_API_KEY="..."'); process.exit(1); }

const prisma = new PrismaClient();
const root = process.env.UPLOADS_DIR || path.join(process.cwd(), 'public', 'uploads');
const outDir = path.join(root, 'misc');
fs.mkdirSync(outDir, { recursive: true });

// ---- англійські підписи з messages/en/<namespace>.json ----
const cache: Record<string, any> = {};
function en(key: string): string {
  const [ns, ...rest] = key.split('.');
  try {
    cache[ns] = cache[ns] || JSON.parse(fs.readFileSync(path.join(process.cwd(), 'messages', 'en', ns + '.json'), 'utf8'));
    let v = cache[ns];
    for (const p of rest) v = v?.[p];
    return typeof v === 'string' ? v : '';
  } catch { return ''; }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const results: Record<string, any[]> = {};
const used = new Set<number>();
let calls = 0;

async function search(q: string) {
  if (results[q]) return results[q];
  calls++;
  const r = await fetch('https://api.pexels.com/v1/search?per_page=15&orientation=landscape&size=medium&query=' + encodeURIComponent(q), { headers: { Authorization: KEY! } });
  if (r.status === 429) { console.error('Ліміт Pexels (200 запитів/год). Запустіть пізніше — вже збережене не втрачається.'); throw new Error('rate'); }
  if (!r.ok) { console.error('Pexels', r.status, q); results[q] = []; return []; }
  const j: any = await r.json();
  results[q] = j.photos || [];
  await sleep(350);
  return results[q];
}

async function main() {
  const only = opt('project');
  const projects = await prisma.project.findMany({ select: { slug: true, nameEn: true } });
  const names: Record<string, string> = {}; projects.forEach((p) => { names[p.slug] = p.nameEn; });
  const existing = await prisma.folderImage.findMany();
  const have = new Set(existing.map((e) => e.project + '|' + e.path));

  let done = 0, skipped = 0, miss = 0;
  for (const slug of Object.keys(PROJECT_FOLDERS)) {
    if (only && slug !== only) continue;
    const walk = async (nodes: any[], trail: string[]) => {
      for (const n of nodes) {
        const p = trail.concat(n.key).join('.');
        const label = en(n.labelKey) || n.key;
        if (!(flag('top') && trail.length)) {
          if (have.has(slug + '|' + p) && !flag('force')) { skipped++; }
          else {
            const proj = names[slug] || slug.replace(/-/g, ' ');
            const queries = [label, `${label} ${proj}`, proj];
            if (flag('dry')) { console.log(`${slug}/${p} → "${queries[0]}"`); done++; }
            else {
              let photo: any = null;
              for (const q of queries) {
                const list = await search(q);
                photo = list.find((x) => !used.has(x.id));
                if (photo) break;
              }
              if (!photo) { miss++; console.log(`— немає знімка: ${slug}/${p} (${label})`); }
              else {
                used.add(photo.id);
                const buf = Buffer.from(await (await fetch(photo.src.large)).arrayBuffer());
                const file = `folder-${slug}-${p.replace(/\./g, '-')}-${photo.id}.jpg`;
                await sharp(buf).resize(800, 600, { fit: 'cover' }).jpeg({ quality: 78 }).toFile(path.join(outDir, file));
                const imageUrl = '/uploads/misc/' + file;
                await prisma.folderImage.upsert({ where: { project_path: { project: slug, path: p } }, create: { project: slug, path: p, imageUrl }, update: { imageUrl } });
                done++;
                if (done % 10 === 0) console.log(`… ${done} готово`);
              }
            }
          }
        }
        if (n.children) await walk(n.children, trail.concat(n.key));
      }
    };
    await walk(PROJECT_FOLDERS[slug], []);
  }
  console.log(`Готово: ${done}, пропущено (вже є): ${skipped}, без знімка: ${miss}. Папка: ${outDir}`);
  console.log('Фото: Pexels (pexels.com), вільна ліцензія. Змінити будь-яку можна в адмінці.');
}
main().catch((e) => { console.error(e.message === 'rate' ? '' : e); process.exit(1); }).finally(() => prisma.$disconnect());
