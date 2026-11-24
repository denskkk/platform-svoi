// Builds Play Store images (1080x1920: gradient, headline, phone frame) from raw device captures.
// Usage: FONT_DIR=/dir/with/Roboto-Bold.ttf node materials/google_play/compose_screenshots.mjs
// Reads screenshots/v2/source/<name>.(png|jpg), writes screenshots/v2/<name>.png. Edit SCREENS to change texts.
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

const DIR = path.join(root, 'materials/google_play/screenshots/v2');
const SCREENS = [
  ['01_feed', 'Діліться новинами', 'зі своєю спільнотою'],
  ['02_reels', 'Дивіться короткі відео', 'від своїх людей'],
  ['03_projects', 'Усе для своїх', 'в одному місці'],
  ['04_account', 'Ваш профіль', 'та ваша спільнота'],
  ['06_chat_list', 'Спілкуйтеся напряму', 'зі своїми', { file: '06_chat_list.jpg' }], // iPhone capture, 570 px wide
];
const W = 1080, H = 1920, FX = 171, FY = 370, FW = 740, FH = 1500, B = 10, R = 64;
const IW = FW - 2 * B, IH = FH - 2 * B; // inner screenshot area 720x1480
const rect = (w, h, r, fill) => Buffer.from(`<svg width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" fill="${fill}"/></svg>`);

for (const [name, line1, line2, opts = {}] of SCREENS) {
  const src = path.join(DIR, 'source', opts.file ?? `${name}.png`);
  const { width } = await sharp(src).metadata();
  const top = Math.round(130 * width / 1080); // status bar is ~130 px at 1080 px width
  const cropH = Math.round(IH * width / IW);
  const shot = await sharp(src).extract({ left: 0, top, width, height: cropH }).resize(IW, IH)
    .composite([{ input: rect(IW, IH, R - B, '#fff'), blend: 'dest-in' }]).png().toBuffer();
  const bg = Buffer.from(`<svg width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#bfddff"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
    <g font-family="Roboto" font-weight="700" font-size="76" text-anchor="middle">
      <text x="540" y="185" fill="#2b2118">${line1}</text><text x="540" y="275" fill="#0057b7">${line2}</text></g></svg>`);
  const PAD = 60; // room for the blur so the shadow isn't clipped into a hard-edged box
  const shadow = await sharp(Buffer.from(`<svg width="${FW + 2 * PAD}" height="${FH + 2 * PAD}"><rect x="${PAD}" y="${PAD}" width="${FW}" height="${FH}" rx="${R}" fill="#000" fill-opacity="0.25"/></svg>`)).blur(18).png().toBuffer();
  await sharp(bg).composite([
    { input: shadow, left: FX - PAD, top: FY + 14 - PAD },
    { input: rect(FW, FH, R, '#fff'), left: FX, top: FY },
    { input: shot, left: FX + B, top: FY + B },
  ]).flatten({ background: '#fff' }).png().toFile(path.join(DIR, `${name}.png`));
  console.log('wrote', name);
}
