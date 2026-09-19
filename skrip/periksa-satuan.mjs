/**
 * PENJAGA SATUAN — angka yang satuannya salah tidak pernah terlihat salah.
 *
 * `biayaPorsi` dari `/api/bacaan` SUDAH DALAM PERSEN. Di bot, `bulatkan.ts`
 * menghitungnya `(biayaBps / stopBps) * 100`, dan server mengatakannya
 * sendiri di kalimat syaratnya:
 *
 *   biayaPorsi = 8.64
 *   kalimat    = "Biaya 9,0 bps vs jarak SL 104,2 bps — 9% dari risiko"
 *
 * Sampai 19 Sep 2026 app mengalikannya 100 LAGI di dua tempat, jadi setup
 * sehat berbiaya 8,6% tercetak "Biaya 864% risiko". Bilahnya ikut rusak:
 * ambangnya ditulis 0,5 dan 1, jadi apa pun di atas 1% terisi penuh dan
 * merah — bilah yang selalu merah berhenti memberi tahu apa pun.
 *
 * Tidak ada yang melempar, typecheck hijau, dan angkanya tetap "angka".
 * Yang menemukannya cuma membaca potret layar lalu menghitung ulang dari
 * entry dan SL-nya.
 *
 * ATURANNYA: `biayaPorsi` tidak boleh disentuh aritmetika di luar
 * `src/data/tampil.ts`. Yang boleh memformatnya cuma `biayaPersen` dan
 * `biayaLebar`, dan keduanya menyatakan satuannya di namanya.
 */
import { readFileSync, readdirSync } from 'node:fs';

const masalah = [];
const berkas = [];
for (const dir of ['src/layar', 'src/komponen', 'src/data']) {
  for (const n of readdirSync(dir)) {
    if (n.endsWith('.tsx') || n.endsWith('.ts')) berkas.push(`${dir}/${n}`);
  }
}
if (berkas.length < 15) masalah.push(`cuma ${berkas.length} berkas dipindai — sapuan ini tidak menguji apa pun`);

let sebut = 0;
for (const jalur of berkas) {
  const teks = readFileSync(jalur, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  for (const [i, baris] of teks.split('\n').entries()) {
    if (!baris.includes('biayaPorsi')) continue;
    sebut += 1;
    /* Deklarasi tipe dan penyalinan apa adanya tidak apa-apa; yang dilarang
       aritmetika — di situlah satuannya diam-diam berubah. */
    if (/biayaPorsi\s*[*/]|[*/]\s*biayaPorsi|biayaPorsi[^)]*\*\s*100/.test(baris)) {
      masalah.push(`${jalur}:${i + 1} — \`biayaPorsi\` dikalikan/dibagi di luar tampil.ts; ia SUDAH persen\n      ${baris.trim().slice(0, 88)}`);
    }
  }
}
if (sebut === 0) masalah.push('`biayaPorsi` tidak disebut di mana pun — penjaga ini sudah tidak menembak apa pun');

/* Formatternya sendiri harus tetap menganggapnya persen. */
const tampil = readFileSync('src/data/tampil.ts', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
if (!/export function biayaPersen\(porsi: number\): string \{\s*return `\$\{String\(Math\.round\(porsi\)\)\}%`;/.test(tampil)) {
  masalah.push('tampil.ts: `biayaPersen` tidak lagi membulatkan `porsi` apa adanya — satuannya berubah lagi');
}

if (masalah.length > 0) {
  process.stdout.write(`GAGAL — ${masalah.length} masalah satuan:\n`);
  for (const m of masalah) process.stdout.write(`  - ${m}\n`);
  process.exit(1);
}
process.stdout.write(`  ${String(berkas.length)} berkas · ${String(sebut)} sebutan biayaPorsi · satuannya utuh\n`);
