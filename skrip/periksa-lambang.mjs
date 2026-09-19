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
/* Pasar tanpa lambang tidak boleh jadi lubang di deret ikon. */
if (!/function LambangPasar/.test(peta) || !/ganti/.test(peta)) {
  masalah.push('LambangPasar.tsx tanpa lingkaran pengganti — pasar tak berlambang jadi lubang yang terbaca sebagai gambar gagal');
}

if (masalah.length > 0) {
  process.stdout.write(`GAGAL — ${masalah.length} masalah lambang:\n`);
  for (const m of masalah) process.stdout.write(`  - ${m}\n`);
  process.exit(1);
}
process.stdout.write(`  ${berkas.length} lambang · peta sejajar dengan folder · lima pasar utama ada · ada pengganti\n`);
