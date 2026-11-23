// @ts-nocheck
/**
 * Автопідбір картинок для папок проєктів з безкоштовного стоку Pixabay або Pexels (ліцензії дозволяють
 * безкоштовне використання без обов'язкової атрибуції).
 *
 *   $env:PIXABAY_API_KEY="ваш_ключ"    (безкоштовно, одразу: https://pixabay.com/api/docs/ — ключ видно на сторінці після входу)
 *   npx tsx scripts/fill-folder-images.ts                    # лише папки БЕЗ картинки (ваші ручні не чіпає)
 *   npx tsx scripts/fill-folder-images.ts --project=dating   # один проєкт
 *   npx tsx scripts/fill-folder-images.ts --top              # лише папки верхнього рівня
 *   npx tsx scripts/fill-folder-images.ts --banners          # лише банери карток проєктів (сторінка «Проєкти»)
 *   npx tsx scripts/fill-folder-images.ts --force            # перезаписати й наявні
 *   npx tsx scripts/fill-folder-images.ts --dry              # лише показати запити, нічого не качати
 *   npx tsx scripts/fill-folder-images.ts --force --only=pets/vet   # перезробити одну папку
 * Точні запити: scripts/folder-image-queries.json (правте й запускайте --force). Звіт: folder-images-report.tsv
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
    for (const k of ['UPLOADS_DIR', 'DATABASE_URL', 'PEXELS_API_KEY', 'PIXABAY_API_KEY']) {
      const m = txt.match(new RegExp('^\\s*' + k + '\\s*=\\s*"?([^"\\r\\n]+)"?', 'm'));
      if (m && !process.env[k]) process.env[k] = m[1].trim();
    }
  }
}
readEnv();

const args = process.argv.slice(2);
const flag = (n: string) => args.includes('--' + n);
const opt = (n: string) => (args.find((a) => a.startsWith('--' + n + '=')) || '').split('=')[1];
const PIX = process.env.PIXABAY_API_KEY;
const KEY = process.env.PEXELS_API_KEY;
if (!PIX && !KEY && !flag('dry')) { console.error('Немає ключа. Найпростіше Pixabay (безкоштовно, одразу): https://pixabay.com/api/docs/ → задайте $env:PIXABAY_API_KEY="..."  (або PEXELS_API_KEY)'); process.exit(1); }

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

// ---- кеш пошуку на 24 год (вимога Pixabay) ----
const cacheFile = path.join(process.cwd(), '.folder-images-cache.json');
let sc: Record<string, { t: number; v: any[] }> = {};
try { sc = JSON.parse(fs.readFileSync(cacheFile, 'utf8')); } catch { sc = {}; }
const saveCache = () => { try { fs.writeFileSync(cacheFile, JSON.stringify(sc)); } catch { /* ignore */ } };

const Q = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts', 'folder-image-queries.json'), 'utf8'));
const THEME: Record<string, string> = Q._theme || {};
const GENERIC: Record<string, string> = Q._generic || {};

async function search(q: string) {
  const hit = sc[q];
  if (hit && Date.now() - hit.t < 24 * 3600 * 1000) return hit.v;
  const url = PIX
    ? 'https://pixabay.com/api/?key=' + PIX + '&image_type=photo&orientation=horizontal&safesearch=true&min_width=800&per_page=30&lang=en&q=' + encodeURIComponent(q.slice(0, 100))
    : 'https://api.pexels.com/v1/search?per_page=15&orientation=landscape&size=medium&query=' + encodeURIComponent(q);
  const r = await fetch(url, PIX ? {} : { headers: { Authorization: KEY! } });
  if (r.status === 429) { console.error('Ліміт запитів. Запустіть пізніше — вже збережене не втрачається.'); saveCache(); throw new Error('rate'); }
  if (!r.ok) { console.error('API', r.status, q); return []; }
  const j: any = await r.json();
  const v = PIX
    ? (j.hits || []).map((h: any) => ({ id: h.id, url: h.largeImageURL || h.webformatURL, tags: h.tags, page: h.pageURL }))
    : (j.photos || []).map((x: any) => ({ id: x.id, url: x.src.large, tags: x.alt || '', page: x.url }));
  sc[q] = { t: Date.now(), v };
  await sleep(PIX ? 700 : 350);
  return v;
}

