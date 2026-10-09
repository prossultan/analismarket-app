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

/* 0 · BILAH MELAYANG WAJIB MEMBAWA JARAK AMANNYA SENDIRI.
 *
 * Ini yang lolos di putaran sebelumnya, dan akibatnya terlihat di HP: label
 * "Home" dan "Lainnya" terpotong separuh. Sebabnya `position: absolute`
 * membuat react-navigation BERHENTI menambahkan jarak aman bawah — ia
 * menganggap bilah melayang diurus pemanggilnya — sementara tingginya tetap
 * 58px.
 *
 * Penjaga lama memeriksa bahwa `position: absolute` ADA. Itu menembak BAHAN,
 * bukan artefak akhir: ia tidak pernah bisa merah untuk bilah yang melayang
 * TAPI terpotong. Yang di bawah ini menuntut keduanya sekaligus. */
cek(/useSafeAreaInsets\(\)/.test(app),
  'App.tsx: bilah melayang tanpa useSafeAreaInsets — labelnya terpotong di HP berponi');
/* DUA BENTUK yang sah, dan keduanya membawa `bawah`:
   - bilah menempel tepi: `height: TINGGI_BILAH + bawah` + `paddingBottom: bawah`
   - bilah PIL melayang (sejak 19 Sep): `bottom: bawah + ANGKAT_BILAH` — pilnya
     sendiri diangkat di atas jarak aman, jadi tingginya tetap. */
const menempel = /height:\s*TINGGI_BILAH\s*\+\s*bawah/.test(app) && /paddingBottom:\s*bawah/.test(app);
const melayang = /bottom:\s*bawah\s*\+\s*ANGKAT_BILAH/.test(app);
cek(menempel || melayang,
  'App.tsx: bilah tab tidak membawa jarak aman bawah — labelnya terpotong di HP berponi');
cek(/useSisaBilah/.test(readFileSync('src/gaya/jarak.ts', 'utf8')),
  'src/gaya/jarak.ts: kait jarak bawah tidak ada');

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
  cek(isi.includes('useSisaBilah'),
    `src/layar/${nama}.tsx: tanpa useSisaBilah — baris terakhirnya tertutup bilah melayang. ` +
    'Konstanta tetap TIDAK cukup: tinggi poni berbeda tiap perangkat');
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

/* 6 · ANDROID TANPA BLUR, DAN ISIANNYA PEKAT (Okt 2026).
 *
 * Aturan lamanya kebalikan ini: `experimentalBlurMethod` wajib ada supaya
 * blur Android tidak diam-diam mati. Redesain kaca obsidian mencabut blur
 * Android sama sekali — `dimezisBlurView` menghitung ulang blur tiap frame
 * saat isi lewat di bawah kepala dan bilah, dan itu sebab gulir tersendat di
 * HP menengah. Dua hal yang sekarang dijaga, karena keduanya bisa kembali
 * tanpa satu pun galat:
 *   a. BlurView cuma dirender SESUDAH cabang `if (!PAKAI_BLUR) return`, dan
 *      PAKAI_BLUR = iOS saja;
 *   b. isian kaca Android ≥ 0,9 — tanpa blur, warna itulah satu-satunya
 *      yang menjaga teks di belakang bilah tidak tembus. */
const kaca = readFileSync('src/komponen/Kaca.tsx', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
cek(/const PAKAI_BLUR = Platform\.OS === 'ios';/.test(kaca),
  "Kaca.tsx: PAKAI_BLUR bukan `Platform.OS === 'ios'` — Android kembali menghitung blur tiap frame");
/* Cabang Android DITEMBAK ISINYA, bukan letaknya: versi pertama cuma
   menuntut `<BlurView` muncul sesudah `if (!PAKAI_BLUR)` — dan mutasi yang
   menaruh BlurView DI DALAM cabang Android itu sendiri tetap hijau. */
const cabangAndroid = kaca.match(/if \(!PAKAI_BLUR\)\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';
cek(/^\s*return\s*<View\b/.test(cabangAndroid) && !/BlurView/.test(cabangAndroid),
  'Kaca.tsx: cabang Android tidak mengembalikan <View> polos — blur kembali dibayar tiap frame');
const token = readFileSync('src/gaya/token.ts', 'utf8');
const blokGelap = token.match(/const KACA_GELAP = \{[\s\S]*?\} as const;/)?.[0] ?? '';
const alfaAndroid = [...blokGelap.matchAll(/IOS \? '[^']+' : 'rgba\([^)]*,\s*([0-9.]+)\)'/g)].map((m) => Number(m[1]));
cek(alfaAndroid.length === 2, `token.ts: isian kaca Android tidak terbaca (${String(alfaAndroid.length)} dari 2)`);
for (const a of alfaAndroid) {
  cek(a >= 0.9, `token.ts: isian kaca Android ${String(a)} < 0,9 — tanpa blur, isi di belakang bilah tembus terbaca`);
}

if (masalah.length > 0) {
  process.stdout.write(`GAGAL — ${masalah.length} masalah kaca:\n`);
  for (const m of masalah) process.stdout.write(`  - ${m}\n`);
  process.exit(1);
}
process.stdout.write(`  ${berkas.length} berkas dipindai · bilah melayang · kepala transparan · ` +
  `${LAYAR_BERTAB.length} layar berjarak · satu pintu blur\n`);
