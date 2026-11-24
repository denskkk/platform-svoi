// Builds App Store iPhone (1179x2556) and iPad (2064x2752) images ( gradient, headline, phone frame, v1 layout) from raw device captures.
// Usage: FONT_DIR=/dir/with/Roboto-Bold.ttf node materials/app_store/compose_screenshots.mjs
// Reads screenshots/v2/source/<name>.png, writes screenshots/v2/{iphone_6.9,ipad_13}/<name>.png. Edit SCREENS to change texts.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FONT_DIR = process.env.FONT_DIR;
if (!FONT_DIR) throw new Error('Set FONT_DIR to a folder containing Roboto-Bold.ttf (needed for Cyrillic headlines).');
const conf = path.join(os.tmpdir(), 'compose-fonts.conf'); // librsvg finds fonts only through fontconfig
fs.writeFileSync(conf, `<?xml version="1.0"?><fontconfig><dir>${FONT_DIR}</dir><cachedir>${os.tmpdir()}/compose-fc</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = conf;
const sharp = createRequire(path.join(root, 'package.json'))('sharp'); // after FONTCONFIG_FILE is set

const DIR = path.join(root, 'materials/app_store/screenshots/v2');
const SCREENS = [
  ['01_feed', 'Діліться новинами', 'зі своєю спільнотою'],
  ['02_reels', 'Дивіться короткі відео', 'від своїх людей'],
  ['03_projects', 'Усе для своїх', 'в одному місці'],
  ['04_account', 'Ваш профіль', 'та ваша спільнота'],
  ['05_create_content_sheet', 'Створюйте контент', 'за кілька дотиків'],
  ['06_chat_list', 'Спілкуйтеся напряму', 'зі своїми'],
];
// phone frame keeps v1's proportions on both targets; iPad is 2064x2752, so the frame is centred
const TARGETS = [
  { dir: 'iphone_6.9', W: 1179, H: 2556, FX: 186, FY: 636, FW: 807, FH: 1637, B: 11, R: 70, size: 88, y1: 435, y2: 535 },
  { dir: 'ipad_13', W: 2064, H: 2752, FX: 549, FY: 640, FW: 966, FH: 1960, B: 13, R: 84, size: 112, y1: 340, y2: 470 },
];
const rect = (w, h, r, fill) => Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" fill="${fill}"/></svg>`);

for (const { dir, W, H, FX, FY, FW, FH, B, R, size, y1, y2 } of TARGETS)
for (const [name, line1, line2] of SCREENS) {
  const IW = FW - 2 * B, IH = FH - 2 * B; // inner screenshot area
  const src = path.join(DIR, 'source', `${name}.png`);
  const { width, height } = await sharp(src).metadata();
  const top = Math.round(130 * width / 1080); // status bar is ~130 px at 1080 px width
  const cropH = Math.min(Math.round(IH * width / IW), height - top);
  const shot = await sharp(src).extract({ left: 0, top, width, height: cropH }).resize(IW, IH)
    .composite([{ input: rect(IW, IH, R - B, '#fff'), blend: 'dest-in' }]).png().toBuffer();
  const bg = Buffer.from(`<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#bfddff"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <g font-family="Roboto" font-weight="700" font-size="${size}" text-anchor="middle">
      <text x="${W / 2}" y="${y1}" fill="#2b2118">${line1}</text><text x="${W / 2}" y="${y2}" fill="#0057b7">${line2}</text></g></svg>`);
  const PAD = 70; // room for the blur so the shadow isn't clipped into a hard-edged box
  const shadow = await sharp(Buffer.from(`<svg width="${FW + 2 * PAD}" height="${FH + 2 * PAD}"><rect x="${PAD}" y="${PAD}" width="${FW}" height="${FH}" rx="${R}" fill="#000" fill-opacity="0.25"/></svg>`)).blur(20).png().toBuffer();
  await sharp(bg).composite([
    { input: shadow, left: FX - PAD, top: FY + 16 - PAD },
    { input: rect(FW, FH, R, '#fff'), left: FX, top: FY },
    { input: shot, left: FX + B, top: FY + B },
  ]).flatten({ background: '#fff' }).png().toFile(path.join(DIR, dir, `${name}.png`));
  console.log('wrote', dir, name);
}