const clean = (l: string) => l.replace(/[“”"«»:.,()]/g, ' ').replace(/\b(online|offline|other|others|apply|create|cabinet|submit|a|an|the|and|for|of|your|our|with|us)\b/gi, ' ').replace(/\s+/g, ' ').trim();

/** Запити для папки в порядку пріоритету. */
function queriesFor(slug: string, p: string, label: string, parentQs: string[]): { qs: string[]; generic: boolean } {
  const last = p.split('.').pop()!;
  const own = Q[slug + '/' + p];
  if (own) return { qs: [own], generic: false };
  if ((last === 'other' || last === 'list') && parentQs.length) return { qs: parentQs, generic: false };
  if (last === 'shop' && parentQs.length) return { qs: [`${parentQs[0]} shop`, ...parentQs], generic: false };
  if (GENERIC[last]) return { qs: [GENERIC[last]], generic: true };
  const theme = THEME[slug] || '';
  const c = clean(label);
  const short = c.split(' ').length <= 1;
  return { qs: [short ? `${c} ${theme}`.trim() : c, `${c} ${theme}`.trim(), ...parentQs.slice(0, 1), theme].filter(Boolean), generic: false };
}

async function banners() {
  const only = opt('project');
  const B: Record<string, string> = Q._banner || {};
  const projects = await prisma.project.findMany({ select: { slug: true, bannerUrl: true } });
  let n = 0;
  for (const pr of projects) {
    if (only && pr.slug !== only) continue;
    if (pr.bannerUrl && !flag('force')) continue;
    const q = B[pr.slug] || THEME[pr.slug] || pr.slug.replace(/-/g, ' ');
    if (flag('dry')) { console.log(`БАНЕР ${pr.slug} → "${q}"`); continue; }
    const list = await search(q);
    const photo = list[0];
    if (!photo) { console.log('— немає банера: ' + pr.slug); continue; }
    const file = `project-${pr.slug}-${photo.id}.jpg`;
    const dest = path.join(outDir, file);
    if (!fs.existsSync(dest)) {
      const buf = Buffer.from(await (await fetch(photo.url)).arrayBuffer());
      await sharp(buf).resize(1200, 600, { fit: 'cover' }).jpeg({ quality: 78 }).toFile(dest);
    }
    await prisma.project.update({ where: { slug: pr.slug }, data: { bannerUrl: '/uploads/misc/' + file } });
    n++;
  }
  saveCache();
  console.log(`Банери проєктів: ${n}`);
}

async function main() {
  if (flag('banners')) { await banners(); return; }
  await banners();
  const only = opt('project');
  const one = opt('only'); // slug/path
  const existing = await prisma.folderImage.findMany();
  const have = new Set(existing.map((e) => e.project + '|' + e.path));
  const report: string[] = ['project/path\tquery\tphoto\ttags\tpage'];
  const genericFile: Record<string, string> = {};

  let done = 0, skipped = 0, miss = 0;
  for (const slug of Object.keys(PROJECT_FOLDERS)) {
    if (only && slug !== only) continue;
    const used = new Set<number>();
    const walk = async (nodes: any[], trail: string[], parentQs: string[]) => {
      for (const n of nodes) {
        const p = trail.concat(n.key).join('.');
        const label = en(n.labelKey) || n.key;
        const { qs, generic } = queriesFor(slug, p, label, parentQs);
        const skipHere = (flag('top') && trail.length) || (one && one !== slug + '/' + p);
        if (!skipHere) {
          if (have.has(slug + '|' + p) && !flag('force')) { skipped++; }
          else if (flag('dry')) { console.log(`${slug}/${p} → "${qs[0]}"${generic ? ' (спільна)' : ''}`); done++; }
          else {
            let photo: any = null, usedQ = '';
            if (generic && genericFile[qs[0]]) { photo = genericFile[qs[0]]; usedQ = qs[0]; }
            else {
              for (const q of qs) {
                const list = await search(q);
                photo = generic ? list[0] : list.find((x: any) => !used.has(x.id));
                if (photo) { usedQ = q; break; }
              }
            }
            if (!photo) { miss++; console.log(`— немає знімка: ${slug}/${p} (${label})`); }
            else {
              const isFile = typeof photo === 'string';
              const file = isFile ? photo : `folder-${photo.id}.jpg`;
              if (!isFile) {
                used.add(photo.id);
                const dest = path.join(outDir, file);
                if (!fs.existsSync(dest)) {
                  const buf = Buffer.from(await (await fetch(photo.url)).arrayBuffer());
                  await sharp(buf).resize(800, 600, { fit: 'cover' }).jpeg({ quality: 78 }).toFile(dest);
                }
                if (generic) genericFile[qs[0]] = file;
                report.push(`${slug}/${p}\t${usedQ}\t${photo.id}\t${photo.tags || ''}\t${photo.page || ''}`);
              } else report.push(`${slug}/${p}\t${usedQ}\t(спільна)\t\t`);
              const imageUrl = '/uploads/misc/' + file;
              await prisma.folderImage.upsert({ where: { project_path: { project: slug, path: p } }, create: { project: slug, path: p, imageUrl }, update: { imageUrl } });
              done++;
              if (done % 25 === 0) { console.log(`… ${done} готово`); saveCache(); }
            }
          }
        }
        if (n.children) await walk(n.children, trail.concat(n.key), qs);
      }
    };
    await walk(PROJECT_FOLDERS[slug], [], []);
  }
  saveCache();
  if (!flag('dry')) { try { fs.writeFileSync(path.join(process.cwd(), 'folder-images-report.tsv'), report.join('\n')); } catch { /* ignore */ } }
  console.log(`Готово: ${done}, пропущено (вже є): ${skipped}, без знімка: ${miss}. Папка: ${outDir}`);
  console.log('Звіт (запит → фото → теги): folder-images-report.tsv. Фото: Pixabay/Pexels, вільна ліцензія.');
}
main().catch((e) => { console.error(e.message === 'rate' ? '' : e); process.exit(1); }).finally(() => prisma.$disconnect());
