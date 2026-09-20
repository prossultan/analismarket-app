/**
 * LAMBANG PASAR DARI WEB — satu sumber, dua permukaan.
 *
 * Membaca SVG di `analismarket-web/public/koin` dan `/mata-uang` (hasil
 * `skrip/siapkan-logo-pasar.ts` di repo web, yang memilihnya dari registri
 * pasar yang hidup), merender ke PNG 96 px lewat resvg, dan menulis ulang
 * peta `require` di `src/komponen/LambangPasar.tsx` — metro menuntut jalur
 * statis, jadi petanya dibuat, bukan diketik.
 *
 *   node skrip/siapkan-lambang.mjs
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { Resvg } = require('@resvg/resvg-js');
const WEB = process.env.WEB ?? `${process.env.HOME}/analismarket-web/public`;
const TUJUAN = 'assets/lambang';
mkdirSync(TUJUAN, { recursive: true });

let n = 0;
const nama = new Set();
for (const sub of ['koin', 'mata-uang']) {
  for (const f of readdirSync(join(WEB, sub)).filter((x) => x.endsWith('.svg')).sort()) {
    const svg = readFileSync(join(WEB, sub, f), 'utf8');
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: 96 } }).render().asPng();
    const k = f.replace(/\.svg$/, '').toLowerCase();
    writeFileSync(join(TUJUAN, `${k}.png`), png);
    nama.add(k); n += 1;
  }
}
if (n < 50) { process.stderr.write(`cuma ${n} lambang — sumbernya kosong?\n`); process.exit(1); }

const p = 'src/komponen/LambangPasar.tsx';
const s = readFileSync(p, 'utf8');
const awal = s.indexOf('const LAMBANG: Record<string, number> = {');
const akhir = s.indexOf('};', awal) + 2;
if (awal < 0 || akhir < 2) { process.stderr.write('peta LAMBANG tidak ketemu\n'); process.exit(1); }
const peta = 'const LAMBANG: Record<string, number> = {\n'
  + [...nama].sort().map((k) => `  '${k}': require('../../assets/lambang/${k}.png') as number,`).join('\n')
  + '\n};';
writeFileSync(p, s.slice(0, awal) + peta + s.slice(akhir));
process.stdout.write(`${n} lambang dirender · peta ${nama.size} entri ditulis\n`);
