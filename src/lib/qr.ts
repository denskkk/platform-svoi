/**
 * Мінімальний генератор QR-коду (байтовий режим, рівень виправлення M, версії 1–10).
 * Повертає квадратну матрицю модулів (true = темний). Без зовнішніх залежностей.
 */

// Кількість блоків/кодових слів для рівня M: [ecPerBlock, [count, dataWords]...]
const EC_M: Record<number, { ec: number; groups: [number, number][] }> = {
  1: { ec: 10, groups: [[1, 16]] },
  2: { ec: 16, groups: [[1, 28]] },
  3: { ec: 26, groups: [[1, 44]] },
  4: { ec: 18, groups: [[2, 32]] },
  5: { ec: 24, groups: [[2, 43]] },
  6: { ec: 16, groups: [[4, 27]] },
  7: { ec: 18, groups: [[4, 31]] },
  8: { ec: 22, groups: [[2, 38], [2, 39]] },
  9: { ec: 22, groups: [[3, 36], [2, 37]] },
  10: { ec: 26, groups: [[4, 43], [1, 44]] },
};
const ALIGN: Record<number, number[]> = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34], 7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50] };

const EXP = new Array<number>(512);
const LOG = new Array<number>(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11d; }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function rsGenerator(degree: number): number[] {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= poly[j] === 0 ? 0 : EXP[LOG[poly[j]] + i];
    }
    poly = next;
  }
  return poly;
}

function rsRemainder(data: number[], ecLen: number): number[] {
  const gen = rsGenerator(ecLen);
  const res = new Array(ecLen).fill(0);
  for (const b of data) {
    const factor = b ^ res[0];
    res.shift();
    res.push(0);
    if (factor !== 0) for (let i = 0; i < ecLen; i++) res[i] ^= gen[i + 1] === 0 ? 0 : EXP[LOG[gen[i + 1]] + LOG[factor]];
  }
  return res;
}

function bchFormat(data: number): number {
  let v = data << 10;
  for (let i = 14; i >= 10; i--) if ((v >> i) & 1) v ^= 0x537 << (i - 10);
  return ((data << 10) | v) ^ 0x5412;
}
function bchVersion(version: number): number {
  let v = version << 12;
  for (let i = 17; i >= 12; i--) if ((v >> i) & 1) v ^= 0x1f25 << (i - 12);
  return (version << 12) | v;
}

