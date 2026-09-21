/**
 * PENJAGA TOKO — build untuk Google Play tidak boleh menyebut harga
 * AnalisMarket+ maupun cara membelinya.
 *
 * Kebijakan pembayaran Play: app yang membuka fitur berbayar di dalam dirinya
 * wajib memakai penagihan Play, dan dilarang mengarahkan orang ke jalur bayar
 * di luar app. AM+ ditagih lewat bot Telegram, jadi build Play diam soal
 * angka dan caranya; build tautan unduhan tetap menyebut keduanya.
 *
 * Yang dijaga di sini TIGA, dan ketiganya pernah bisa bocor:
 *
 * 1. `rupiah(` hanya boleh dipanggil di `src/data/amplus.ts` dan di layar
 *    Berlangganan. Satu pemanggilan baru di layar lain akan mencetak angka
 *    yang tidak ikut saklar, dan tidak ada yang tahu sampai Play menolaknya.
 * 2. Kalimat yang mengarahkan pembelian hanya boleh hidup di berkas yang juga
 *    mengimpor `TOKO_PLAY` — artinya penulisnya sudah memikirkan saklarnya.
 * 3. Profil build `produksi` di `eas.json` WAJIB memasang
 *    `EXPO_PUBLIC_TOKO=play`. Tanpa itu seluruh saklar di atas mati dan
 *    build Play keluar dengan harga terpampang — gagal yang paling mahal,
 *    karena semua kodenya benar dan cuma envnya yang hilang.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';

const masalah = [];

/** Semua .ts/.tsx di src, rekursif. */
function berkasSumber(dir) {
  const keluar = [];
  for (const n of readdirSync(dir)) {
    const j = `${dir}/${n}`;
    if (statSync(j).isDirectory()) keluar.push(...berkasSumber(j));
    else if (n.endsWith('.ts') || n.endsWith('.tsx')) keluar.push(j);
  }
  return keluar;
}

const berkas = berkasSumber('src');
if (berkas.length < 20) masalah.push(`cuma ${berkas.length} berkas dipindai — sapuan ini tidak menguji apa pun`);

/** Tempat yang memang boleh mencetak angka harga. */
const BOLEH_RUPIAH = new Set(['src/data/amplus.ts', 'src/layar/Akun.tsx']);

/** Kalimat yang mengarahkan pembelian ke luar app. */
const MENGARAHKAN = [
  /berlangganan lewat/i,
  /dibeli lewat bot/i,
  /\/plus ke @/i,
  /cara berlangganan/i,
  /cara bayar/i,
];

