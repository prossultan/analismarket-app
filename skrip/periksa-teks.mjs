/**
 * PENJAGA TEKS APP — empat aturan, satu sapuan.
 *
 *   node skrip/periksa-teks.mjs
 *
 * 1. KATA ARAH tidak boleh diketik di kode. App menyalurkan kata dari
 *    endpoint apa adanya dan menurunkan WARNANYA dari angka (`arahTurun`).
 *    Begitu app punya tabel kata→makna sendiri, ada dua tempat yang bisa
 *    berbeda pendapat tentang arti satu kata.
 * 2. KATA KEPATUHAN tidak boleh muncul. Kata-kata itu membuat produk terbaca
 *    sebagai nasihat investasi, yang perizinannya lain sama sekali.
 * 3. NAMA PEMROSES PEMBAYARAN web tidak boleh disebut. App belum memproses
 *    pembayaran apa pun, dan toko aplikasi melarang mengarahkan ke luar.
 * 4. TAUTAN KELUAR tidak boleh ada. Satu-satunya asal yang boleh muncul
 *    adalah endpoint kita sendiri.
 *
 * Kata-katanya DIRAKIT DARI POTONGAN supaya penjaga ini bisa memindai dirinya
 * sendiri. Penjaga yang mengecualikan dirinya adalah tempat paling nyaman
 * untuk menyembunyikan pelanggaran.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const AKAR = ['src', 'skrip'];
const BERKAS_AKAR = ['App.tsx'];
const EKOR = ['.ts', '.tsx', '.mjs', '.js'];

/** Sapuan yang berkasnya sedikit tidak menguji apa pun. */
const MINIMAL_BERKAS = 15;

const ARAH = [['BE', 'LI'], ['JU', 'AL'], ['NA', 'IK'], ['TU', 'RUN']].map((p) => p.join(''));
const KEPATUHAN = [['sin', 'yal'], ['rekomen', 'dasi'], ['jami', 'nan'], ['pro', 'fit']].map((p) => p.join(''));
const PEMROSES = ['Mid', 'trans'].join('');

/** Asal yang memang milik kita. Apa pun di luar ini tautan keluar. */
const ASAL_SENDIRI = 'https://analismarket.com';

function kumpulkan(dir, keluar) {
  for (const nama of readdirSync(dir)) {
    const jalur = join(dir, nama);
    if (statSync(jalur).isDirectory()) { kumpulkan(jalur, keluar); continue; }
    if (EKOR.some((e) => nama.endsWith(e))) keluar.push(jalur);
  }
  return keluar;
}

const berkas = [...BERKAS_AKAR];
for (const a of AKAR) kumpulkan(a, berkas);

if (berkas.length < MINIMAL_BERKAS) {
  process.stderr.write(`GAGAL: cuma ${berkas.length} berkas terpindai (minimal ${MINIMAL_BERKAS}) — sapuan ini tidak menguji apa pun\n`);
  process.exit(1);
}

const temuan = [];
for (const f of berkas) {
  const baris = readFileSync(f, 'utf8').split('\n');
  baris.forEach((isi, i) => {
    const di = `${f}:${i + 1}`;
    const potong = isi.trim().slice(0, 70);

    for (const kata of ARAH) {
      if (new RegExp(`\\b${kata}\\b`).test(isi)) temuan.push(['kata arah', kata, di, potong]);
    }
    for (const kata of KEPATUHAN) {
      if (new RegExp(`\\b${kata}\\b`, 'i').test(isi)) temuan.push(['kata kepatuhan', kata, di, potong]);
    }
    if (isi.includes(PEMROSES)) temuan.push(['pemroses pembayaran', PEMROSES, di, potong]);

    for (const m of isi.matchAll(/https?:\/\/[^\s'"`)]+/g)) {
      const url = m[0];
      if (!url.startsWith(ASAL_SENDIRI)) temuan.push(['tautan keluar', url, di, potong]);
    }
  });
}

if (temuan.length > 0) {
  process.stderr.write(`\nGAGAL — ${temuan.length} pelanggaran teks:\n`);
  for (const [jenis, apa, di, potong] of temuan) {
    process.stderr.write(`  ${jenis.padEnd(22)} ${String(apa).padEnd(28)} ${di}\n      ${potong}\n`);
  }
  process.stderr.write('\nApp menyalurkan kata dari endpoint apa adanya. Kalau kata itu perlu berubah,\nyang berubah kartunya — bukan app.\n');
  process.exit(1);
}

process.stdout.write(`  ${berkas.length} berkas dipindai · nol kata arah · nol kata kepatuhan · nol sebutan pemroses · nol tautan keluar\n`);
