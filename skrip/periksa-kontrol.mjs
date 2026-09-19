/**
 * PENJAGA KONTROL MATI — yang terlihat bisa ditekan harus benar-benar bekerja.
 *
 * Kontrol yang diam saat ditekan lebih buruk daripada kontrol yang tidak ada:
 * orang menekannya berulang kali, menyimpulkan app-nya rusak, dan berhenti
 * memercayai kontrol yang LAIN di layar yang sama.
 *
 * KENAPA ADA. Sampai 19 Sep 2026 tiga kontrol di layar akun berpura-pura:
 *
 *   saringan pantauan   "Aktif · Menunggu · Selesai" — tidak menyaring apa
 *                       pun, DAN dua dari tiga keadaan itu tidak ada di data
 *   saklar kabar induk  tidak tersambung ke apa pun
 *   saklar per-tf       tidak tersambung, dan modelnya salah: server
 *                       menyimpan pasangan (timeframe, mesin), bukan tf saja
 *
 * Tidak satu pun melempar galat. Typecheck hijau, penjaga lain hijau, dan
 * potret layar terlihat benar — saklar mati digambar persis seperti saklar
 * hidup. Yang menemukannya cuma membaca tiap kontrol satu per satu.
 *
 * ATURANNYA: `<Saklar>` dan `<Chip>` di layar wajib punya penangan, KECUALI
 * yang memang lencana status. Lencana ditandai `lencana` — satu kata yang
 * harus DIKETIK dengan sadar, jadi tidak ada yang lolos karena lupa.
 */
import { readFileSync, readdirSync } from 'node:fs';

const masalah = [];
const layar = readdirSync('src/layar').filter((n) => n.endsWith('.tsx'));
if (layar.length < 8) masalah.push(`cuma ${layar.length} layar terbaca — sapuan ini tidak menguji apa pun`);

let diperiksa = 0;
for (const nama of layar) {
  const teks = readFileSync(`src/layar/${nama}`, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  /* Satu elemen bisa memanjang beberapa baris; ambil dari tag sampai penutupnya. */
  for (const m of teks.matchAll(/<(Saklar|Chip)\b([\s\S]*?)\/>/g)) {
    const [, tag, isi] = m;
    diperiksa += 1;
    if (/\bganti=|\bonPress=/.test(isi)) continue;
    if (/\blencana\b/.test(isi)) continue;
    const baris = teks.slice(0, m.index).split('\n').length;
    masalah.push(`${nama}:${baris} — <${tag}> tanpa penangan dan tanpa tanda \`lencana\`: ia terlihat bisa ditekan tapi diam\n      ${isi.trim().replace(/\s+/g, ' ').slice(0, 84)}`);
  }
}
if (diperiksa < 10 && masalah.length === 0) masalah.push(`cuma ${diperiksa} kontrol ditemukan — polanya berubah, penjaga ini tidak menembak apa pun`);

if (masalah.length > 0) {
  process.stdout.write(`GAGAL — ${masalah.length} kontrol yang berpura-pura:\n`);
  for (const m of masalah) process.stdout.write(`  - ${m}\n`);
  process.exit(1);
}
process.stdout.write(`  ${diperiksa} kontrol diperiksa · tiap yang bisa ditekan punya penangan\n`);