let adaRupiah = 0;
let adaArah = 0;
for (const jalur of berkas) {
  const isi = readFileSync(jalur, 'utf8');
  const kode = isi.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  if (/\brupiah\s*\(/.test(kode)) {
    adaRupiah += 1;
    if (!BOLEH_RUPIAH.has(jalur)) {
      masalah.push(`${jalur} memanggil rupiah() — angka harga cuma boleh lahir di src/data/amplus.ts lewat hargaPlus()`);
    }
  }

  for (const pola of MENGARAHKAN) {
    if (!pola.test(kode)) continue;
    adaArah += 1;
    if (!/TOKO_PLAY/.test(kode)) {
      masalah.push(`${jalur} memuat kalimat yang mengarahkan pembelian (${String(pola)}) tapi tidak menyebut TOKO_PLAY`);
    }
  }
}

/* Penjaga yang tidak menemukan apa-apa bukan penjaga: kalau pola di atas
   tidak pernah cocok, sapuan ini lulus tanpa memeriksa satu kalimat pun. */
if (adaRupiah === 0) masalah.push('nol pemanggilan rupiah() ditemukan — polanya berubah, penjaga ini tidak memeriksa apa pun');
if (adaArah === 0) masalah.push('nol kalimat pengarah pembelian ditemukan — polanya berubah, penjaga ini tidak memeriksa apa pun');

/* Saklar di eas.json. */
const eas = JSON.parse(readFileSync('eas.json', 'utf8'));
const produksi = eas.build?.produksi;
if (produksi === undefined) masalah.push('profil build "produksi" tidak ada di eas.json');
else if (produksi.env?.EXPO_PUBLIC_TOKO !== 'play') {
  masalah.push('profil "produksi" di eas.json tidak memasang EXPO_PUBLIC_TOKO=play — build Play akan keluar dengan harga terpampang');
}
if (eas.build?.pratinjau?.env?.EXPO_PUBLIC_TOKO !== undefined) {
  masalah.push('profil "pratinjau" memasang EXPO_PUBLIC_TOKO — build tautan unduhan tidak tunduk aturan Play dan harus menyebut harganya');
}

/* PROFIL DIAGNOSTIK `toko-apk`: flavor Play yang sama persis, tapi APK yang
   bisa dipasang tangan. Ia ada karena AAB Play tidak bisa dijalankan di mana
   pun kecuali lewat Play, jadi "apakah flavor tokonya yang crash" tidak bisa
   dijawab tanpa build seperti ini. Tiga syaratnya bukan gaya:
     · TOKO=play, kalau tidak ia menguji flavor yang BUKAN yang di Play;
     · tanpa channel, supaya ia tidak pernah menimpa app orang lewat OTA;
     · tanpa autoIncrement, supaya ia tidak memakan nomor versi Play — nomor
       yang termakan tidak bisa dikembalikan, dan itu sudah terjadi sekali. */
const tokoApk = eas.build?.['toko-apk'];
if (tokoApk === undefined) masalah.push('profil build "toko-apk" tidak ada di eas.json');
else {
  if (tokoApk.env?.EXPO_PUBLIC_TOKO !== 'play') masalah.push('profil "toko-apk" tidak memasang EXPO_PUBLIC_TOKO=play — ia akan menguji flavor yang bukan flavor Play');
  if (tokoApk.channel !== undefined) masalah.push('profil "toko-apk" punya channel — build diagnostik tidak boleh masuk jalur pembaruan mana pun');
  if (tokoApk.autoIncrement !== undefined) masalah.push('profil "toko-apk" memakai autoIncrement — ia akan memakan nomor versi Play yang tidak bisa dikembalikan');
  if (tokoApk.android?.buildType !== 'apk') masalah.push('profil "toko-apk" bukan apk — AAB tidak bisa dipasang tangan, dan itu satu-satunya alasan profil ini ada');
}

/* SEKAT UJI (EXPO_PUBLIC_TANPA_TEMBOK) membuka app tanpa masuk — cuma untuk
   emulator CI. Bocor ke profil yang dibagikan ke orang berarti app tanpa
   tembok masuk beredar. */
for (const nama of ['pratinjau', 'produksi', 'development', 'toko-apk']) {
  if (eas.build?.[nama]?.env?.EXPO_PUBLIC_TANPA_TEMBOK !== undefined) {
    masalah.push(`profil "${nama}" memasang EXPO_PUBLIC_TANPA_TEMBOK — sekat uji bocor ke build yang dibagikan`);
  }
}
if (eas.build?.uji?.env?.EXPO_PUBLIC_TANPA_TEMBOK !== '1') masalah.push('profil "uji" tidak memasang EXPO_PUBLIC_TANPA_TEMBOK=1 — emulator CI akan terkurung di tembok masuk');
if (eas.build?.uji?.channel !== undefined) masalah.push('profil "uji" punya channel — build uji tidak boleh masuk jalur pembaruan mana pun');

if (masalah.length > 0) {
  process.stderr.write(`GAGAL — ${masalah.length} masalah toko:\n${masalah.map((m) => `  - ${m}`).join('\n')}\n`);
  process.exit(1);
}
process.stdout.write(`  ${berkas.length} berkas · ${adaRupiah} pemanggil harga · ${adaArah} kalimat pengarah, semuanya di balik saklar · eas produksi memasang EXPO_PUBLIC_TOKO=play\n`);