export function makeQr(text: string): boolean[][] {
  const bytes = Array.from(new TextEncoder().encode(text));
  let version = 0;
  for (let v = 1; v <= 10; v++) {
    const cap = EC_M[v].groups.reduce((s, [n, d]) => s + n * d, 0);
    const countBits = v < 10 ? 8 : 16;
    if (4 + countBits + bytes.length * 8 <= cap * 8) { version = v; break; }
  }
  if (!version) throw new Error('QR: text too long');
  const spec = EC_M[version];
  const totalData = spec.groups.reduce((s, [n, d]) => s + n * d, 0);

  // Бітовий потік: режим 0100, довжина, дані, термінатор, вирівнювання
  const bits: number[] = [];
  const push = (val: number, len: number) => { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  push(0b0100, 4);
  push(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) push(b, 8);
  push(0, Math.min(4, totalData * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const words: number[] = [];
  for (let i = 0; i < bits.length; i += 8) words.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let pad = 0xec; words.length < totalData; pad ^= 0xec ^ 0x11) words.push(pad);

  // Розбиття на блоки + корекція помилок + чергування
  const blocks: { data: number[]; ec: number[] }[] = [];
  let pos = 0;
  for (const [n, d] of spec.groups) for (let i = 0; i < n; i++) {
    const data = words.slice(pos, pos + d); pos += d;
    blocks.push({ data, ec: rsRemainder(data, spec.ec) });
  }
  const maxData = Math.max(...blocks.map((b) => b.data.length));
  const out: number[] = [];
  for (let i = 0; i < maxData; i++) for (const b of blocks) if (i < b.data.length) out.push(b.data[i]);
  for (let i = 0; i < spec.ec; i++) for (const b of blocks) out.push(b.ec[i]);

  const size = 17 + 4 * version;
  const mod: (boolean | null)[][] = Array.from({ length: size }, () => new Array(size).fill(null));
  const reserved: boolean[][] = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (r: number, c: number, v: boolean) => { mod[r][c] = v; reserved[r][c] = true; };

  const finder = (r0: number, c0: number) => {
    for (let dr = -1; dr <= 7; dr++) for (let dc = -1; dc <= 7; dc++) {
      const r = r0 + dr, c = c0 + dc;
      if (r < 0 || c < 0 || r >= size || c >= size) continue;
      const inner = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 && (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
      set(r, c, inner);
    }
  };
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
  for (let i = 8; i < size - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const al = ALIGN[version];
  for (const r of al) for (const c of al) {
    if ((r === 6 && c === 6) || (r === 6 && c === al[al.length - 1]) || (r === al[al.length - 1] && c === 6)) continue;
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
  }
  set(size - 8, 8, true); // темний модуль
  // зарезервувати області формату та версії
  for (let i = 0; i < 9; i++) { if (!reserved[8][i]) set(8, i, false); if (!reserved[i][8]) set(i, 8, false); }
  for (let i = 0; i < 8; i++) { if (!reserved[8][size - 1 - i]) set(8, size - 1 - i, false); if (!reserved[size - 1 - i][8]) set(size - 1 - i, 8, false); }
  set(size - 8, 8, true);
  if (version >= 7) {
    const v = bchVersion(version);
    for (let i = 0; i < 18; i++) {
      const bit = ((v >> i) & 1) === 1;
      const a = Math.floor(i / 3), b = (i % 3) + size - 11;
      set(a, b, bit); set(b, a, bit);
    }
  }

  // Розміщення даних зигзагом
  const dataBits: number[] = [];
  for (const w of out) for (let i = 7; i >= 0; i--) dataBits.push((w >> i) & 1);
  const place = (mask: number): boolean[][] => {
    const m = mod.map((row) => row.slice());
    let idx = 0;
    let up = true;
    for (let col = size - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      for (let i = 0; i < size; i++) {
        const r = up ? size - 1 - i : i;
        for (let dc = 0; dc < 2; dc++) {
          const c = col - dc;
          if (reserved[r][c]) continue;
          let bit = idx < dataBits.length ? dataBits[idx] === 1 : false;
          idx++;
          const flip = [
            (r + c) % 2 === 0, r % 2 === 0, c % 3 === 0, (r + c) % 3 === 0,
            (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0, ((r * c) % 2) + ((r * c) % 3) === 0,
            (((r * c) % 2) + ((r * c) % 3)) % 2 === 0, (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
          ][mask];
          m[r][c] = flip ? !bit : bit;
        }
      }
      up = !up;
    }
    // формат (рівень M = 00)
    const f = bchFormat((0b00 << 3) | mask);
    const fb = (i: number) => ((f >> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) m[i][8] = fb(i);
    m[7][8] = fb(6); m[8][8] = fb(7); m[8][7] = fb(8);
    for (let i = 9; i < 15; i++) m[8][14 - i] = fb(i);
    for (let i = 0; i < 8; i++) m[8][size - 1 - i] = fb(i);
    for (let i = 8; i < 15; i++) m[size - 15 + i][8] = fb(i);
    m[size - 8][8] = true;
    return m.map((row) => row.map((v) => v === true));
  };

  const penalty = (m: boolean[][]): number => {
    let p = 0;
    for (let pass = 0; pass < 2; pass++) {
      for (let a = 0; a < size; a++) {
        let run = 1;
        for (let b = 1; b < size; b++) {
          const cur = pass ? m[b][a] : m[a][b], prev = pass ? m[b - 1][a] : m[a][b - 1];
          if (cur === prev) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1;
        }
      }
    }
    for (let r = 0; r < size - 1; r++) for (let c = 0; c < size - 1; c++) if (m[r][c] === m[r][c + 1] && m[r][c] === m[r + 1][c] && m[r][c] === m[r + 1][c + 1]) p += 3;
    const pat = [true, false, true, true, true, false, true, false, false, false, false];
    const rev = pat.slice().reverse();
    for (let r = 0; r < size; r++) for (let c = 0; c <= size - 11; c++) {
      let a = true, b = true, d = true, e = true;
      for (let k = 0; k < 11; k++) { if (m[r][c + k] !== pat[k]) a = false; if (m[r][c + k] !== rev[k]) b = false; if (m[c + k][r] !== pat[k]) d = false; if (m[c + k][r] !== rev[k]) e = false; }
      if (a || b) p += 40;
      if (d || e) p += 40;
    }
    let dark = 0;
    for (const row of m) for (const v of row) if (v) dark++;
    p += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10;
    return p;
  };

  let best: boolean[][] | null = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const m = place(mask);
    const sc = penalty(m);
    if (sc < bestScore) { bestScore = sc; best = m; }
  }
  return best as boolean[][];
}

/** SVG-рядок із QR-кодом (із «тихою зоною» в 4 модулі). */
export function qrSvg(text: string, px = 256): string {
  const m = makeQr(text);
  const n = m.length + 8;
  let d = '';
  m.forEach((row, r) => row.forEach((v, c) => { if (v) d += `M${c + 4} ${r + 4}h1v1h-1z`; }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" width="${px}" height="${px}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
