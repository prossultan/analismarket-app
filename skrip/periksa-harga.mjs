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
import { existsSync, readFileSync } from 'node:fs';

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

/* Harga yang diketik langsung di layar melewati satu-satunya sumbernya. */
const layar = readFileSync('src/layar/AmPlus.tsx', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const ketik = [...layar.matchAll(/Rp\s?[\d.]{4,}/g)].map((m) => m[0]);
if (ketik.length > 0) masalah.push(`harga diketik langsung di AmPlus.tsx (${ketik.join(', ')}) — pakai rupiah(PAKET_PLUS[...])`);

if (masalah.length > 0) {
  process.stdout.write(`GAGAL — ${masalah.length} masalah harga:\n`);
  for (const m of masalah) process.stdout.write(`  - ${m}\n`);
  process.exit(1);
}
process.stdout.write(`  ${bot.length} paket cocok dengan yang ditagihkan bot · nol harga diketik di layar\n`);
