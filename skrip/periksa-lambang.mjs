/**
 * PENJAGA LAMBANG — peta ikon tidak boleh menyimpang dari folder asetnya.
 *
 * Metro menuntut `require` yang STATIS: jalur yang dirangkai saat jalan
 * tidak pernah ikut terbundel, dan gagalnya diam — gambar kosong, tanpa
 * satu pun galat. Karena itu petanya dibuat otomatis, dan penjaga ini
 * memastikan ia tetap sejajar dengan isi folder.
 *
 * Ia juga menjaga arah yang lain: aset yang dihapus tapi masih dipetakan
 * membuat bundel gagal DI HP, bukan saat build.
 */
import { readFileSync, readdirSync } from 'node:fs';

const masalah = [];
const berkas = readdirSync('assets/lambang').filter((n) => n.endsWith('.png')).map((n) => n.replace('.png', ''));
const peta = readFileSync('src/komponen/LambangPasar.tsx', 'utf8');
const dipetakan = [...peta.matchAll(/'([a-z0-9-]+)':\s*require\(/g)].map((m) => m[1]);

if (berkas.length < 50) masalah.push(`cuma ${berkas.length} lambang di assets/lambang — sapuan ini tidak menguji apa pun`);
for (const n of berkas) if (!dipetakan.includes(n)) masalah.push(`${n}.png ada di folder tapi TIDAK dipetakan — ikonnya tidak akan pernah muncul`);
for (const n of dipetakan) if (!berkas.includes(n)) masalah.push(`'${n}' dipetakan tapi berkasnya TIDAK ada — bundel gagal di HP, bukan saat build`);

/* Pasar yang paling sering dibuka WAJIB punya lambang. */
for (const wajib of ['btc', 'eth', 'sol', 'xau', 'eur']) {
  if (!dipetakan.includes(wajib)) masalah.push(`lambang '${wajib}' hilang — ia pasar yang paling sering dibuka`);
}
/* Pasar tanpa lambang tidak boleh jadi lubang di deret ikon.
 *
 * Ini BUKAN keadaan langka: per 19 Sep, empat dari 20 pasar tersibuk
 * (ENA, WLD, CRCLB, MARSCOIN) tidak punya logo di SATU PUN sumbernya —
 * @web3icons/core 4.0.55 maupun 4.0.56, dan cryptocurrency-icons 0.18.1.
 * Jadi cadangan huruf ini jalur yang benar-benar dipakai, bukan cadangan
 * teoretis, dan ia ditembak lewat CABANGNYA — bukan lewat nama gayanya.
 * Menembak `/ganti/` saja tetap hijau kalau cabangnya dihapus dan gayanya
 * tertinggal di StyleSheet. */
if (!/function LambangPasar/.test(peta)) {
  masalah.push('LambangPasar.tsx tanpa komponen LambangPasar');
}
if (!/kunci\s*===\s*null/.test(peta)) {
  masalah.push('LambangPasar.tsx tanpa cabang `kunci === null` — pasar tak berlambang jadi lubang yang terbaca sebagai gambar gagal');
}
if (!/simbol\.replace\(/.test(peta) || !/toUpperCase\(\)/.test(peta)) {
  masalah.push('cabang pengganti tidak menurunkan hurufnya dari simbol — lingkarannya akan kosong, dan lingkaran kosong lebih buruk daripada ikon hilang');
}

if (masalah.length > 0) {
  process.stdout.write(`GAGAL — ${masalah.length} masalah lambang:\n`);
  for (const m of masalah) process.stdout.write(`  - ${m}\n`);
  process.exit(1);
}
process.stdout.write(`  ${berkas.length} lambang · peta sejajar dengan folder · lima pasar utama ada · cabang pengganti utuh\n`);
