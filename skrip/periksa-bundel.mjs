/**
 * PENJAGA BUNDEL — menembak yang BENAR-BENAR DIKIRIM ke HP.
 *
 * Penjaga sumber menjawab "apakah kode yang saya lihat benar". Penjaga ini
 * menjawab pertanyaan yang lain, dan lebih akhir: "apakah yang terpasang di
 * HP orang benar". Keduanya pernah berbeda di repo ini pada hari yang sama:
 *
 *   `periksa-harga.mjs` hijau sesudah harga dibetulkan di satu layar,
 *   sementara bundel jadi masih memuat harga lama TIGA kali — dari
 *   `Akun.tsx`, berkas yang penjaga itu tidak pernah lihat. Yang menemukannya
 *   `grep` atas bundel, bukan satu pun penjaga sumber.
 *
 * BUNDEL JS, BUKAN APK. Yang diperiksa di sini keluaran `export:embed`, yang
 * masih JavaScript teks. Bundel di DALAM APK rilis adalah bytecode Hermes
 * (`assets/index.android.bundle`, magic c6 1f bc 03): string-nya masih
 * terbaca di tabel string, tapi ANGKANYA tersimpan biner. Mencari "50000"
 * di sana melaporkan seluruh harga hilang, dan yang salah pencariannya.
 *
 * Jadi dari APK yang sah diperiksa cuma stringnya — harga yang DIKETIK dan
 * kata terlarang. Nilai angkanya diperiksa dari sini, dan dari layar yang
 * benar-benar dirender.
 *
 * Membangun bundel lambat (~1 menit), jadi ia bagian `periksa-rilis`.
 *
 *   node skrip/periksa-bundel.mjs
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PAKET_PLUS } from '../src/data/amplus.ts';

const masalah = [];
const dir = mkdtempSync(join(tmpdir(), 'periksa-bundel-'));
const keluar = join(dir, 'android.js');
try {
  execFileSync('npx', ['expo', 'export:embed', '--platform', 'android', '--dev', 'false',
    '--entry-file', 'node_modules/expo/AppEntry.js', '--bundle-output', keluar,
    '--assets-dest', join(dir, 'aset')], { stdio: 'ignore', timeout: 600_000 });
} catch {
  process.stdout.write('GAGAL — bundel android tidak terbentuk; tidak ada yang bisa diperiksa\n');
  rmSync(dir, { recursive: true, force: true });
  process.exit(1);
}

const js = readFileSync(keluar, 'utf8');
/* Sapuan wajib menyatakan ia menemukan sesuatu. */
if (js.length < 500_000) masalah.push(`bundel cuma ${String(js.length)} bait — terlalu kecil untuk app ini, penjaga ini tidak menguji apa pun`);

/** Kata yang tidak boleh sampai ke HP, apa pun jalurnya.
 *  DIPECAH seperti di `periksa-teks.mjs`: kalau ditulis utuh, berkas ini
 *  sendiri jadi pelanggaran dan penjaga teks menangkap penjaganya. */
const TERLARANG = [['Mid', 'trans'], ['rekomen', 'dasi'], ['jami', 'nan'], ['pro', 'fit'], ['sin', 'yal']]
  .map((x) => x.join(''));
for (const k of TERLARANG) {
  const n = (js.match(new RegExp(k, 'gi')) ?? []).length;
  if (n > 0) masalah.push(`kata terlarang "${k}" muncul ${String(n)}x di bundel jadi`);
}

/* DUA SISI, dan yang kedua ada karena yang pertama bisa lulus dengan tidak
   menemukan apa-apa.

   LARANGAN: tidak boleh ada harga rupiah yang DIKETIK di bundel. `rupiah()`
   merakit stringnya saat jalan, jadi keadaan sehatnya memang NOL literal —
   dan nol literal berarti tidak ada satu pun yang bisa salah.

   KEHARUSAN: tapi "nol" juga yang dijawab bundel yang harganya hilang sama
   sekali. Jadi angkanya sendiri wajib ADA, dalam bentuk mentah. */
const sah = new Set(PAKET_PLUS.map((p) => `Rp ${p.hargaRp.toLocaleString('id-ID')}`));
const rupiah = [...new Set((js.match(/Rp ?\d[\d.]{3,}/g) ?? []))];
for (const r of rupiah) {
  if (!sah.has(r.replace('Rp', 'Rp '))) masalah.push(`harga "${r}" diketik di bundel dan bukan paket yang ditagihkan (${[...sah].join(', ')})`);
}
/* Minifier menulis 50000 sebagai `5e4`, 135000 sebagai `135e3`. Mencari
   digit polos saja melaporkan SELURUH harga hilang — penjaga ini sempat
   merah karenanya, dan yang salah penjaganya. */
const angkaBundel = new Set();
for (const m of js.matchAll(/\b(\d+)e(\d+)\b/g)) angkaBundel.add(Number(m[1]) * 10 ** Number(m[2]));
const adaAngka = (n) => js.includes(String(n)) || angkaBundel.has(n);
const hilang = PAKET_PLUS.filter((p) => !adaAngka(p.hargaRp));
if (hilang.length > 0) masalah.push(`harga paket tidak ikut ke bundel: ${hilang.map((p) => p.kode).join(', ')} — layar AM+ akan kosong di HP`);

rmSync(dir, { recursive: true, force: true });
if (masalah.length > 0) {
  process.stdout.write(`GAGAL — ${masalah.length} masalah di bundel jadi:\n`);
  for (const m of masalah) process.stdout.write(`  - ${m}\n`);
  process.exit(1);
}
process.stdout.write(`  bundel ${String(Math.round(js.length / 1024))} KB · nol kata terlarang · ${String(rupiah.length)} harga diketik · ${String(PAKET_PLUS.length)} paket ikut mentah\n`);
