/**
 * PENJAGA KACA — supaya permukaan tembus pandang tidak mati diam-diam.
 *
 * Kaca punya bentuk kegagalan yang khas: ia tidak pernah error. Blur yang
 * kehilangan bahannya merender kotak abu yang terlihat persis seperti desain
 * yang memang begitu, dan tidak ada satu pun galat yang menyebutnya. Empat
 * hal di bawah ini masing-masing pernah mematikannya dalam sesi yang sama:
 *
 *   1. `tabBarStyle` tanpa `position: absolute` — bilahnya ikut aliran, isi
 *      terdorong ke atasnya, dan yang disaring blur cuma latar kosong.
 *   2. Layar tanpa jarak bawah — isi memang lewat di bawah bilah, tapi baris
 *      terakhirnya tidak bisa dijangkau siapa pun.
 *   3. `backgroundColor` padat di permukaan berkaca — blur tidak punya apa
 *      pun untuk ditembus.
 *   4. `BlurView` dipakai langsung, melewati `Kaca` — tiga lapisannya
 *      (blur, warna, garis rambut) berhenti sejajar.
 *
 *   node skrip/periksa-kaca.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const masalah = [];
const cek = (ok, pesan) => { if (!ok) masalah.push(pesan); };

function semuaBerkas(dir, keluar = []) {
  for (const n of readdirSync(dir)) {
    const j = join(dir, n);
    if (statSync(j).isDirectory()) semuaBerkas(j, keluar);
    else if (/\.tsx?$/.test(n)) keluar.push(j);
  }
  return keluar;
}

const berkas = ['App.tsx', ...semuaBerkas('src')];
cek(berkas.length >= 15,
  `cuma ${berkas.length} berkas dipindai — sapuan ini tidak menguji apa pun`);

const app = readFileSync('App.tsx', 'utf8');

/* 1 · Bilah tab WAJIB melayang. */
const blokBilah = app.match(/tabBarStyle:\s*\{[^}]*\}/s)?.[0] ?? '';
cek(blokBilah !== '', 'App.tsx: tabBarStyle tidak ketemu');
cek(/position:\s*'absolute'/.test(blokBilah),
  "App.tsx: tabBarStyle tanpa position:'absolute' — bilahnya ikut aliran, " +
  'isi tidak lewat di bawahnya, dan blur kehilangan bahannya');
cek(/backgroundColor:\s*'transparent'/.test(blokBilah),
  'App.tsx: tabBarStyle berlatar padat — ia menutupi kacanya sendiri');
cek(/tabBarBackground:\s*\(\)\s*=>\s*<Kaca/.test(app),
  'App.tsx: tabBarBackground bukan <Kaca> — bilahnya tidak berkaca');

/* 2 · Kepala berkaca wajib transparan. */
cek(/headerTransparent:\s*true/.test(app),
  'App.tsx: headerTransparent tidak true — headerBackground tidak akan terlihat');
cek(/headerBackground:\s*\(\)\s*=>\s*<Kaca/.test(app),
  'App.tsx: headerBackground bukan <Kaca>');

/* 3 · Tiap layar bertab menyisakan ruang di bawah bilah. */
const LAYAR_BERTAB = ['Home', 'AmPlus', 'Belajar', 'Profil', 'Kalender', 'Lainnya', 'Dokumen'];
for (const nama of LAYAR_BERTAB) {
  const isi = readFileSync(`src/layar/${nama}.tsx`, 'utf8');
  cek(isi.includes('SISA_BILAH'),
    `src/layar/${nama}.tsx: tanpa SISA_BILAH — baris terakhirnya tertutup bilah melayang`);
}

/* 4 · BlurView lewat SATU pintu. */
for (const b of berkas) {
  if (b.endsWith('komponen/Kaca.tsx')) continue;
  const isi = readFileSync(b, 'utf8');
  cek(!/from 'expo-blur'/.test(isi),
    `${b}: mengimpor expo-blur langsung — pakai <Kaca>, supaya blur, warna, ` +
    'dan garis rambutnya tetap sejajar');
}

/* 5 · Permukaan berkaca tidak boleh berlatar padat. */
const analisis = readFileSync('src/layar/Analisis.tsx', 'utf8');
const gayaLapis = analisis.match(/\n\s*lapis:\s*\{[^}]*\}/s)?.[0] ?? '';
cek(gayaLapis !== '', 'Analisis.tsx: gaya `lapis` tidak ketemu');
cek(!/backgroundColor/.test(gayaLapis),
  'Analisis.tsx: gaya `lapis` berlatar padat — blur tidak punya apa pun untuk ditembus');
cek(/<Kaca tebal/.test(analisis),
  'Analisis.tsx: lapisan bacaan tidak memakai <Kaca tebal>');

/* 6 · Android butuh experimentalBlurMethod, atau blur-nya diam-diam mati. */
const kaca = readFileSync('src/komponen/Kaca.tsx', 'utf8');
cek(/experimentalBlurMethod/.test(kaca),
  'Kaca.tsx: tanpa experimentalBlurMethod — di Android BlurView merender kotak polos tanpa peringatan');

if (masalah.length > 0) {
  process.stdout.write(`GAGAL — ${masalah.length} masalah kaca:\n`);
  for (const m of masalah) process.stdout.write(`  - ${m}\n`);
  process.exit(1);
}
process.stdout.write(`  ${berkas.length} berkas dipindai · bilah melayang · kepala transparan · ` +
  `${LAYAR_BERTAB.length} layar berjarak · satu pintu blur\n`);
