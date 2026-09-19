/**
 * PENJAGA IZIN ANDROID — app cuma boleh meminta apa yang benar-benar dipakainya.
 *
 * Izin tidak datang dari kode kita: React Native dan pustakanya menyuntikkannya
 * lewat penggabungan manifes, dan tidak ada satu baris pun di repo ini yang
 * menyebutkannya. Sampai 19 Sep 2026 app ini meminta EMPAT izin yang tidak
 * pernah dipakainya:
 *
 *   SYSTEM_ALERT_WINDOW       "tampil di atas aplikasi lain" — izin sensitif
 *                             yang diperiksa ketat Play Store dan terbaca
 *                             mengkhawatirkan oleh orang yang memasangnya
 *   READ/WRITE_EXTERNAL_STORAGE   membaca dan menulis penyimpanan
 *   VIBRATE
 *
 * Untuk app yang cuma membaca chart, keempatnya tidak punya pembelaan.
 *
 * MENEMBAK MANIFES YANG DIHASILKAN, bukan daftar `blockedPermissions` di
 * app.json. Daftar itu cuma menjawab "apa yang sudah kita tahu dan blokir";
 * yang berbahaya adalah izin KELIMA yang disuntikkan pustaka baru besok, dan
 * itu cuma terlihat dari manifesnya.
 *
 * BATAS PENJAGA INI: prebuild TIDAK melihat izin yang digabung dari pustaka
 * native (AAR) saat Gradle berjalan. 19 Sep ia berkata "1 izin ikut" sementara
 * APK yang jadi memuat empat tambahan dari paket Clerk. Jadi ini penjaga
 * TAHAP AWAL; yang menentukan adalah `periksa-apk.mjs` atas APK hasil EAS.
 *
 * Lambat (prebuild ~1 menit), jadi TIDAK ikut `npm run periksa`. Jalankan
 * sebelum rilis:  npm run periksa-rilis
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';

/** Cuma ini yang boleh. Menambah baris di sini harus disertai alasannya. */
const BOLEH = new Set([
  'android.permission.INTERNET', // seluruh isi app datang dari jaringan
  // Kabar pantauan ke HP. Diminta dari SAKLAR di Pengaturan, bukan saat app
  // pertama dibuka — dialog izin Android cuma muncul sekali seumur pemasangan.
  'android.permission.POST_NOTIFICATIONS',
  /* c2dm.RECEIVE dan WAKE_LOCK TIDAK didaftar di sini, dan itu bukan
     kelalaian: keduanya disumbang manifes AAR dan baru digabung Gradle saat
     BUILD. Manifes prebuild belum memuatnya, jadi menuntutnya ada di sini
     membuat penjaga ini merah selamanya atas sesuatu yang benar.
     Tempatnya di `periksa-apk.mjs`, yang membaca APK sungguhan — dan di sana
     keduanya memang wajib ada. Dua penjaga, dua permukaan, dua daftar. */
]);

const adaSebelumnya = existsSync('android');
try {
  execFileSync('npx', ['expo', 'prebuild', '--platform', 'android', '--no-install', '--clean'],
    { stdio: 'ignore', timeout: 420_000 });
} catch {
  process.stdout.write('GAGAL — prebuild tidak selesai; izin tidak bisa diperiksa dari sini\n');
  process.exit(1);
}

const manifes = 'android/app/src/main/AndroidManifest.xml';
if (!existsSync(manifes)) {
  process.stdout.write(`GAGAL — ${manifes} tidak terbentuk\n`);
  process.exit(1);
}
const teks = readFileSync(manifes, 'utf8');
const semua = [...teks.matchAll(/<uses-permission[^>]*?android:name="([^"]+)"[^>]*?>/g)]
  .map((m) => ({ nama: m[1], dihapus: m[0].includes('tools:node="remove"') }));
const ikut = semua.filter((x) => !x.dihapus).map((x) => x.nama);

if (!adaSebelumnya) rmSync('android', { recursive: true, force: true });

const masalah = [];
/* Sapuan wajib menyatakan ia menemukan sesuatu: manifes tanpa satu pun izin
   berarti polanya berubah, dan penjaga ini lulus tanpa memeriksa apa pun. */
if (semua.length === 0) masalah.push('nol uses-permission terbaca — polanya berubah, penjaga ini tidak menguji apa pun');
for (const n of ikut) if (!BOLEH.has(n)) masalah.push(`izin TIDAK dibenarkan ikut ke APK: ${n} — blokir di app.json atau tulis alasannya di BOLEH`);
for (const n of BOLEH) if (!ikut.includes(n)) masalah.push(`izin yang dibutuhkan justru hilang: ${n}`);

if (masalah.length > 0) {
  process.stdout.write(`GAGAL — ${masalah.length} masalah izin:\n`);
  for (const m of masalah) process.stdout.write(`  - ${m}\n`);
  process.exit(1);
}
process.stdout.write(`  ${String(semua.length)} izin di manifes · ${String(ikut.length)} ikut ke APK (${ikut.join(', ')}) · ${String(semua.length - ikut.length)} diblokir\n`);
