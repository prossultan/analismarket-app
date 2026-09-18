/**
 * UKUR BATAS LAJU — app yang dibuka dari keadaan dingin.
 *
 * Yang diukur: berapa permintaan HTTP yang BENAR-BENAR keluar dalam sepuluh
 * detik pertama, dan berapa yang ditolak 429.
 *
 * Kenapa ini ada: `/api/bacaan`, `/api/pasar`, dan `/api/jadwal-berita`
 * berbagi satu zona nginx `1r/s burst=5` yang dikunci pada ALAMAT IP. App
 * yang boros tidak cuma memperlambat dirinya — ia membuat 429 untuk semua
 * orang di belakang CGNAT yang sama.
 *
 * Jalur yang ditiru adalah jalur sungguhan: buka Pasar, ketuk satu pasar,
 * buka Chart, buka Bacaan, lalu Banding + Syarat + Zona (ketiganya meminta
 * kombinasi yang SAMA), lalu pindah ke tab Kalender.
 *
 *   npx tsx skrip/ukur-laju.mts
 */
import { ambilPasar, ambilBacaan, ambilJadwal } from '../src/data/api.js';

const asli = globalThis.fetch;
let keluar = 0;
let ditolak429 = 0;
const jejak: Array<{ pada: number; status: number; jalur: string }> = [];
const mulai = Date.now();

globalThis.fetch = (async (masukan: RequestInfo | URL, opsi?: RequestInit) => {
  keluar += 1;
  const res = await asli(masukan, opsi);
  if (res.status === 429) ditolak429 += 1;
  jejak.push({ pada: Date.now() - mulai, status: res.status, jalur: String(masukan).replace('https://analismarket.com', '') });
  return res;
}) as typeof fetch;

async function utama(): Promise<void> {
  const PASAR = 'SOLUSDT';
  const TF = 'h1';

  /* Tab Pasar terbuka. */
  const p = await ambilPasar();
  const jumlahPasar = p.ok ? p.isi.pasar.length : 0;

  /* Ketuk satu pasar → Chart menarik harga awal, dan Bacaan menyusul.
     Keduanya dipicu HAMPIR BERSAMAAN, seperti saat orang mengetuk lalu
     langsung menekan "Baca analisanya". */
  const [a, b] = await Promise.all([
    ambilBacaan(PASAR, TF),
    ambilBacaan(PASAR, TF),
  ]);

  /* Banding, Syarat, dan Zona — ketiganya kombinasi yang sama. */
  const [c, d, e] = await Promise.all([
    ambilBacaan(PASAR, TF),
    ambilBacaan(PASAR, TF),
    ambilBacaan(PASAR, TF),
  ]);

  /* Pindah ke tab Kalender. */
  const k = await ambilJadwal(14);

  const lama = Date.now() - mulai;
  const out = process.stdout;
  out.write(`\nJALUR DINGIN — buka Pasar, ketuk pasar, Chart, Bacaan, Banding, Syarat, Zona, Kalender\n`);
  out.write(`  panggilan modul : 8\n`);
  out.write(`  permintaan HTTP : ${String(keluar)}\n`);
  out.write(`  ditolak 429     : ${String(ditolak429)}\n`);
  out.write(`  lama total      : ${(lama / 1000).toFixed(2)} detik\n`);
  out.write(`  pasar terbaca   : ${String(jumlahPasar)}\n`);
  out.write(`  bacaan terbaca  : ${[a, b, c, d, e].filter((x) => x.ok).length}/5 ok · dari simpanan ${[a, b, c, d, e].filter((x) => x.ok && x.dariSimpanan).length}\n`);
  out.write(`  kalender        : ${k.ok ? 'ok' : k.kalimat}\n`);
  out.write(`\n  jejak:\n`);
  for (const j of jejak) out.write(`    +${(j.pada / 1000).toFixed(2)}s  ${String(j.status)}  ${j.jalur.slice(0, 60)}\n`);

  const gagal: string[] = [];
  if (ditolak429 > 0) gagal.push(`${String(ditolak429)} permintaan ditolak 429 — app membakar jatahnya sendiri`);
  /* Delapan panggilan modul harus jadi TIGA permintaan: pasar, bacaan, jadwal.
     Lebih dari itu berarti single-flight atau simpanan tidak bekerja. */
  if (keluar > 3) gagal.push(`${String(keluar)} permintaan HTTP untuk 8 panggilan (maksimal 3) — single-flight atau simpanan bocor`);
  if (jumlahPasar < 50) gagal.push(`cuma ${String(jumlahPasar)} pasar terbaca — pengukuran ini tidak menguji apa pun`);

  if (gagal.length > 0) {
    process.stderr.write(`\nGAGAL (${String(gagal.length)}):\n`);
    for (const g of gagal) process.stderr.write(`  - ${g}\n`);
    process.exit(1);
  }
  out.write(`\n  8 panggilan modul → ${String(keluar)} permintaan HTTP, nol 429\n`);
}

void utama();
