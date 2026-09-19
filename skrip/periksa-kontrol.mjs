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
/* PANAH = JANJI. `Butir` boleh menggambar `›` HANYA kalau ia bisa ditekan;
   kalau syarat itu dicabut dari komponennya, tiap baris mati di seluruh app
   berjanji ada layar di baliknya lagi — dan itu tiga baris sekaligus cuma di
   Pengaturan. Ditembak di komponennya karena di situ satu-satunya tempat
   panahnya digambar. */
const komponen = readFileSync('src/komponen/mockup.tsx', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
if (!/const bisaDitekan = onPress !== undefined;/.test(komponen)) {
  masalah.push('mockup.tsx: `Butir` tidak lagi membedakan baris yang bisa ditekan — panahnya jadi janji kosong');
} else {
  /* Menembak BLOK PANAHNYA, bukan berkasnya.
     Versi pertama memeriksa `/bisaDitekan \?/` di seluruh berkas — dan itu
     sudah dipenuhi baris `accessibilityRole={bisaDitekan ? ...}` di atasnya,
     jadi panah yang dibuat tanpa syarat lagi tetap HIJAU. Uji-mutasi yang
     menemukannya, bukan mata. */
  /* DIJANGKARKAN KE DALAM `Butir`. Percobaan sebelumnya mencari
     `{kanan ?? (` di seluruh berkas dan menemukan milik `BarisPasar` — blok
     yang sama sekali lain, tanpa panah, jadi penjaganya memeriksa komponen
     yang salah dan selalu hijau. */
  const mulaiButir = komponen.indexOf('export function Butir(');
  const akhirButir = komponen.indexOf('export function', mulaiButir + 10);
  const butir = mulaiButir < 0 ? '' : komponen.slice(mulaiButir, akhirButir < 0 ? undefined : akhirButir);
  const blok = butir;
  if (blok === '') {
    masalah.push('mockup.tsx: blok panah `Butir` tidak ketemu — polanya berubah, penjaga ini tidak menembak apa pun');
  } else {
    for (const baris of blok.split('\n')) {
      if (baris.includes('\u203a') && !baris.includes('bisaDitekan')) {
        masalah.push(`mockup.tsx: panah digambar tanpa syarat \`bisaDitekan\` — tiap baris mati berjanji ada layar di baliknya\n      ${baris.trim()}`);
      }
    }
  }
}

if (diperiksa < 10 && masalah.length === 0) masalah.push(`cuma ${diperiksa} kontrol ditemukan — polanya berubah, penjaga ini tidak menembak apa pun`);

if (masalah.length > 0) {
  process.stdout.write(`GAGAL — ${masalah.length} kontrol yang berpura-pura:\n`);
  for (const m of masalah) process.stdout.write(`  - ${m}\n`);
  process.exit(1);
}
process.stdout.write(`  ${diperiksa} kontrol diperiksa · tiap yang bisa ditekan punya penangan\n`);
