/**
 * PENJAGA HARGA — angka yang disalin tidak boleh menyimpang dari yang ditagihkan.
 *
 * App menampilkan harga AnalisMarket+, tapi tidak bisa mengambilnya lewat
 * jaringan: `/api/saya/plus` ada di balik gerbang sesi, jadi orang yang belum
 * menyambungkan Telegram — persis orang yang sedang bertanya "berapa" — tidak
 * bisa membacanya, dan tidak ada endpoint harga publik. Jadi angkanya disalin
 * dari `PAKET_PLUS` di repo bot, dan penjaga ini yang menahan salinannya.
 *
 * KENAPA ADA: sampai 19 Sep 2026 layar AM+ mengetik "Rp 99.000 / bulan"
 * sementara yang benar-benar ditagihkan Rp 50.000. Hampir dua kali lipat,
 * berhari-hari, di halaman yang satu-satunya tugasnya menjawab "berapa" —
 * dan di berkas data sebelahnya tertulis "harganya sengaja tidak ikut".
 * Tidak ada uji yang bisa merah, karena tidak ada satu pun tempat yang
 * memegang angkanya.
 *
 * GAGAL KERAS KALAU SUMBERNYA TIDAK ADA. Melewati pemeriksaan karena repo bot
 * tidak ketemu berarti penjaga ini lulus dengan tidak memeriksa apa pun — dan
 * itu kelas kegagalan yang sudah lima kali terjadi di repo sebelah.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const BOT = process.env['REPO_BOT'] ?? `${process.env['HOME'] ?? ''}/apps/analisa`;
const SUMBER = `${BOT}/src/lib/langganan.ts`;
const masalah = [];

if (!existsSync(SUMBER)) {
  process.stdout.write(
    `GAGAL — sumber harga tidak ketemu: ${SUMBER}\n`
    + '  Harga di app disalin dari PAKET_PLUS di repo bot dan TIDAK bisa\n'
    + '  diperiksa tanpa repo itu. Setel REPO_BOT ke lokasinya, atau cocokkan\n'
    + '  src/data/amplus.ts dengan langganan.ts secara manual dan catat di sini.\n');
  process.exit(1);
}

/** `{ kode: '1B', bulan: 1, hari: ..., hargaRp: 50_000 }` -> [kode, bulan, harga]. */
function paketDari(teks, nama) {
  const blok = new RegExp(`${nama}[^=]*=\\s*\\[([\\s\\S]*?)\\]`).exec(teks);
  if (blok === null) return [];
  return [...blok[1].matchAll(/kode:\s*'([^']+)'[^}]*?bulan:\s*(\d+)[^}]*?hargaRp:\s*([\d_]+)/g)]
    .map((m) => [m[1], Number(m[2]), Number(m[3].replace(/_/g, ''))]);
}

const bot = paketDari(readFileSync(SUMBER, 'utf8'), 'PAKET_PLUS');
const app = paketDari(readFileSync('src/data/amplus.ts', 'utf8'), 'PAKET_PLUS');

/* Sapuan wajib menyatakan daftarnya cukup besar: daftar kosong LULUS diam-diam. */
if (bot.length < 2) masalah.push(`cuma ${bot.length} paket terbaca dari ${SUMBER} — polanya berubah, penjaga ini tidak memeriksa apa pun`);
if (app.length < 2) masalah.push(`cuma ${app.length} paket terbaca dari src/data/amplus.ts`);

const kunci = (p) => `${p[0]} ${String(p[1])}bln Rp${String(p[2])}`;
const diBot = new Set(bot.map(kunci));
const diApp = new Set(app.map(kunci));
for (const k of diApp) if (!diBot.has(k)) masalah.push(`app menawarkan paket yang TIDAK ditagihkan bot: ${k}`);
for (const k of diBot) if (!diApp.has(k)) masalah.push(`bot menagih paket yang tidak ada di app: ${k}`);

/* Harga yang diketik langsung MELEWATI satu-satunya sumbernya.
 *
 * Versi pertama penjaga ini cuma memindai `src/layar/AmPlus.tsx` — dan
 * melewatkan TIGA baris lagi di `Akun.tsx`, termasuk rincian tagihan
 * "AnalisMarket+ · 1 bulan  Rp 99.000 / PPN Termasuk / Total Rp 99.000".
 * Yang menemukannya bukan penjaga ini melainkan `grep` atas BUNDEL JADI,
 * sesudah harganya sudah dinyatakan beres. Penjaga yang cuma melihat satu
 * berkas menjawab pertanyaan yang lebih sempit daripada yang ditanyakan. */
const berkas = [];
for (const dir of ['src/layar', 'src/komponen', 'src/data']) {
  for (const n of readdirSync(dir)) if (n.endsWith('.tsx') || n.endsWith('.ts')) berkas.push(`${dir}/${n}`);
}
if (berkas.length < 15) masalah.push(`cuma ${berkas.length} berkas dipindai — sapuan ini tidak menguji apa pun`);
for (const jalur of berkas) {
  if (jalur === 'src/data/amplus.ts') continue; // satu-satunya tempat angkanya boleh hidup
  const teks = readFileSync(jalur, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
  const ketik = [...teks.matchAll(/Rp\s?[\d][\d.]{3,}/g)].map((m) => m[0]);
  if (ketik.length > 0) masalah.push(`harga diketik langsung di ${jalur} (${ketik.join(', ')}) — pakai rupiah(PAKET_PLUS[...])`);
}

if (masalah.length > 0) {
  process.stdout.write(`GAGAL — ${masalah.length} masalah harga:\n`);
  for (const m of masalah) process.stdout.write(`  - ${m}\n`);
  process.exit(1);
}
process.stdout.write(`  ${bot.length} paket cocok dengan yang ditagihkan bot · nol harga diketik di layar\n`);
