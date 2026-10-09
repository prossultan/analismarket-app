/**
 * UJI KEPUTUSAN — kode data app yang SUNGGUHAN, dijalankan di Node.
 *
 *   node skrip/uji-keputusan.mjs
 *
 * Penjaga lain di `skrip/` membaca TEKS sumber. Itu cukup untuk "kata ini
 * tidak boleh ada", tapi tidak untuk "badan yang berangkat ke server berisi
 * apa" — dan dua bug 3 Okt justru di situ: `tambahPantauan` mengirim
 * `strategi` padahal server membaca `mesin`, dan `pilihanJam` dibaca sebagai
 * angka padahal server mengirim objek. Keduanya lulus tsc dan ketujuh
 * penjaga teks.
 *
 * Jadi di sini `saya.ts`, `sesi.ts`, `antrian.ts`, dan modul keputusan murni
 * DIIMPOR apa adanya (Node 22 membuang tipe TypeScript sendiri), `fetch`
 * diganti tiruan yang mencatat permintaan, dan yang ditegaskan adalah
 * ARTEFAK AKHIR: badan JSON yang benar-benar dikirim, kalimat yang
 * benar-benar dikembalikan ke layar, isi localStorage sesudah skrip suntikan
 * dijalankan. `react-native` dan AsyncStorage diganti potongan kecil; tidak
 * ada jaringan, tidak ada produksi.
 *
 * Tiap uji yang menjaga keputusan produk diberi nama `KEPUTUSAN: ...`, pesan
 * gagalnya menyebut angka atau alasannya, dan cabang lawannya ikut ditembak.
 */
import * as modul from 'node:module';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

/* Pintu ini WAJIB ada. Tanpa `registerHooks` (Node < 22.15) uji ini tidak
   bisa memuat satu modul app pun — dan lulus tanpa memuat apa pun adalah
   kegagalan yang sama dengan sapuan yang daftarnya kosong. */
if (typeof modul.registerHooks !== 'function') {
  process.stderr.write(`GAGAL — Node ${process.version} tidak punya module.registerHooks (butuh >= 22.15); uji keputusan tidak bisa memuat kode app.\n`);
  process.exit(1);
}

const AKAR = process.cwd();
const STUB = {
  'react-native': "export const Platform = { OS: 'android' }; export const AppState = { addEventListener: () => ({ remove() {} }) };",
  '@react-native-async-storage/async-storage':
    'const m = new Map(); export default { getItem: async (k) => m.get(k) ?? null, setItem: async (k, v) => { m.set(k, String(v)); }, removeItem: async (k) => { m.delete(k); } };',
};

modul.registerHooks({
  resolve(spec, ctx, next) {
    if (Object.hasOwn(STUB, spec)) return { url: `stub:${spec}`, shortCircuit: true };
    if ((spec.startsWith('./') || spec.startsWith('../')) && ctx.parentURL?.startsWith('file:') && !/\.[cm]?[jt]sx?$/.test(spec)) {
      const dasar = fileURLToPath(new URL(spec, ctx.parentURL));
      for (const e of ['.ts', '.tsx']) {
        if (existsSync(dasar + e)) return { url: pathToFileURL(dasar + e).href, shortCircuit: true };
      }
    }
    return next(spec, ctx);
  },
  load(url, ctx, next) {
    if (url.startsWith('stub:')) return { format: 'module', source: STUB[url.slice(5)], shortCircuit: true };
    /* Kode app tidak punya "type": "module" — dinyatakan di sini supaya Node
       tidak menebak (dan tidak memperingatkan) untuk tiap berkas. */
    if (url.startsWith('file:') && url.endsWith('.ts') && url.includes('/src/')) return next(url, { ...ctx, format: 'module-typescript' });
    return next(url, ctx);
  },
});

/* ── fetch tiruan: mencatat apa yang berangkat, menjawab dari antrean ───── */
const terkirim = [];
const antrean = [];
function jawab(status, badan) { antrean.push({ status, badan }); }
function putus() { antrean.push({ lempar: true }); }
globalThis.fetch = async (url, init = {}) => {
  terkirim.push({ url: String(url), metode: init.method ?? 'GET', badan: init.body === undefined ? null : JSON.parse(init.body), header: init.headers ?? {} });
  const j = antrean.shift() ?? { status: 200, badan: {} };
  if (j.lempar) throw new TypeError('Network request failed');
  return new Response(JSON.stringify(j.badan), { status: j.status, headers: { 'content-type': 'application/json' } });
};
const terakhir = () => terkirim[terkirim.length - 1];

const muat = (jalur) => import(pathToFileURL(join(AKAR, jalur)).href);
const sesi = await muat('src/data/sesi.ts');
const saya = await muat('src/data/saya.ts');
const api = await muat('src/data/api.ts');
const statusPlus = await muat('src/data/statusPlus.ts');
const jamSunyi = await muat('src/data/jamSunyi.ts');
const gagalBacaan = await muat('src/data/gagalBacaan.ts');
const sesiChart = await muat('src/data/sesiChart.ts');
const amplus = await muat('src/data/amplus.ts');
const tampil = await muat('src/data/tampil.ts');
const tfPengganti = await muat('src/data/tfPengganti.ts');
const layarPasar = await muat('src/data/layarPasar.ts');

/* ── pembantu uji ───────────────────────────────────────────────────────── */
let jumlah = 0;
const gagal = [];
async function uji(nama, f) {
  jumlah += 1;
  try { await f(); process.stdout.write(`  LOLOS  ${nama}\n`); }
  catch (e) { gagal.push(nama); process.stdout.write(`  GAGAL  ${nama}\n         ${e instanceof Error ? e.message : String(e)}\n`); }
}
function tegas(benar, pesan) { if (!benar) throw new Error(pesan); }

/** Kode tanpa komentar — kata di komentar bukan teks yang dilihat orang. */
function tanpaKomentar(t) {
  return t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
}
function berkasSumber(dir) {
  const keluar = [];
  for (const n of readdirSync(dir)) {
    const j = `${dir}/${n}`;
    if (statSync(j).isDirectory()) keluar.push(...berkasSumber(j));
    else if (n.endsWith('.ts') || n.endsWith('.tsx')) keluar.push(j);
  }
  return keluar;
}
const SUMBER = [...berkasSumber('src'), 'App.tsx'];

/* ── sumber kebenaran dari repo bot, dengan potret untuk CI ─────────────── */
/**
 * Angka yang app salin dari bot: batas pantauan dan pilihan jam sunyi.
 * Pola yang sama dengan `periksa-harga.mjs`: dibaca dari repo bot kalau ada
 * (dan potretnya diperbarui), dari potret kalau tidak (CI), GAGAL kalau dua-
 * duanya tidak ada. Melewati pemeriksaan karena sumbernya hilang = lulus
 * tanpa memeriksa apa pun.
 */
const BOT = process.env['REPO_BOT'] ?? `${process.env['HOME'] ?? ''}/apps/analisa`;
const POTRET = 'skrip/keputusan-bot.json';
function dariBot() {
  const notif = `${BOT}/src/db/notif.ts`;
  const menu = `${BOT}/src/bot/amplus-menu.ts`;
  const push = `${BOT}/src/lib/push.ts`;
  const penyedia = `${BOT}/src/data/penyedia.ts`;
  if (![notif, menu, push, penyedia].every((f) => existsSync(f))) return null;
  const maks = /export const MAKS_WATCH\s*=\s*(\d+)/.exec(readFileSync(notif, 'utf8'));
  const blok = /JAM_SUNYI_PILIHAN[^=]*=\s*\[([\s\S]*?)\n\]/.exec(readFileSync(menu, 'utf8'));
  const jam = blok === null ? [] : [...blok[1].matchAll(/\{\s*mulai:\s*(\d+),\s*selesai:\s*(\d+)\s*\}/g)].map((m) => ({ mulai: Number(m[1]), selesai: Number(m[2]) }));
  /* Templat notifikasi pantauan — contoh di formulir Pantauan baru menyalinnya. */
  const fPush = /export function pesanKabarPush[\s\S]*?\n\}/.exec(readFileSync(push, 'utf8'))?.[0] ?? '';
  const pushKabar = { judul: /title:\s*`([^`]*)`/.exec(fPush)?.[1] ?? null, isi: /body:\s*`([^`]*)`/.exec(fPush)?.[1] ?? null };
  /* Aturan penyedia: simbol bergaris miring → Twelve Data (berkredit). App memakai aturan yang sama untuk tidak membaca m1/m5 emas & forex otomatis. */
  const garisMiringTwelve = /symbol\.includes\('\/'\)\s*\?\s*'twelvedata'/.test(readFileSync(penyedia, 'utf8'));
  return { maksWatch: maks === null ? null : Number(maks[1]), jamSunyiPilihan: jam, pushKabar, garisMiringTwelve };
}
let bot = dariBot();
if (bot !== null) {
  const segar = `${JSON.stringify(bot, null, 2)}\n`;
  if (!existsSync(POTRET) || readFileSync(POTRET, 'utf8') !== segar) { writeFileSync(POTRET, segar); process.stdout.write(`  potret keputusan bot diperbarui: ${POTRET}\n`); }
} else if (existsSync(POTRET)) {
  bot = JSON.parse(readFileSync(POTRET, 'utf8'));
  process.stdout.write(`  repo bot tidak ada di mesin ini — dibandingkan dengan potret ${POTRET}\n`);
} else {
  process.stderr.write(`GAGAL — tidak ada sumber keputusan bot: ${BOT} maupun ${POTRET}\n`);
  process.exit(1);
}

/* ══ SESI GOOGLE (Clerk) — dipakai sebagian besar uji akun di bawah ═════ */
await sesi.bacaSesi();
sesi.pasangClerk({
  getToken: async () => 'jwt-clerk-uji',
  signOut: async () => {},
  akun: { akunId: 0, email: 'uji@contoh.id', nama: 'Uji', telegramTersambung: false, langganan: null },
});

process.stdout.write('\n── K4 · pantauan dari app ──\n');

await uji('KEPUTUSAN: pantauan dikirim dengan kunci `mesin`, bukan `strategi`', async () => {
  jawab(201, { status: 'dibuat', id: 7, mesin: 'smc' });
  const j = await saya.tambahPantauan({ pair: 'BTCUSDT', tf: 'h1', mesin: 'smc' });
  const b = terakhir().badan;
  tegas(terakhir().url.endsWith('/api/saya/pantauan/tambah'), `jalur salah: ${terakhir().url}`);
  tegas(b.mesin === 'smc', `badan ${JSON.stringify(b)} — server membaca b.mesin (tambahPantauan di api-saya.ts bot); tanpa kunci ini mesin pilihan diganti mesin setelan akun diam-diam`);
  tegas(!('strategi' in b), `badan masih memuat "strategi": ${JSON.stringify(b)} — kunci yang tidak dibaca server`);
  tegas(j.ok === true, 'jawaban 201 dibaca gagal');
});

await uji('KEPUTUSAN: mesin "otomatis" (kosong) tidak dikirim — server memakai mesin aktif akun', async () => {
  for (const mesin of ['', undefined]) {
    jawab(200, { status: 'sudah', id: 7, mesin: 'snr' });
    await saya.tambahPantauan({ pair: 'ETHUSDT', tf: 'h4', mesin });
    const b = terakhir().badan;
    tegas(!('mesin' in b) && !('strategi' in b), `mesin ${JSON.stringify(mesin)} menghasilkan badan ${JSON.stringify(b)} — kunci kosong dijawab 400 "strategi tidak tersedia"`);
    tegas(b.pair === 'ETHUSDT' && b.tf === 'h4', `pair/tf hilang dari badan: ${JSON.stringify(b)}`);
  }
});

await uji('KEPUTUSAN: penolakan pasang pantauan sampai ke layar sebagai kalimat server', async () => {
  const pesan = 'Pantauan BTCUSDT H1 sudah aktif dengan SNR. Matikan pantauan lama sebelum memilih strategi lain.';
  jawab(409, { galat: 'strategi-berbeda', pesan, mesin: 'snr' });
  const j = await saya.tambahPantauan({ pair: 'BTCUSDT', tf: 'h1', mesin: 'smc' });
  tegas(j.ok === false && j.kalimat === pesan, `409 strategi-berbeda menjadi ${JSON.stringify(j)} — kalimat server wajib diteruskan apa adanya`);
});

await uji('KEPUTUSAN: galat tanpa pesan ("penuh") dicetak sebagai kalimat, bukan kode mentah', async () => {
  jawab(409, { galat: 'penuh', maks: 10 });
  const j = await saya.tambahPantauan({ pair: 'SOLUSDT', tf: 'h1', mesin: 'snr' });
  tegas(j.ok === false && j.kalimat !== 'penuh' && j.kalimat.includes('10'), `409 penuh (maks 10) menjadi ${JSON.stringify(j)} — layar akan mencetak kode "penuh" mentah`);
});

await uji('KEPUTUSAN: 402 perlu-plus = jenis plus; 402 poin-kurang BUKAN ajakan AM+', async () => {
  jawab(402, { galat: 'perlu-plus' });
  const a = await saya.tambahPantauan({ pair: 'XAU/USD', tf: 'm15', mesin: 'pdhpdl' });
  tegas(a.ok === false && a.jenis === 'plus', `perlu-plus menjadi ${JSON.stringify(a)}`);
  jawab(402, { galat: 'poin-kurang', poin: 0, minPoin: 50 });
  const b = await saya.tambahPantauan({ pair: 'XAU/USD', tf: 'h1', mesin: 'snr' });
  tegas(b.ok === false && b.jenis !== 'plus', `poin-kurang menjadi jenis "${b.ok ? '' : b.jenis}" — menyuruh membeli AM+ untuk hal yang tidak dibuka AM+`);
});

process.stdout.write('\n── K5 · jam sunyi ──\n');

await uji('KEPUTUSAN: pilihan jam sunyi dibaca sebagai jendela KIRIM {mulai, selesai} milik bot', async () => {
  tegas(bot.jamSunyiPilihan.length >= 3, `cuma ${bot.jamSunyiPilihan.length} pilihan jam terbaca dari bot — sapuan ini tidak menguji apa pun`);
  jawab(200, { plus: true, dipilih: [], irama: 'jam', jam: { mulai: 5, selesai: 23 }, pilihanJam: bot.jamSunyiPilihan, tfTersedia: [] });
  const j = await saya.ambilKabarOtomatis();
  tegas(j.ok, 'jawaban kabar otomatis dibaca gagal');
  const pilihan = jamSunyi.bacaPilihanJam(j.isi.pilihanJam);
  tegas(pilihan.length === bot.jamSunyiPilihan.length, `${pilihan.length} dari ${bot.jamSunyiPilihan.length} pilihan bot terbaca`);
  for (const p of pilihan) {
    const label = jamSunyi.labelSunyi(p);
    tegas(/^(Tidak ada|\d\d\.00–\d\d\.00)$/.test(label), `label "${label}" untuk ${JSON.stringify(p)} — chip lama tercetak "[object Object].00"`);
  }
});

await uji('KEPUTUSAN: label jam sunyi = jam DIAM, rumus yang sama dengan bot (T.jamSunyiPilihan)', async () => {
  const harap = [[{ mulai: 0, selesai: 23 }, 'Tidak ada'], [{ mulai: 3, selesai: 23 }, '00.00–03.00'], [{ mulai: 5, selesai: 23 }, '00.00–05.00'], [{ mulai: 7, selesai: 22 }, '23.00–07.00']];
  for (const [j, l] of harap) tegas(jamSunyi.labelSunyi(j) === l, `${JSON.stringify(j)} → "${jamSunyi.labelSunyi(j)}", bot mencetak "${l}"`);
  /* Cabang lawan: jam KIRIM bukan jam diam. Kirim 05.00–23.59 untuk sunyi 00.00–05.00. */
  tegas(jamSunyi.labelKirim({ mulai: 5, selesai: 23 }) === '05.00–23.59', `jam kirim {5,23} → "${jamSunyi.labelKirim({ mulai: 5, selesai: 23 })}" — selesai 23 inklusif sampai 23.59`);
  tegas(jamSunyi.labelKirim({ mulai: 5, selesai: 23 }) !== jamSunyi.labelSunyi({ mulai: 5, selesai: 23 }), 'jam kirim dan jam diam tercetak sama — salah satunya bohong');
});

await uji('KEPUTUSAN: bentuk lain dari jendela tidak menghasilkan chip (gagal-tertutup)', async () => {
  const angka = jamSunyi.bacaPilihanJam([0, 6, 7, 21]);
  tegas(angka.length === 0, `angka polos menghasilkan ${angka.length} chip — bentuk yang dulu diandaikan app, ditolak server saat ditekan`);
  const campur = jamSunyi.bacaPilihanJam([{ mulai: 5, selesai: 23 }, { mulai: '5', selesai: 23 }, { mulai: 5 }, null, { mulai: 24, selesai: 2 }]);
  tegas(campur.length === 1, `${campur.length} chip dari satu jendela sah + empat cacat`);
  /* Layar wajib lewat pembaca ini — `d.pilihanJam.map(...)` langsung adalah bentuk bug aslinya. */
  const akun = tanpaKomentar(readFileSync('src/layar/Akun.tsx', 'utf8'));
  tegas(/bacaPilihanJam\(d\.pilihanJam\)/.test(akun), 'layar Kabar otomatis tidak membaca pilihanJam lewat bacaPilihanJam');
  tegas(!/\.pilihanJam\.map\(/.test(akun), 'layar Kabar otomatis memetakan pilihanJam mentah — chip "[object Object].00"');
});

await uji('KEPUTUSAN: menekan pilihan jam mengirim jendela itu utuh {mulai, selesai}', async () => {
  jawab(200, { mulai: 7, selesai: 22 });
  const j = await saya.setelJamKabar(7, 22);
  tegas(j.ok, 'setel jam dibaca gagal');
  tegas(terakhir().url.endsWith('/api/saya/kabar-otomatis/jam'), `jalur ${terakhir().url}`);
  const b = terakhir().badan;
  tegas(b.mulai === 7 && b.selesai === 22 && Object.keys(b).length === 2, `badan ${JSON.stringify(b)} — server menuntut dua angka bulat 0-23, mulai < selesai`);
});

await uji('KEPUTUSAN: tidak ada janji kabar disusulkan sesudah jam sunyi — server membuangnya', async () => {
  tegas(SUMBER.length >= 30, `cuma ${SUMBER.length} berkas — sapuan ini tidak menguji apa pun`);
  const janji = /dikirim sekaligus|tertahan dikirim|yang tertahan|dikirim saat jam sunyi selesai|tetap dicatat, cuma tidak dibunyikan|kabar dicatat, tidak dibunyikan/i;
  const langgar = SUMBER.filter((f) => janji.test(tanpaKomentar(readFileSync(f, 'utf8'))));
  tegas(langgar.length === 0, `janji "disusulkan" masih ada di ${langgar.join(', ')} — pemindai.ts melewati penerima yang sunyi SEBELUM mencatat kabarnya`);
  /* Cabang lawan: kalimat jujurnya wajib ada DAN dicetak layar. */
  tegas(/tidak dikirim/.test(jamSunyi.KALIMAT_JAM_SUNYI) && /tidak disusulkan/.test(jamSunyi.KALIMAT_JAM_SUNYI), `kalimat jam sunyi: "${jamSunyi.KALIMAT_JAM_SUNYI}"`);
  tegas(/\{KALIMAT_JAM_SUNYI\}/.test(tanpaKomentar(readFileSync('src/layar/Akun.tsx', 'utf8'))), 'layar Kabar otomatis tidak mencetak KALIMAT_JAM_SUNYI');
});

process.stdout.write('\n── K14 · 402 bacaan di layar Pasar ──\n');

/** Lewat `ambilBacaan` sungguhan (antrean, sesi, cache) — jalur yang dipakai layar Pasar. */
async function bacaanGagal(susun, pasar) {
  susun();
  const j = await api.ambilBacaan(pasar, 'm5', true);
  tegas(j.ok === false, `bacaan ${pasar} tidak gagal`);
  return gagalBacaan.gagalBacaan({ jenis: j.jenis, kalimat: j.kalimat, galat: j.galat }, { pasar, tf: 'm5' });
}

await uji('KEPUTUSAN: 402 perlu-plus di bacaan adalah ajakan AM+, bukan "Mesin tidak menjawab · Coba lagi"', async () => {
  const pesan = 'M5 untuk XAU/USD bagian AnalisMarket+. Data emas dan forex dibeli dengan jatah harian, dan M1/M5 yang paling banyak menagih. XAU/USD tetap terbuka di timeframe lain.';
  const g = await bacaanGagal(() => { jawab(402, { galat: 'perlu-plus', pesan }); }, 'XAU/USD');
  tegas(terakhir().header.authorization === 'Bearer jwt-clerk-uji', `bacaan berangkat tanpa sesi Google: ${JSON.stringify(terakhir().header)}`);
  const isi = gagalBacaan.isiLembarGagal(g);
  tegas(g.jenis === 'plus' && isi.aksi === 'plus', `402 perlu-plus menjadi jenis "${g.jenis}", aksi "${String(isi.aksi)}"`);
  tegas(!/tidak menjawab|tersambung/i.test(`${isi.label} ${isi.judul} ${isi.ket}`), `lembar AM+ berbunyi gangguan: ${JSON.stringify(isi)}`);
  tegas(/AnalisMarket\+/.test(isi.judul), `judul lembar tidak menyebut AnalisMarket+: "${isi.judul}"`);
  /* Build Play diam soal harga dan cara beli — lembar ini diam di build mana pun. */
  const semua = `${isi.label} ${isi.judul} ${isi.ket}`;
  tegas(!/Rp|\/plus|@|bot|bayar|beli/i.test(semua), `lembar AM+ menyebut harga atau jalur beli: "${semua}" — dilarang di build Play`);
});

await uji('KEPUTUSAN: "Coba lagi" HANYA untuk kegagalan jaringan (cabang lawan)', async () => {
  const jar = await bacaanGagal(() => { putus(); }, 'EUR/USD');
  const isiJar = gagalBacaan.isiLembarGagal(jar);
  tegas(jar.jenis === 'jaringan' && isiJar.aksi === 'coba' && isiJar.judul === 'Mesin tidak menjawab', `jaringan putus menjadi ${JSON.stringify(isiJar)}`);
  const bts = await bacaanGagal(() => { jawab(429, { galat: 'batas-harian', pesan: 'Jatah AnalisMarket+ untuk M1/M5 emas-forex hari ini sudah terpakai: 20 dari 20.' }); }, 'GBP/USD');
  const isiBts = gagalBacaan.isiLembarGagal(bts);
  tegas(bts.jenis === 'batas' && isiBts.aksi === null, `batas harian (20 dari 20) menjadi ${JSON.stringify(isiBts)} — mengulang cuma menagih jatah untuk jawaban yang sama`);
  const tlk = await bacaanGagal(() => { jawab(400, { galat: 'badan-salah', pesan: 'timeframe tidak berlaku' }); }, 'USD/JPY');
  tegas(gagalBacaan.isiLembarGagal(tlk).aksi === null, '400 ditolak menawarkan "Coba lagi"');
  const plus = gagalBacaan.isiLembarGagal({ jenis: 'plus', kalimat: 'x', pasar: 'XAU/USD', tf: 'm5' });
  tegas(plus.judul !== isiJar.judul && plus.aksi !== isiJar.aksi, 'lembar AM+ dan lembar jaringan identik — salah satu cabang diam-diam disamakan');
  /* Layar Pasar wajib lewat keputusan ini, bukan menulis kalimat gangguannya sendiri lagi. */
  const layar = tanpaKomentar(readFileSync('src/layar/Analisis.tsx', 'utf8'));
  const kait = tanpaKomentar(readFileSync('src/data/layarPasar.ts', 'utf8'));
  tegas(/isiLembarGagal\(gagalBaca\)/.test(layar) && /useBacaanPasar\(/.test(layar) && /gagalBacaan\(/.test(kait), 'layar Pasar tidak memakai useBacaanPasar (gagalBacaan) + isiLembarGagal');
  tegas(!/Mesin tidak menjawab/.test(layar), 'layar Pasar mengetik "Mesin tidak menjawab" sendiri — kalimat yang dulu tercetak untuk 402 AM+');
});

process.stdout.write('\n── K13 · status AM+ akun Google ──\n');

await uji('KEPUTUSAN: status AM+ dari /api/saya, bukan dari sesi Google', async () => {
  const s = sesi.sesiSekarang();
  tegas(s !== null && s.jenis === 'clerk', 'sesi uji bukan sesi Google');
  tegas(s.akun.langganan === null, `sesi Google membawa langganan "${String(s.akun.langganan)}" — Google tidak tahu status langganan`);
  tegas(statusPlus.statusTampil(s, statusPlus.statusServer(s)) === null, 'status Google sebelum /api/saya bukan null');
  tegas(statusPlus.labelStatus(null) === '—', `status tak diketahui tercetak "${statusPlus.labelStatus(null)}" — pelanggan Google dulu dibaca "Gratis"`);
  jawab(200, { telegramTersambung: false, langganan: 'plus', sisaHariPlus: 23, plusBerakhirPada: null, poin: 0, pantauanAktif: 1, maksPantauan: 10, setelan: null });
  const j = await saya.ambilRingkas();
  tegas(j.ok, '/api/saya dibaca gagal');
  tegas(terakhir().header.authorization === 'Bearer jwt-clerk-uji', '/api/saya berangkat tanpa token Google');
  tegas(statusPlus.statusTampil(s, statusPlus.statusServer(s)) === 'plus', 'jawaban /api/saya "plus" tidak sampai ke status yang dicetak');
  tegas(statusPlus.labelStatus('plus') === 'AnalisMarket+' && statusPlus.labelStatus('gratis') === 'Gratis', 'label status berubah');
});

await uji('KEPUTUSAN: jawaban server menang atas petunjuk sesi mini (cabang lawan)', async () => {
  const mini = { jenis: 'mini', sesi: 'tok', akun: { akunId: 3, email: null, nama: 'M', telegramTersambung: true, langganan: 'plus' }, pada: 0 };
  tegas(statusPlus.statusTampil(mini, null) === 'plus', 'petunjuk sesi mini diabaikan sebelum /api/saya menjawab');
  tegas(statusPlus.statusTampil(mini, 'gratis') === 'gratis', 'langganan yang sudah habis tetap dibaca "plus" dari sesi lama');
  tegas(statusPlus.statusTampil(null, 'plus') === null, 'tanpa sesi tetap mencetak status');
  /* Jawaban milik sesi lain tidak boleh tercatat. */
  statusPlus.catatStatusPlus('kunci-sesi-lain', 'gratis');
  tegas(statusPlus.statusServer(sesi.sesiSekarang()) === 'plus', 'jawaban milik sesi lain menimpa status sesi ini');
});

await uji('KEPUTUSAN: sesi Google tidak diisi status karangan di App.tsx', async () => {
  const kode = tanpaKomentar(readFileSync('App.tsx', 'utf8'));
  tegas(/pasangClerk\(/.test(kode), 'pasangClerk tidak ditemukan di App.tsx — penjaga ini menembak berkas yang salah');
  tegas(!/langganan:\s*'(gratis|plus)'/.test(kode), "App.tsx mengetik langganan 'gratis'/'plus' untuk sesi Google — tercetak apa adanya di tiga permukaan");
});

process.stdout.write('\n── K15 · sesi ikut ke chart tertanam ──\n');

/** Jalankan skrip suntikan seperti WebView menjalankannya, atas localStorage tiruan milik halaman berasal `origin`. */
const ASAL_APP = (await muat('src/data/antrian.ts')).ASAL;
function jalankanSuntikan(skrip, awal = {}, origin = ASAL_APP) {
  const isi = new Map(Object.entries(awal));
  const localStorage = { setItem: (k, v) => { isi.set(k, String(v)); }, removeItem: (k) => { isi.delete(k); }, getItem: (k) => isi.get(k) ?? null };
  // eslint-disable-next-line no-new-func
  new Function('localStorage', 'location', skrip)(localStorage, { origin });
  return isi;
}

await uji('KEPUTUSAN: chart tertanam membawa token sesi Google, bukan cuma sesi mini', async () => {
  const token = await sesi.tokenSesi();
  tegas(token === 'jwt-clerk-uji', `tokenSesi() untuk sesi Google menjawab ${JSON.stringify(token)}`);
  const ls = jalankanSuntikan(sesiChart.skripSesiChart(token, ASAL_APP));
  tegas(ls.get(sesiChart.KUNCI_SESI_CHART) === 'jwt-clerk-uji', `localStorage halaman embed sesudah suntikan: ${JSON.stringify([...ls])} — web membaca 'am_sesi_mini' sebagai Bearer`);
  tegas(sesiChart.KUNCI_SESI_CHART === 'am_sesi_mini', `kunci "${sesiChart.KUNCI_SESI_CHART}" bukan kunci yang dibaca miniapp.ts web`);
  const layar = tanpaKomentar(readFileSync('src/layar/Analisis.tsx', 'utf8'));
  tegas(/<ChartTertanam\b[^>]*ambilToken=\{tokenSesi\}/.test(layar), 'layar Pasar tidak memberi ChartTertanam tokenSesi (semua jenis sesi)');
  tegas(!/jenis\s*===\s*'mini'/.test(layar), "layar Pasar masih menyaring sesi chart dengan jenis === 'mini' — pengguna Google anonim di chart");
});

await uji('KEPUTUSAN: tanpa sesi, token lama DIHAPUS dari WebView (cabang lawan)', async () => {
  const ls = jalankanSuntikan(sesiChart.skripSesiChart(null, ASAL_APP), { am_sesi_mini: 'token-orang-sebelumnya' });
  tegas(!ls.has('am_sesi_mini'), 'token sesi orang sebelumnya tertinggal di localStorage WebView sesudah keluar');
  tegas(sesiChart.skripSesiChart(null, ASAL_APP) !== sesiChart.skripSesiChart('x', ASAL_APP), 'skrip dengan dan tanpa token identik');
  tegas(sesiChart.SEGARKAN_TOKEN_CHART_MS < 60_000, `token chart disegarkan tiap ${sesiChart.SEGARKAN_TOKEN_CHART_MS} ms — JWT Clerk berumur ±60 detik`);
});

/* Tiga alamat yang LOLOS `originWhitelist` react-native-webview 13.16.1 (regex
   `^` + asal tanpa `$`, diuji 3 Okt) padahal bukan analismarket.com. Alamat
   asing dirakit lewat `alamat()` — periksa-teks menolak tautan keluar yang
   diketik utuh, dan di sini justru itu bahan ujinya. */
const alamat = (skema, sisa) => `${skema}:/${'/'}${sisa}`;
const ASAL_TIRUAN = ['https://analismarket.com.contoh-lain.net', 'https://analismarket.com@contoh-lain.net', 'https://analismarket.com:8443'];

await uji('KEPUTUSAN: token sesi disuntik HANYA ke halaman berasal analismarket.com — halaman asing di WebView tidak menerimanya', async () => {
  tegas(ASAL_APP === 'https://analismarket.com', `ASAL app ${JSON.stringify(ASAL_APP)} — uji ini menembak asal yang salah`);
  /* `location.origin` seperti dilaporkan peramban: `pengguna@` sudah dibuang dari origin halaman itu. */
  for (const origin of ['https://analismarket.com.contoh-lain.net', alamat('https', 'contoh-lain.net'), 'https://analismarket.com:8443', alamat('http', 'analismarket.com')]) {
    const ls = jalankanSuntikan(sesiChart.skripSesiChart('jwt-rahasia', ASAL_APP), {}, origin);
    tegas(!ls.has(sesiChart.KUNCI_SESI_CHART), `halaman ${origin} menerima token sesi lewat suntikan 40 detik — JWT/sesi mini membuka /api/saya/*, termasuk hapus akun`);
  }
  /* Cabang lawan: halaman asal sendiri tetap menerimanya. */
  const sah = jalankanSuntikan(sesiChart.skripSesiChart('jwt-rahasia', ASAL_APP), {}, ASAL_APP);
  tegas(sah.get(sesiChart.KUNCI_SESI_CHART) === 'jwt-rahasia', 'halaman chart-embed analismarket.com tidak lagi menerima token — chart pelanggan jadi anonim');
});

await uji('KEPUTUSAN: navigasi WebView chart dibandingkan origin PERSIS — awalan "https://analismarket.com" tidak cukup', async () => {
  for (const u of ASAL_TIRUAN) tegas(!sesiChart.bolehDimuatChart(`${u}/chart-embed`, ASAL_APP), `${u} dimuat di bingkai atas WebView chart`);
  for (const u of [alamat('http', 'analismarket.com/chart-embed'), 'about:blank', 'javascript:alert(1)', `${alamat('https', 'contoh-lain.net')}/?k=${ASAL_APP}`]) {
    tegas(!sesiChart.bolehDimuatChart(u, ASAL_APP), `${u} dimuat di bingkai atas WebView chart`);
  }
  tegas(!sesiChart.bolehDimuatChart(`${ASAL_APP}/chart-embed`, ''), 'asal kosong (web) meloloskan navigasi');
  /* Cabang lawan: halaman chart sendiri — termasuk ganti pair/tf/tema — tetap dimuat. */
  for (const u of [`${ASAL_APP}/chart-embed?pair=XAU%2FUSD&tf=m5&alat=volume,zona&tema=terang`, `${ASAL_APP}/`, alamat('https', 'AnalisMarket.com/chart-embed')]) {
    tegas(sesiChart.bolehDimuatChart(u, ASAL_APP), `${u} ditolak — chart tidak bisa berpindah pasar/tf`);
  }
  const kode = tanpaKomentar(readFileSync('src/komponen/ChartTertanam.tsx', 'utf8'));
  tegas(/onShouldStartLoadWithRequest=\{\(e\) => bolehDimuatChart\(e\.url, asal, e\.isTopFrame\)\}/.test(kode), 'ChartTertanam tidak memeriksa origin persis lewat onShouldStartLoadWithRequest — originWhitelist saja meloloskan awalan');
  const suntik = kode.match(/skripSesiChart\(/g) ?? [];
  const berasal = kode.match(/skripSesiChart\([^()]*,\s*asal\)/g) ?? [];
  tegas(suntik.length >= 3 && berasal.length === suntik.length, `${berasal.length} dari ${suntik.length} suntikan membawa asal — tiap pintu suntikan (muat, segarkan 40 dtk, awal halaman) wajib`);
});

process.stdout.write('\n── Teks yang dilihat orang ──\n');

await uji('KEPUTUSAN: pantauan 10 untuk semua akun — angka app = MAKS_WATCH bot', async () => {
  tegas(typeof bot.maksWatch === 'number', 'MAKS_WATCH tidak terbaca dari bot');
  tegas(amplus.MAKS_PANTAUAN === bot.maksWatch, `app menulis ${amplus.MAKS_PANTAUAN} pantauan, bot memberi ${bot.maksWatch} (src/db/notif.ts)`);
  for (const toko of [false, true]) {
    const faq = amplus.tanyaPlus(toko).map((q) => `${q.t} ${q.j}`).join(' ');
    tegas(faq.includes(`${bot.maksWatch} pantauan`), `FAQ (toko=${toko}) tidak menyebut ${bot.maksWatch} pantauan`);
    tegas(!/tiga pantauan|membuka sisanya/i.test(faq), `FAQ (toko=${toko}) masih berbunyi "tiga pantauan pertama gratis; AM+ membuka sisanya"`);
  }
  tegas(amplus.FITUR_GRATIS.some((f) => f.nama === `${bot.maksWatch} pantauan`), 'daftar gratis tidak menyebut batas pantauan bot');
});

await uji('KEPUTUSAN: AM+ sekali bayar, tanpa potong otomatis — tidak ada kata tagihan berulang', async () => {
  const berulang = /ditagih|tagihan berikutnya|tiap 30 hari|berhenti kapan saja|ditagih bulanan/i;
  const langgar = SUMBER.filter((f) => berulang.test(tanpaKomentar(readFileSync(f, 'utf8'))));
  tegas(langgar.length === 0, `kata tagihan berulang di ${langgar.join(', ')} — S&K app (dokumen.ts), web, dan bot: tanpa potong otomatis`);
  const unduhan = amplus.tanyaPlus(false).map((q) => q.j).join(' ');
  tegas(/tanpa potong otomatis/.test(unduhan), 'FAQ build tautan unduhan tidak menyebut "tanpa potong otomatis"');
  tegas(/tanpa potong otomatis/.test(tanpaKomentar(readFileSync('src/layar/Akun.tsx', 'utf8'))), 'layar Berlangganan tidak menyebut "tanpa potong otomatis"');
  /* Cabang Play: tanpa satu kalimat pun soal pembayaran. */
  const play = amplus.tanyaPlus(true).map((q) => `${q.t} ${q.j}`).join(' ');
  tegas(!/bayar|potong otomatis|Rp/i.test(play), `FAQ build Play menyebut pembayaran: "${play}"`);
  tegas(amplus.tanyaPlus(false).length === amplus.tanyaPlus(true).length + 1, 'kedua cabang FAQ tidak berbeda tepat satu pertanyaan bayar');
});

/* ── teks yang TERCETAK di build Play, dibaca dari pohon sintaks ───────── */
/**
 * Uji FAQ di atas memanggil `tanyaPlus(true)`, tapi kartu AM+ dan layar
 * Berlangganan mencetak kalimatnya langsung di JSX — dan di situlah 3 Okt
 * "Tidak ada potong otomatis" lolos ke build Play: cabang `plus ? ...`
 * dievaluasi SEBELUM `TOKO_PLAY`. Layar `.tsx` tidak bisa dijalankan di sini,
 * jadi pohon sintaksnya (TypeScript, versi app) dipangkas dengan TOKO_PLAY
 * ditetapkan: cabang `TOKO_PLAY ? a : b`, `!TOKO_PLAY && x`, dan syarat yang
 * menyiratkan nilai lain (`(plus || !TOKO_PLAY) && ...` = plus benar di
 * dalamnya) dibuang; syarat yang tidak diketahui DUA cabangnya dibaca.
 * Hasilnya: setiap string dan teks JSX yang bisa tercetak di build itu.
 */
const ts = (await import('typescript')).default;
function teksTercetak(jalur, { toko, fungsi }) {
  const sf = ts.createSourceFile(jalur, readFileSync(jalur, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let akar = sf;
  if (fungsi !== undefined) {
    akar = null;
    const cari = (n) => { if (akar === null && ts.isFunctionDeclaration(n) && n.name?.text === fungsi) akar = n; else ts.forEachChild(n, cari); };
    cari(sf);
    tegas(akar !== null, `fungsi ${fungsi} tidak ada di ${jalur} — pemindai menembak berkas yang salah`);
  }
  const DAN = ts.SyntaxKind.AmpersandAmpersandToken;
  const ATAU = ts.SyntaxKind.BarBarToken;
  const nilai = (e, a) => {
    if (ts.isParenthesizedExpression(e)) return nilai(e.expression, a);
    if (ts.isIdentifier(e)) return e.text === 'TOKO_PLAY' ? toko : a.get(e.text);
    if (ts.isPrefixUnaryExpression(e) && e.operator === ts.SyntaxKind.ExclamationToken) { const v = nilai(e.operand, a); return v === undefined ? undefined : !v; }
    if (ts.isBinaryExpression(e) && (e.operatorToken.kind === DAN || e.operatorToken.kind === ATAU)) {
      const x = nilai(e.left, a); const y = nilai(e.right, a);
      if (e.operatorToken.kind === DAN) return x === false || y === false ? false : x === true && y === true ? true : undefined;
      return x === true || y === true ? true : x === false && y === false ? false : undefined;
    }
    return undefined;
  };
  /** Nilai pengenal yang berlaku TANPA KECUALI kalau `e` bernilai `benar`. */
  const asumsikan = (e, benar, a) => {
    if (ts.isParenthesizedExpression(e)) return asumsikan(e.expression, benar, a);
    if (ts.isIdentifier(e)) return e.text === 'TOKO_PLAY' ? a : new Map([...a, [e.text, benar]]);
    if (ts.isPrefixUnaryExpression(e) && e.operator === ts.SyntaxKind.ExclamationToken) return asumsikan(e.operand, !benar, a);
    if (ts.isBinaryExpression(e)) {
      const dan = e.operatorToken.kind === DAN; const atau = e.operatorToken.kind === ATAU;
      if ((dan && benar) || (atau && !benar)) return asumsikan(e.right, benar, asumsikan(e.left, benar, a));
      if (atau && benar) { if (nilai(e.left, a) === false) return asumsikan(e.right, true, a); if (nilai(e.right, a) === false) return asumsikan(e.left, true, a); }
      if (dan && !benar) { if (nilai(e.left, a) === true) return asumsikan(e.right, false, a); if (nilai(e.right, a) === true) return asumsikan(e.left, false, a); }
    }
    return a;
  };
  const teks = [];
  const kunjungi = (n, a) => {
    if (ts.isImportDeclaration(n)) return;
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) { teks.push(n.text); return; }
    if (ts.isJsxText(n)) { const t = n.text.replace(/\s+/g, ' ').trim(); if (t !== '') teks.push(t); return; }
    if (ts.isTemplateExpression(n)) { teks.push(n.head.text); for (const sp of n.templateSpans) { kunjungi(sp.expression, a); teks.push(sp.literal.text); } return; }
    if (ts.isConditionalExpression(n)) {
      const v = nilai(n.condition, a);
      if (v !== false) kunjungi(n.whenTrue, asumsikan(n.condition, true, a));
      if (v !== true) kunjungi(n.whenFalse, asumsikan(n.condition, false, a));
      return;
    }
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === DAN) {
      if (nilai(n.left, a) !== false) kunjungi(n.right, asumsikan(n.left, true, a));
      return;
    }
    if (ts.isBinaryExpression(n) && n.operatorToken.kind === ATAU) {
      kunjungi(n.left, a);
      if (nilai(n.left, a) !== true) kunjungi(n.right, asumsikan(n.left, false, a));
      return;
    }
    ts.forEachChild(n, (c) => kunjungi(c, a));
  };
  kunjungi(akar, new Map());
  return teks;
}
/** Permukaan AM+ yang mencetak kalimat langganan sendiri, dengan satu kalimat jangkar tiap permukaan. */
const PERMUKAAN_PLUS = [
  { jalur: 'src/layar/AmPlus.tsx', jangkar: 'Yang tetap gratis' },
  { jalur: 'src/komponen/KartuPlus.tsx', jangkar: 'Kelola langganan' },
  { jalur: 'src/layar/Akun.tsx', fungsi: 'LayarBerlangganan', jangkar: 'Keadaan akunmu' },
];
/** Harga, cara bayar, dan jalur beli — pola `periksa-toko.mjs` ditambah kata pembayarannya. */
const SOAL_BAYAR = /Rp|bayar|potong otomatis|\/plus|@|lewat bot|berlangganan lewat|cara berlangganan|\bbeli|pembelian/i;

await uji('KEPUTUSAN: build Play tidak mencetak satu kalimat pun soal pembayaran di kartu AM+, kartu Home, dan layar Berlangganan', async () => {
  for (const p of PERMUKAAN_PLUS) {
    const play = teksTercetak(p.jalur, { toko: true, fungsi: p.fungsi });
    tegas(play.length >= 15, `cuma ${play.length} teks terbaca dari ${p.jalur} ${p.fungsi ?? ''} — pemindaian ini tidak menguji apa pun`);
    tegas(play.includes(p.jangkar), `"${p.jangkar}" tidak terbaca dari ${p.jalur} — pemindai memangkas cabang yang salah`);
    const langgar = play.filter((t) => SOAL_BAYAR.test(t));
    tegas(langgar.length === 0, `${p.jalur} ${p.fungsi ?? ''} di build Play bisa mencetak: ${langgar.map((t) => `"${t}"`).join(', ')} — kebijakan pembayaran Play, dan tanyaPlus(true) sudah diam`);
  }
});

await uji('teks build Play, cabang lawan: build tautan unduhan TETAP menyebut sekali bayar tanpa potong otomatis (pemindai bisa merah)', async () => {
  const unduhan = PERMUKAAN_PLUS.flatMap((p) => teksTercetak(p.jalur, { toko: false, fungsi: p.fungsi }));
  tegas(unduhan.some((t) => /potong otomatis/.test(t)) && unduhan.some((t) => /\/plus ke @/.test(t)), 'pemindai tidak melihat kalimat bayar di build unduhan — ia tidak akan pernah bisa merah');
  const amUnduhan = teksTercetak('src/layar/AmPlus.tsx', { toko: false });
  const amPlay = teksTercetak('src/layar/AmPlus.tsx', { toko: true });
  tegas(amUnduhan.includes('Berakhir sendiri di tanggalnya. Tidak ada potong otomatis.'), 'kartu AM+ pelanggan di build unduhan kehilangan "Tidak ada potong otomatis" — S&K app, web, dan bot menyebutnya');
  tegas(amPlay.includes('Berakhir sendiri di tanggalnya.'), 'kartu AM+ pelanggan di build Play tidak lagi menyebut tanggal berakhirnya');
});

await uji('KEPUTUSAN: jumlah pasar tidak diketik — dihitung dari /api/pasar atau tanpa angka', async () => {
  const angkaPasar = /\b\d{3}\s+pasar\b/i;
  const langgar = SUMBER.filter((f) => angkaPasar.test(tanpaKomentar(readFileSync(f, 'utf8'))));
  tegas(langgar.length === 0, `jumlah pasar diketik di ${langgar.join(', ')} — "131 pasar" masih tercetak saat daftarnya 155 (3 Okt)`);
  tegas(tampil.kalimatCakupan(155).includes('155 pasar'), `kalimat cakupan 155 → "${tampil.kalimatCakupan(155)}"`);
  tegas(!/\d/.test(tampil.kalimatCakupan(null)), `kalimat cakupan tanpa data memuat angka: "${tampil.kalimatCakupan(null)}"`);
});

await uji('KEPUTUSAN: "yang terbuka" menyebut kabar otomatis HANYA untuk pelanggan', async () => {
  const teks = (s) => amplus.terbukaSekarang(s).map(([j, k]) => `${j}: ${k}`).join(' | ');
  tegas(/Kabar otomatis/.test(teks('plus')), `pelanggan tidak melihat kabar otomatis: ${teks('plus')}`);
  for (const s of ['gratis', null]) tegas(!/kabar otomatis/i.test(teks(s)), `status ${String(s)} dijanjikan kabar otomatis (butuh AM+): ${teks(s)}`);
  tegas(teks('plus') !== teks('gratis'), 'kedua cabang identik');
  for (const s of ['plus', 'gratis', null]) {
    tegas(!/sama di app dan web/i.test(teks(s)), 'setelan bawaan dijanjikan sama di app dan web — app menyimpannya di perangkat (simpan.ts)');
    tegas(/di HP ini/.test(teks(s)), `baris setelan tidak menyebut tempat simpannya: ${teks(s)}`);
  }
});

await uji('KEPUTUSAN: kartu AM+ tidak menjual fitur gratis — manfaatnya diturunkan dari FITUR_PLUS', async () => {
  tegas(amplus.MANFAAT_KARTU_PLUS.length === 3, `${amplus.MANFAAT_KARTU_PLUS.length} manfaat di kartu`);
  for (const m of amplus.MANFAAT_KARTU_PLUS) {
    tegas(amplus.FITUR_PLUS.some((f) => m.startsWith(f.nama)), `manfaat "${m}" bukan isi FITUR_PLUS`);
    tegas(!/kabar ke HP|pantauan/i.test(m), `manfaat "${m}" menjual pantauan/push yang gratis`);
  }
  tegas(/MANFAAT_KARTU_PLUS\.map/.test(tanpaKomentar(readFileSync('src/komponen/KartuPlus.tsx', 'utf8'))), 'KartuPlus tidak merender MANFAAT_KARTU_PLUS — daftar diketik lagi di layar');
  tegas(!/pantauan otomatis, tanpa membuka app/i.test(amplus.JUDUL_PLUS), `judul AM+: "${amplus.JUDUL_PLUS}" — pantauan biasa sudah tanpa membuka app`);
});

await uji('KEPUTUSAN: daftar fitur app tidak menjanjikan yang cuma ada di bot', async () => {
  const semua = [...amplus.FITUR_GRATIS, ...amplus.FITUR_PLUS];
  tegas(semua.length >= 8, `cuma ${semua.length} fitur terbaca — sapuan ini tidak menguji apa pun`);
  for (const f of semua) {
    if (/DEX|irama/i.test(`${f.nama} ${f.keterangan}`)) tegas(/bot/i.test(`${f.nama} ${f.keterangan}`), `"${f.nama} · ${f.keterangan}" tidak menyebut bahwa ia cuma di bot`);
  }
  const dex = amplus.FITUR_GRATIS.find((f) => /DEX/.test(f.nama));
  tegas(dex === undefined || /bot/i.test(dex.nama), 'layar AM+ mencetak NAMA saja — "Cek token DEX" tanpa "bot" di namanya terbaca fitur app');
  tegas(!amplus.FITUR_GRATIS.some((f) => /m15 ke atas/i.test(f.nama)), 'daftar gratis menulis "semua pasar m15 ke atas" — cuma 31 dari 155 pasar punya m15 (3 Okt)');
  const cek = amplus.FITUR_PLUS.find((f) => f.nama === 'Cek Banyak');
  tegas(cek !== undefined && /×\s*timeframe/.test(cek.keterangan), `Cek Banyak: "${cek?.keterangan}" — batasnya 12 slot pasar × timeframe`);
});

/* ── ajakan AM+ Kabar otomatis (3 Okt): 402 DAN 200 {plus:false} ─────── */
await uji('KEPUTUSAN: akun gratis di Kabar otomatis melihat ajakan AM+ — juga saat server menjawab 200 { plus: false } (bentuk yang dikirim bot)', async () => {
  tegas(statusPlus.layarAjakanPlus(null, { plus: false }) === true, '200 { plus: false } wajib ajakan — bentuk inilah yang dikirim GET /api/saya/kabar-otomatis; tanpanya akun gratis melihat saklar mati');
  tegas(statusPlus.layarAjakanPlus('plus', null) === true, '402 perlu-plus wajib ajakan');
});
await uji('ajakan AM+, cabang lawan: pelanggan dan layar yang masih memuat BUKAN ajakan; layar Kabar otomatis memakai keputusannya', async () => {
  tegas(statusPlus.layarAjakanPlus(null, { plus: true }) === false, 'plus: true bukan ajakan');
  tegas(statusPlus.layarAjakanPlus(null, null) === false, 'masih memuat (isi null, tanpa galat) bukan ajakan');
  tegas(statusPlus.layarAjakanPlus('jaringan', null) === false, 'galat jaringan bukan ajakan — itu "Coba lagi"');
  const kode = tanpaKomentar(readFileSync(join(AKAR, 'src/layar/Akun.tsx'), 'utf8'));
  const layar = kode.slice(kode.indexOf('function LayarKabarOtomatis'), kode.indexOf('function LayarKabarOtomatis') + 2500);
  tegas(/layarAjakanPlus\(jenis, d\)/.test(layar), 'LayarKabarOtomatis wajib memutuskan ajakan lewat layarAjakanPlus(jenis, d), bukan jenis === "plus" saja');
});
/* ── tf pengganti (3 Okt): terdekat DI ATAS, disebut — sama dengan web ─── */
await uji('KEPUTUSAN: EURUSDT (m1 m5 d1) yang diminta h1 dibuka d1 dan DISEBUT — bukan m1 diam-diam (punya[0])', async () => {
  const ada = ['m1', 'm5', 'd1'];
  const dibuka = tfPengganti.tfNaik(ada, 'h1');
  tegas(dibuka === 'd1', `terbuka ${String(dibuka)}, seharusnya d1 — terdekat di atas h1; m1 = aturan lama punya[0], beda dengan web`);
  const kata = tfPengganti.catatanTf('EURUSDT', 'h1', dibuka);
  tegas(kata !== null && /\bh1\b/.test(kata) && /\bd1\b/.test(kata) && kata.includes('EURUSDT'), `kalimat "${String(kata)}" wajib menyebut pasar, h1 yang diminta, dan d1 yang dibuka`);
});
await uji('tf pengganti, cabang lawan: tf yang ada tidak diganti dan tidak berkalimat; di atas semua → tertinggi', async () => {
  tegas(tfPengganti.tfNaik(['m1', 'm5', 'm15', 'h1', 'h4', 'd1'], 'h1') === 'h1', 'h1 yang ada wajib tetap h1');
  tegas(tfPengganti.catatanTf('BTCUSDT', 'h1', 'h1') === null, 'tanpa penggantian tidak boleh ada kalimat');
  tegas(tfPengganti.tfNaik(['h1', 'h4', 'd1'], 'm15') === 'h1', 'berkuota m15 wajib h1');
  tegas(tfPengganti.tfNaik(['m1', 'm5', 'h1'], 'd1') === 'h1', 'di atas semua wajib yang tertinggi (h1)');
  tegas(tfPengganti.tfNaik([], 'h1') === undefined, 'daftar kosong wajib undefined');
});

process.stdout.write('\n── K16 · layar Pasar di React sungguhan ──\n');

/**
 * Layar `.tsx` tidak bisa diimpor di sini (JSX), tapi KAIT-nya bisa, dan bug
 * layar Pasar 3 Okt hidup di urutan render dan efek — yang tidak terlihat
 * dari fungsi murni. Kaitnya dijalankan di React 19 + react-dom sungguhan
 * (versi yang sama dengan app) dengan wadah tiruan: komponen uji merender
 * `null`, jadi DOM tidak pernah disentuh.
 */
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { act, createElement: h, useState } = React;
const globalSebelum = { window: globalThis.window, document: globalThis.document, HTMLIFrameElement: globalThis.HTMLIFrameElement };
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.window = globalThis;
globalThis.HTMLIFrameElement = class {};
globalThis.document = { activeElement: null, body: null, addEventListener() {}, removeEventListener() {} };
async function pasang(elemen) {
  const doc = { addEventListener() {}, removeEventListener() {} };
  const akar = createRoot({ nodeType: 1, nodeName: 'DIV', tagName: 'DIV', ownerDocument: doc, addEventListener() {}, removeEventListener() {} });
  await act(async () => { akar.render(elemen); });
  return {
    ganti: async (e) => { await act(async () => { akar.render(e); }); },
    lakukan: async (f) => { await act(async () => { await f(); }); },
    lepas: async () => { await act(async () => { akar.unmount(); }); },
  };
}

const SETELAN_UJI = { pasar: 'BTCUSDT', tf: 'h1', mesin: '', layarMenyala: false, pushNyala: false, tema: 'gelap' };
const P_BTC = { simbol: 'BTCUSDT', timeframes: ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'] };
const P_EUR = { simbol: 'EURUSDT', timeframes: ['M1', 'M5', 'D1'] };
const P_XAU = { simbol: 'XAU/USD', timeframes: ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'] };
const KATA_EUR = 'h1 tidak tersedia untuk EURUSDT — dibuka d1.';

/** Pemilik setelan seperti App.tsx (`simpan` = setSetelan), daftar seperti efek `/api/pasar`. */
async function layarPasarUji(daftarAwal) {
  const l = {};
  function Pemilik() {
    const [setelan, setSetelan] = useState(SETELAN_UJI);
    const [daftar, setDaftar] = useState(daftarAwal);
    l.setelan = setelan; l.simpan = setSetelan; l.setDaftar = setDaftar;
    l.layar = layarPasar.usePasarTf(setelan, setSetelan, daftar);
    return null;
  }
  l.akar = await pasang(h(Pemilik));
  return l;
}

await uji('KEPUTUSAN: ganti pasar menyimpan tf yang DIMINTA (h1), bukan penggantinya (d1) — kalimat penggantian bertahan sesudah /api/pasar menjawab', async () => {
  const l = await layarPasarUji([P_BTC, P_EUR]);
  tegas(l.layar.pasar?.simbol === 'BTCUSDT' && l.layar.tf === 'h1' && l.layar.kataTf === '', `awal: ${JSON.stringify({ p: l.layar.pasar?.simbol, tf: l.layar.tf, kata: l.layar.kataTf })}`);
  await l.akar.lakukan(() => { l.layar.pilihPasar(P_EUR); });
  tegas(l.layar.pasar?.simbol === 'EURUSDT' && l.layar.tf === 'd1', `EURUSDT (m1 m5 d1) yang diminta h1 terbuka ${l.layar.tf}, seharusnya d1`);
  tegas(l.layar.kataTf === KATA_EUR, `kalimat sesudah pilih EURUSDT: "${l.layar.kataTf}"`);
  tegas(l.setelan.tf === 'h1', `setelan.tf tersimpan "${l.setelan.tf}" — pengganti d1 ditulis sebagai pilihan user, jadi BTCUSDT berikutnya (dan buka app berikutnya) terbuka d1 tanpa satu kalimat pun`);
  /* Efek muat daftar di layar menyegarkan /api/pasar tiap ganti pasar — objek baru, isi sama. */
  await l.akar.lakukan(() => { l.setDaftar([{ ...P_BTC }, { ...P_EUR }]); });
  tegas(l.layar.kataTf === KATA_EUR, `sesudah /api/pasar menjawab kalimatnya "${l.layar.kataTf}" — dulu terhapus 0-500 ms sesudah pilihan pasar`);
  await l.akar.lakukan(() => { l.layar.pilihPasar(P_BTC); });
  tegas(l.layar.tf === 'h1' && l.layar.kataTf === '', `kembali ke BTCUSDT: tf ${l.layar.tf}, kalimat "${l.layar.kataTf}" — h1 pilihan user wajib kembali, tanpa kalimat`);
  await l.akar.lepas();
});

await uji('tf pengganti, cabang lawan: tf yang dipilih SENDIRI disimpan dan tidak berkalimat', async () => {
  const l = await layarPasarUji([P_BTC, P_EUR]);
  await l.akar.lakukan(() => { l.layar.pilihPasar(P_EUR); });
  const pengganti = l.layar.kataTf;
  await l.akar.lakukan(() => { l.layar.pilihTf('d1'); });
  tegas(l.setelan.tf === 'd1' && l.setelan.pasar === 'EURUSDT', `pilihan d1 tersimpan sebagai ${l.setelan.pasar} ${l.setelan.tf}`);
  tegas(l.layar.tf === 'd1' && l.layar.kataTf === '', `d1 yang dipilih sendiri masih berkalimat "${l.layar.kataTf}"`);
  tegas(pengganti !== l.layar.kataTf, 'kalimat pengganti dan pilihan sendiri identik — salah satu cabang diam-diam disamakan');
  await l.akar.lakukan(() => { l.layar.pilihPasar(P_BTC); });
  tegas(l.layar.tf === 'd1' && l.layar.kataTf === '', `d1 pilihan sendiri tidak ikut ke BTCUSDT: ${l.layar.tf} "${l.layar.kataTf}"`);
  await l.akar.lepas();
});

await uji('KEPUTUSAN: ketukan kabar XAU/USD m15 membuka m15 — juga saat layar Pasar sudah terbuka di h1', async () => {
  const l = await layarPasarUji([P_BTC, P_XAU, P_EUR]);
  /* App.tsx, ketukan notifikasi DAN layar Kabar: simpan({ ...setelan, pasar, tf }) lalu pindah tab. */
  await l.akar.lakukan(() => { l.simpan({ ...l.setelan, pasar: 'XAU/USD', tf: 'm15' }); });
  tegas(l.layar.pasar?.simbol === 'XAU/USD' && l.layar.tf === 'm15' && l.layar.kataTf === '', `kabar XAU/USD m15 membuka ${l.layar.pasar?.simbol} ${l.layar.tf} "${l.layar.kataTf}" — tf lokal lama menang atas tf kabar`);
  /* Pasar sama, tf lain: dulu efek muat daftar tidak jalan sama sekali. */
  await l.akar.lakukan(() => { l.simpan({ ...l.setelan, tf: 'h4' }); });
  tegas(l.layar.tf === 'h4', `kabar XAU/USD h4 di pasar yang sudah terbuka membuka ${l.layar.tf}`);
  await l.akar.lepas();
});

await uji('ketukan kabar, cabang lawan: tf kabar yang tidak dimiliki pasarnya tetap lewat tfNaik + kalimat', async () => {
  const l = await layarPasarUji([P_BTC, P_EUR]);
  await l.akar.lakukan(() => { l.simpan({ ...l.setelan, pasar: 'EURUSDT', tf: 'H1' }); });
  tegas(l.layar.tf === 'd1' && l.layar.kataTf === KATA_EUR, `kabar EURUSDT H1 membuka ${l.layar.tf} "${l.layar.kataTf}" — wajib d1 dan disebut`);
  await l.akar.lepas();
});

/* ── bacaan layar Pasar: jawaban milik tf lain dibuang ─────────────────── */
/** `ambil` tiruan yang menjawab dalam urutan yang dipilih uji — antrean JARAK_MS + simpanan 20 dtk membuat urutan itu nyata. */
function bacaanTiruan() {
  const tunda = [];
  const ambil = (pasar, tf, segarkan = false) => new Promise((selesai) => { tunda.push({ pasar, tf, segarkan, selesai }); });
  async function jawabDi(akar, pasar, tf, jawaban) {
    const i = tunda.findIndex((x) => x.pasar === pasar && x.tf === tf);
    tegas(i >= 0, `tidak ada permintaan ${pasar} ${tf} yang menunggu (${tunda.map((x) => `${x.pasar} ${x.tf}`).join(', ')})`);
    const [x] = tunda.splice(i, 1);
    await akar.lakukan(async () => { x.selesai(jawaban); await new Promise((r) => { setTimeout(r, 0); }); });
  }
  return { ambil, tunda, jawabDi };
}
const BACAAN_OK = (pasar, tf) => ({ ok: true, isi: { pasar, tf, harga: 1, mesin: [] }, dariSimpanan: false, cacheNginx: null });
const TOLAK_PLUS = { ok: false, jenis: 'ditolak', kalimat: 'M5 untuk XAU/USD bagian AnalisMarket+.', galat: 'perlu-plus' };
async function pembacaUji(ambil, simbol, tf) {
  const l = {};
  function Pembaca(p) { l.baca = layarPasar.useBacaanPasar(p.simbol, p.tf, p.ambil); return null; }
  l.akar = await pasang(h(Pembaca, { simbol, tf, ambil }));
  l.ke = (simbol2, tf2) => l.akar.ganti(h(Pembaca, { simbol: simbol2, tf: tf2, ambil }));
  /** Yang dicetak lembar bawah layar Pasar (`isiLembarGagal(gagalBaca)`), atau null. */
  l.lembar = () => (l.baca.gagalBaca === null ? null : gagalBacaan.isiLembarGagal(l.baca.gagalBaca));
  return l;
}

await uji('KEPUTUSAN: 402 milik tf lain tidak pernah tercetak di tf yang sedang dibuka — ganti tf/pasar mengosongkan lembar', async () => {
  const t = bacaanTiruan();
  const l = await pembacaUji(t.ambil, 'XAU/USD', 'm5');
  await t.jawabDi(l.akar, 'XAU/USD', 'm5', TOLAK_PLUS);
  tegas(l.lembar()?.aksi === 'plus' && l.lembar()?.judul === 'm5 XAU/USD bagian dari AnalisMarket+', `402 m5 untuk tf yang terbuka: ${JSON.stringify(l.lembar())}`);
  await l.ke('XAU/USD', 'h1');
  tegas(l.lembar() === null, `selama h1 antre (JARAK_MS 1.100 + jaringan) lembar mencetak ${JSON.stringify(l.lembar()?.judul)} — 402 milik m5 di tf gratis, tanpa Coba lagi`);
  await t.jawabDi(l.akar, 'XAU/USD', 'h1', BACAAN_OK('XAU/USD', 'h1'));
  tegas(l.baca.bacaan?.tf === 'h1' && l.lembar() === null, `bacaan h1 sesudah dijawab: ${JSON.stringify({ tf: l.baca.bacaan?.tf, lembar: l.lembar() })}`);
  /* Pasar lain, tf sama: m5 kripto gratis tidak boleh mewarisi tembok emas. */
  await l.ke('XAU/USD', 'm5');
  await t.jawabDi(l.akar, 'XAU/USD', 'm5', TOLAK_PLUS);
  await l.ke('BTCUSDT', 'm5');
  tegas(l.lembar() === null, `pindah ke BTCUSDT m5 mencetak ${JSON.stringify(l.lembar()?.judul)} — m5 kripto gratis`);
  await l.akar.lepas();
});

await uji('KEPUTUSAN: jawaban yang tiba tidak berurutan dibuang — 402 m5 yang telat tidak menimpa bacaan h1', async () => {
  const t = bacaanTiruan();
  const l = await pembacaUji(t.ambil, 'XAU/USD', 'h1');
  await t.jawabDi(l.akar, 'XAU/USD', 'h1', BACAAN_OK('XAU/USD', 'h1'));
  await l.ke('XAU/USD', 'm5');                                           // m5 menunggu giliran antrean
  await l.ke('XAU/USD', 'h1');                                           // kembali sebelum giliran m5 tiba
  await t.jawabDi(l.akar, 'XAU/USD', 'h1', BACAAN_OK('XAU/USD', 'h1')); // h1 dari simpanan, seketika
  await t.jawabDi(l.akar, 'XAU/USD', 'm5', TOLAK_PLUS);                  // 402 m5 tiba belakangan
  tegas(l.baca.bacaan?.tf === 'h1', `402 m5 yang telat menghapus bacaan h1 (bacaan: ${JSON.stringify(l.baca.bacaan?.tf ?? null)})`);
  tegas(l.lembar() === null, `402 m5 yang telat tercetak di layar h1: ${JSON.stringify(l.lembar()?.judul)}`);
  await l.akar.lepas();
});

await uji('jawaban basi, cabang lawan: penolakan permintaan TERAKHIR tetap tercetak dari tf yang ditolak; Coba lagi = permintaan segar', async () => {
  const t = bacaanTiruan();
  const l = await pembacaUji(t.ambil, 'XAU/USD', 'h1');
  await t.jawabDi(l.akar, 'XAU/USD', 'h1', { ok: false, jenis: 'jaringan', kalimat: 'Tidak bisa menghubungi server.' });
  tegas(l.lembar()?.aksi === 'coba', `jaringan putus di tf yang terbuka: ${JSON.stringify(l.lembar())}`);
  await l.akar.lakukan(() => { l.baca.muatUlang(); });
  const ulang = t.tunda.find((x) => x.pasar === 'XAU/USD' && x.tf === 'h1');
  tegas(ulang?.segarkan === true, `Coba lagi tidak meminta XAU/USD h1 segar: ${JSON.stringify(t.tunda.map((x) => [x.pasar, x.tf, x.segarkan]))}`);
  await t.jawabDi(l.akar, 'XAU/USD', 'h1', BACAAN_OK('XAU/USD', 'h1'));
  tegas(l.baca.bacaan !== null && l.lembar() === null, 'Coba lagi yang berhasil tidak mengganti lembar gagal dengan bacaan');
  const g = gagalBacaan.gagalBacaan({ jenis: 'ditolak', kalimat: 'x', galat: 'perlu-plus' }, { pasar: 'XAU/USD', tf: 'M5' });
  tegas(gagalBacaan.isiLembarGagal(g).judul === 'm5 XAU/USD bagian dari AnalisMarket+', `judul dari permintaan yang ditolak: "${gagalBacaan.isiLembarGagal(g).judul}"`);
  await l.akar.lepas();
});

await uji('layar Pasar lewat usePasarTf — tanpa salinan tf lokal, tanpa simpan sendiri, tanpa punya[0]', async () => {
  const kode = tanpaKomentar(readFileSync(join(AKAR, 'src/layar/Analisis.tsx'), 'utf8'));
  tegas(/usePasarTf\(setelan, simpan, daftarPasar\)/.test(kode), 'Analisis.tsx tidak memakai usePasarTf(setelan, simpan, daftarPasar) — uji React di atas menembak kait yang tidak dipakai layar');
  tegas(!/useState\(setelan\.tf\)/.test(kode), 'Analisis.tsx menyalin setelan.tf ke keadaan lokal — ketukan kabar membuka tf lama');
  tegas(!/\bsetTf\(|\bsetKataTf\(/.test(kode), 'Analisis.tsx menulis tf/kalimat sendiri — kalimat bisa dihapus efek yang selesai belakangan');
  tegas(!/\bsimpan\(\{/.test(kode), 'Analisis.tsx menyimpan setelan sendiri — tf pengganti bisa tertulis sebagai pilihan user lagi');
  tegas(/pilih=\{\(k\) => \{ pilihTf\(k\);/.test(kode) && /pilih=\{\(p\) => \{ pilihPasar\(p\);/.test(kode), 'pil tf / lembar pasar tidak memanggil pilihTf / pilihPasar');
  tegas(!/punya\[0\]/.test(kode), 'Analisis.tsx masih memakai punya[0] — penggantian diam-diam ke tf terendah');
});

process.stdout.write('\n── K17 · keluar akun mencabut HP ini ──\n');

const GOOGLE_UJI = {
  getToken: async () => 'jwt-clerk-uji',
  signOut: async () => {},
  akun: { akunId: 0, email: 'uji@contoh.id', nama: 'Uji', telegramTersambung: false, langganan: null },
};
/** Sesudah keluar, sesi Google dipasang lagi untuk uji berikutnya — seperti JembatanClerk sesudah masuk ulang. */
function pulihkanGoogle() { sesi.pasangClerk(GOOGLE_UJI); tegas(sesi.sesiSekarang()?.jenis === 'clerk', 'sesi Google uji tidak pulih'); }
const permintaanCabut = (dari) => terkirim.slice(dari).filter((r) => r.url.endsWith('/api/saya/perangkat/cabut'));
/** Janji yang tidak boleh menggantung uji: merah sesudah `ms`, bukan diam selamanya. */
const dalamBatas = (janji, ms, apa) => Promise.race([janji, new Promise((_, tolak) => { setTimeout(() => { tolak(new Error(`${apa} tidak selesai dalam ${ms} ms`)); }, ms); })]);
const TOKEN_HP = 'ExponentPushToken[uji-keluar]';

await uji('KEPUTUSAN: keluar mencabut HP ini sebagai penerima kabar SEBELUM sesinya dibuang — Bearer masih ikut', async () => {
  pulihkanGoogle();
  const dari = terkirim.length;
  jawab(200, { status: 'dicabut' });
  const h = await saya.keluarAkun(async () => TOKEN_HP);
  const [cabut] = permintaanCabut(dari);
  tegas(cabut !== undefined, 'keluar tanpa POST /api/saya/perangkat/cabut — perangkat_push tetap aktif, pilihSaluran terus memilih push, kabar akun ini masuk ke HP yang sudah keluar');
  tegas(cabut.metode === 'POST' && cabut.badan?.token === TOKEN_HP, `badan cabut ${JSON.stringify(cabut.badan)}`);
  tegas(cabut.header.authorization === 'Bearer jwt-clerk-uji', `cabut berangkat tanpa sesi (${JSON.stringify(cabut.header)}) — sesudah sesi dibuang tidak ada yang bisa mencabut`);
  tegas(h.perangkat === 'dicabut', `hasil keluar ${JSON.stringify(h)}`);
  tegas(sesi.sesiSekarang() === null, 'sesi Google tidak dibuang sesudah keluar');
  /* Sesi mini (Telegram) juga: dicabut dengan token mini, lalu Google yang masih masuk tetap tampil. */
  pulihkanGoogle();
  jawab(200, { sesi: 'sesi-mini-uji', akun: { akunId: 9, email: null, nama: 'M', telegramTersambung: true, langganan: 'gratis' } });
  const s = await sesi.sambungkan(`${ASAL_APP}/?masuk=${'a'.repeat(32)}`);
  tegas(s.ok && sesi.sesiSekarang()?.jenis === 'mini', 'sesi mini uji tidak terpasang');
  const dari2 = terkirim.length;
  jawab(200, { status: 'dicabut' });
  await saya.keluarAkun(async () => TOKEN_HP);
  tegas(permintaanCabut(dari2)[0]?.header.authorization === 'Bearer sesi-mini-uji', 'sesi mini keluar tanpa mencabut dengan token mini');
  tegas(sesi.sesiSekarang()?.jenis === 'clerk', `sesudah sesi mini dicabut yang tampil ${String(sesi.sesiSekarang()?.jenis)} — Google yang masih masuk wajib tetap`);
});

await uji('keluar, cabang lawan: jaringan putus, batas waktu, atau tanpa token push TIDAK menahan keluar', async () => {
  pulihkanGoogle();
  putus();
  const a = await saya.keluarAkun(async () => TOKEN_HP);
  tegas(a.perangkat === 'gagal' && typeof a.kalimat === 'string' && a.kalimat !== '', `jaringan putus: ${JSON.stringify(a)}`);
  tegas(sesi.sesiSekarang() === null, 'jaringan putus menahan keluar — orang yang menekan Keluar tetap masuk');
  pulihkanGoogle();
  const mulai = Date.now();
  const b = await dalamBatas(saya.keluarAkun(() => new Promise(() => {}), 50), 3000, 'keluar dengan token Expo yang menggantung');
  tegas(b.perangkat === 'gagal' && sesi.sesiSekarang() === null && Date.now() - mulai < 2000, `token menggantung: ${JSON.stringify(b)} sesudah ${Date.now() - mulai} ms`);
  pulihkanGoogle();
  const dari = terkirim.length;
  const c = await saya.keluarAkun(async () => null);
  tegas(c.perangkat === 'tanpa-token' && permintaanCabut(dari).length === 0 && sesi.sesiSekarang() === null, `tanpa token push: ${JSON.stringify(c)}, ${permintaanCabut(dari).length} permintaan cabut`);
  pulihkanGoogle();
});

await uji('keluar, cabang lawan: 401 membuang sesi TANPA mencabut; cabut yang dijawab 401 tidak ikut mengeluarkan Google', async () => {
  pulihkanGoogle();
  const dari = terkirim.length;
  jawab(401, {});
  await saya.ambilRingkas();
  tegas(permintaanCabut(dari).length === 0, 'jalur 401 memanggil cabut — sesi yang sudah mati tidak bisa mencabut apa pun');
  tegas(sesi.sesiSekarang() === null, '401 tidak membuang sesi');
  pulihkanGoogle();
  jawab(200, { sesi: 'sesi-mini-mati', akun: { akunId: 9, email: null, nama: 'M', telegramTersambung: true, langganan: 'gratis' } });
  await sesi.sambungkan(`${ASAL_APP}/?masuk=${'b'.repeat(32)}`);
  jawab(401, {});
  await saya.keluarAkun(async () => TOKEN_HP);
  tegas(sesi.sesiSekarang()?.jenis === 'clerk', `cabut sesi mini dijawab 401 lalu sesi dibuang DUA kali: yang tersisa ${String(sesi.sesiSekarang()?.jenis ?? null)} — Google ikut keluar`);
  pulihkanGoogle();
  for (const f of ['src/layar/Profil.tsx', 'src/layar/Akun.tsx']) {
    const kode = tanpaKomentar(readFileSync(f, 'utf8'));
    tegas(/await keluarAkun\(tokenPerangkat\)/.test(kode), `${f}: tombol keluar tidak lewat keluarAkun(tokenPerangkat)`);
    tegas(!/void hapusSesi\(\)/.test(kode), `${f}: tombol keluar masih memanggil hapusSesi langsung — HP ini tetap menerima kabar akun yang sudah keluar`);
  }
});

/* ── pemutar Akademi (9 Okt): Bunny Stream lewat iframe, jembatan player.js ── */
process.stdout.write('\n── Pemutar Akademi ──\n');
const pemutar = await muat('src/data/pemutar.ts');
const akademi = await muat('src/data/akademi.ts');
const GUID_UJI = '3f2a9c1e-7b4d-4e2a-9f10-5c6d7e8f9a0b';
const EMBED_UJI = `${pemutar.ASAL_BUNNY}/embed/12345/${GUID_UJI}?token=${'a1'.repeat(32)}&expires=1791000000&autoplay=true&preload=true&responsive=true`;
const pj = (event, value) => JSON.stringify({ context: 'player.js', version: '0.0.11', event, value });

/** Skrip jembatan yang SAMA dengan yang tertanam di WebView, dengan jendela dan iframe tiruan. */
function jalankanJembatan(mulai) {
  const keApp = []; const kePemutar = []; let dengar = null;
  const jendelaBunny = { postMessage: (data, target) => { kePemutar.push({ ...JSON.parse(data), target }); } };
  const jendela = {
    addEventListener: (jenis, f) => { if (jenis === 'message') dengar = f; },
    ReactNativeWebView: { postMessage: (t) => { keApp.push(JSON.parse(t)); } },
  };
  const dokumen = { getElementById: (id) => (id === 'f' ? { contentWindow: jendelaBunny } : null) };
  // eslint-disable-next-line no-new-func
  new Function('window', 'document', pemutar.skripJembatanBunny(mulai))(jendela, dokumen);
  const pesan = (data, origin = pemutar.ASAL_BUNNY, source = jendelaBunny) => { dengar?.({ data, origin, source }); };
  return { keApp, kePemutar, pesan };
}

await uji('KEPUTUSAN: /putar meminta pemutar Bunny (dukung=iframe) dan menerima iframe HANYA dari asal Bunny persis', async () => {
  const dari = terkirim.length;
  jawab(200, { jenis: 'iframe', url: EMBED_UJI, kadaluarsa: 1791000000 });
  const h = await akademi.mintaPutar('dasar-01');
  tegas(/[?&]dukung=iframe(&|$)/.test(terkirim[dari]?.url ?? ''), `permintaan /putar tanpa dukung=iframe: ${terkirim[dari]?.url} — server menjawab MP4 yang dialirkan lewat VPS`);
  tegas(h.keadaan === 'ada' && h.jenis === 'iframe' && h.url === EMBED_UJI, `jawaban iframe Bunny yang sah dibaca ${JSON.stringify(h)}`);
  for (const palsu of [
    `${pemutar.ASAL_BUNNY}.contoh-lain.net/embed/12345/${GUID_UJI}`,
    `${alamat('https', 'iframe.mediadelivery.net@contoh-lain.net')}/embed/12345/${GUID_UJI}`,
    `${pemutar.ASAL_BUNNY}:8443/embed/12345/${GUID_UJI}`,
    `${alamat('http', 'iframe.mediadelivery.net')}/embed/12345/${GUID_UJI}`,
    `${pemutar.ASAL_BUNNY}/play/12345/${GUID_UJI}`,
    `${pemutar.ASAL_BUNNY}/embed/12345/bukan-guid`,
    `${pemutar.ASAL_BUNNY}/embed/12345/${GUID_UJI}?t="><script>alert(1)</script>`,
    `${pemutar.ASAL_BUNNY}\\@contoh-lain.net/embed/12345/${GUID_UJI}`,
    '/api/saya/akademi/video/dasar-01?exp=1&sig=a',
  ]) {
    jawab(200, { jenis: 'iframe', url: palsu });
    const x = await akademi.mintaPutar('dasar-01');
    tegas(x.keadaan === 'galat', `iframe dari ${palsu} diterima (${JSON.stringify(x)}) — jawaban karangan bisa membingkai halaman lain di layar Akademi`);
  }
});

await uji('pemutar Bunny, cabang lawan: jawaban tanpa jenis tetap MP4 satu asal; URL Bunny tanpa jenis bukan MP4', async () => {
  jawab(200, { url: '/api/saya/akademi/video/dasar-01?exp=1&sig=a', kadaluarsa: 1 });
  const h = await akademi.mintaPutar('dasar-01');
  tegas(h.keadaan === 'ada' && h.jenis === 'mp4' && h.url === `${ASAL_APP}/api/saya/akademi/video/dasar-01?exp=1&sig=a`, `MP4 satu asal dibaca ${JSON.stringify(h)}`);
  jawab(200, { url: EMBED_UJI });
  tegas((await akademi.mintaPutar('dasar-01')).keadaan === 'galat', 'URL Bunny TANPA jenis iframe diterima sebagai MP4 — halaman pemutar di <video src> adalah layar hitam tanpa galat');
});

await uji('KEPUTUSAN: kemajuan Bunny cuma dibaca dari iframe Bunny itu sendiri — asal lain atau jendela lain diabaikan', async () => {
  const j = jalankanJembatan(120);
  j.pesan(pj('ready'), alamat('https', 'contoh-lain.net'));
  j.pesan(pj('timeupdate', { seconds: 95, duration: 100 }), alamat('https', 'contoh-lain.net'));
  j.pesan(pj('ready'), pemutar.ASAL_BUNNY, { postMessage() {} });
  j.pesan(pj('ended'), pemutar.ASAL_BUNNY, { postMessage() {} });
  tegas(j.kePemutar.length === 0 && j.keApp.length === 0, `pesan palsu diteruskan: ke pemutar ${JSON.stringify(j.kePemutar)}, ke app ${JSON.stringify(j.keApp)} — halaman lain bisa menandai video selesai`);
  j.pesan(JSON.stringify({ context: 'lain', event: 'ready' }));
  j.pesan('bukan json');
  tegas(j.kePemutar.length === 0, 'pesan tanpa context player.js dianggap ready');
});

await uji('KEPUTUSAN: sesudah ready, jembatan mendaftar timeupdate/pause/ended dan melanjutkan dari posisi tersimpan SEKALI', async () => {
  const j = jalankanJembatan(120);
  j.pesan(pj('ready'));
  const daftar = j.kePemutar.filter((m) => m.method === 'addEventListener').map((m) => m.value);
  for (const e of ['timeupdate', 'pause', 'ended']) tegas(daftar.includes(e), `jembatan tidak mendaftar ${e}`);
  const lompat = j.kePemutar.filter((m) => m.method === 'setCurrentTime');
  tegas(lompat.length === 1 && lompat[0].value === 120, `posisi tersimpan 120 dtk dipasang sebagai ${JSON.stringify(lompat)}`);
  tegas(j.kePemutar.every((m) => m.target === pemutar.ASAL_BUNNY && m.context === 'player.js'), `perintah dikirim ke ${JSON.stringify([...new Set(j.kePemutar.map((m) => m.target))])} — wajib asal Bunny persis, bukan "*"`);
  j.pesan(pj('ready'));
  tegas(j.kePemutar.filter((m) => m.method === 'setCurrentTime').length === 1, 'ready kedua melompat lagi ke posisi lama — orang yang sudah menggeser waktu ditarik mundur');
  j.pesan(pj('timeupdate', { seconds: 121.2, duration: 300 }));
  j.pesan(pj('timeupdate', { seconds: 122.4, duration: 300 }));
  j.pesan(pj('timeupdate', { seconds: 124.6, duration: 300 }));
  tegas(j.keApp.length === 2 && j.keApp[0].t === 121.2 && j.keApp[1].t === 124.6 && j.keApp[1].d === 300, `kemajuan ke app: ${JSON.stringify(j.keApp)} — wajib {t, d} tiap ±3 detik`);
  j.pesan(pj('pause'));
  tegas(j.keApp.at(-1)?.t === 124.6, `jeda tidak mengirim posisi terakhir: ${JSON.stringify(j.keApp.at(-1))}`);
  j.pesan(pj('ended'));
  const akhir = j.keApp.at(-1);
  tegas(akhir?.t === 300 && akhir?.d === 300, `selesai dikirim ${JSON.stringify(akhir)}`);
  const p = pemutar.uraiPesanPemutar(JSON.stringify(akhir));
  tegas(p?.jenis === 'waktu' && p.t / p.d >= akademi.AMBANG_SELESAI, `pesan selesai dibaca ${JSON.stringify(p)} — catatPosisi tidak pernah menandai video selesai`);
  /* Cabang lawan: 3 detik pertama bukan posisi yang perlu dilanjutkan. */
  const awal = jalankanJembatan(3);
  awal.pesan(pj('ready'));
  tegas(!awal.kePemutar.some((m) => m.method === 'setCurrentTime'), 'posisi 3 dtk dilompati — awal video dipotong');
});

await uji('KEPUTUSAN: navigasi WebView pemutar cuma ke halaman kita dan Bunny — tidak satu pun diserahkan ke peramban HP', async () => {
  for (const u of [ASAL_APP, `${ASAL_APP}/`, EMBED_UJI, 'about:blank']) tegas(pemutar.bolehDimuatPemutar(u), `${u} ditolak — pemutar tidak pernah dimuat`);
  for (const u of [`${pemutar.ASAL_BUNNY}.contoh-lain.net/embed`, alamat('https', 'contoh-lain.net'), ...ASAL_TIRUAN, 'javascript:alert(1)', 'intent://x#Intent;end', alamat('http', 'iframe.mediadelivery.net/embed')]) {
    tegas(!pemutar.bolehDimuatPemutar(u), `${u} dimuat di WebView pemutar`);
  }
  const kode = tanpaKomentar(readFileSync('src/komponen/PemutarVideo.tsx', 'utf8'));
  tegas(/originWhitelist=\{\['\*'\]\}/.test(kode), 'PemutarVideo memakai originWhitelist sempit — navigasi iframe Bunny di iOS diserahkan ke Safari lewat Linking.openURL');
  tegas(/onShouldStartLoadWithRequest=\{\(r\) => bolehDimuatPemutar\(r\.url\)\}/.test(kode), 'PemutarVideo tidak menyaring navigasi lewat bolehDimuatPemutar — originWhitelist "*" tanpa saringan meloloskan semua halaman');
  tegas(/useState\(mulai\)/.test(kode) && !/html(Bunny|Mp4)\(url,\s*mulai\)/.test(kode), 'halaman pemutar dibangun dari prop mulai yang hidup — WebView memuat ulang video tiap kemajuan dicatat (±3 dtk)');
});

await uji('pemutar: alamat dari server tidak bisa menulis HTML; video yang sudah selesai diputar ulang dari awal', async () => {
  for (const h of [pemutar.htmlMp4('/api/saya/akademi/video/x?sig="><script>alert(1)</script>', 0), pemutar.htmlBunny(`${EMBED_UJI}"><script>alert(1)</script>`, 0)]) {
    tegas(!h.includes('<script>alert(1)'), 'tanda kutip dari alamat server membuka tag baru di halaman pembungkus');
  }
  tegas(pemutar.detikLanjut(298, true) === 0, 'video selesai dilanjutkan dari ujungnya — layar hitam yang langsung berakhir');
  tegas(pemutar.detikLanjut(120, false) === 120 && pemutar.detikLanjut(undefined, false) === 0, 'posisi tersimpan tidak dipakai');
  const layar = tanpaKomentar(readFileSync('src/layar/Akademi.tsx', 'utf8'));
  tegas(/jenis=\{putar\.jenis\}/.test(layar), 'layar pelajaran tidak meneruskan jenis pemutar — iframe Bunny dimasukkan ke <video src>');
  tegas(/mulai=\{detikLanjut\(k\.posisi\[x\.v\.id\], k\.selesai\.includes\(x\.v\.id\)\)\}/.test(layar), 'layar pelajaran tidak lewat detikLanjut');
});

/* ── Pantauan: keadaan sekarang + contoh notifikasi (9 Okt) ──────────────── */
process.stdout.write('\n── Pantauan: keadaan sekarang & contoh kabar ──\n');
const kp = await muat('src/data/keadaanPantauan.ts');

await uji('KEPUTUSAN: m1/m5 emas & forex TIDAK dibaca otomatis di layar pantauan — tiap bacaan memakai jatah harian AM+', async () => {
  tegas(bot.garisMiringTwelve === true, 'bot tidak lagi merutekan simbol bergaris miring ke Twelve Data (src/data/penyedia.ts) — aturan app di keadaanPantauan.ts harus ditinjau ulang');
  for (const [p, t] of [['XAU/USD', 'M5'], ['EUR/USD', 'm1'], ['XAU/USD', 'm5']]) tegas(!kp.bolehDibacaOtomatis(p, t), `${p} ${t} dibaca otomatis — membuka layar Pantauan menghabiskan jatah harian orangnya`);
  for (const [p, t] of [['XAU/USD', 'm15'], ['BTCUSDT', 'm5'], ['EUR/USD', 'H1']]) tegas(kp.bolehDibacaOtomatis(p, t), `${p} ${t} tidak dibaca — keadaan pantauan hilang tanpa sebab`);
});

await uji('keadaan pantauan: mesin yang dipantau dibaca apa adanya; "mesin apa saja" memilih Setup dulu', async () => {
  const sy = (...l) => l.map((lolos) => ({ wajib: true, lolos }));
  const b = { mesin: [
    { mesin: 'snr', status: 'PANTAU', syarat: [...sy(true, true, false), { wajib: false, lolos: false }] },
    { mesin: 'smc', status: 'SETUP', syarat: sy(true, true, true) },
    { mesin: 'ema200', status: 'TIDAK', syarat: sy(true, false) },
  ] };
  const snr = kp.keadaanPantauan(b, 'snr');
  tegas(snr?.label === 'Pantau' && snr.lolos === 2 && snr.wajib === 3, `snr dibaca ${JSON.stringify(snr)} — bonus ikut dihitung atau mesinnya tertukar`);
  const apa = kp.keadaanPantauan(b, null);
  tegas(apa?.mesin === 'smc' && apa.label === 'Setup', `"mesin apa saja" memilih ${JSON.stringify(apa)} — yang Setup harus menang`);
  tegas(kp.keadaanPantauan(b, 'fibonacci') === null, 'mesin yang tidak ada di bacaan dikarang keadaannya');
  /* Sama-sama lolos semua syarat wajib, tapi yang satu angkanya ditahan: Setup tetap yang menang, apa pun urutannya. */
  const seri = kp.keadaanPantauan({ mesin: [{ mesin: 'fibonacci', status: 'TIDAK', syarat: sy(true, true) }, { mesin: 'smc', status: 'SETUP', syarat: sy(true, true, true) }] }, null);
  tegas(seri?.mesin === 'smc', `porsi sama: dipilih ${JSON.stringify(seri)} — keadaan Setup tidak didahulukan`);
});

await uji('KEPUTUSAN: contoh notifikasi di Pantauan baru = templat pesanKabarPush bot — tanpa arah, entry, SL, TP', async () => {
  tegas(typeof bot.pushKabar?.judul === 'string' && typeof bot.pushKabar?.isi === 'string', 'templat pesanKabarPush tidak terbaca dari bot (src/lib/push.ts)');
  const isiBot = (t) => t.replaceAll('${a.pair}', 'XAU/USD').replaceAll('${a.tf.toLowerCase()}', 'm15').replaceAll('${a.mesin}', 'smc').replaceAll('${a.berlakuSampaiWib}', kp.JAM_CONTOH);
  const c = kp.contohKabarPush('XAU/USD', 'M15', 'smc');
  tegas(c.judul === isiBot(bot.pushKabar.judul), `judul contoh "${c.judul}" ≠ notifikasi bot "${isiBot(bot.pushKabar.judul)}"`);
  tegas(c.isi === isiBot(bot.pushKabar.isi), `isi contoh "${c.isi}" ≠ notifikasi bot "${isiBot(bot.pushKabar.isi)}"`);
  tegas(!/\d{2}\.\d{2}/.test(c.isi), `contoh memuat jam karangan: "${c.isi}"`);
  const layar = tanpaKomentar(readFileSync('src/layar/Akun.tsx', 'utf8'));
  tegas(/contohKabarPush\(pasar, tf,/.test(layar), 'formulir Pantauan baru tidak lewat contohKabarPush — teks contohnya diketik sendiri');
});

/* ── bot macet ≠ HP tak tersambung (9 Okt 18.23–18.46) ─────────────────── */
process.stdout.write('\n── Bot macet bukan "periksa sambungan" ──\n');

await uji('KEPUTUSAN: bot yang macet (habis waktu) atau dimulai ulang (502/503/504) TIDAK disuruh "periksa sambungan"', async () => {
  jawab(502, {});
  const a = await api.ambilPasar(true);
  tegas(!a.ok && /tidak menjawab/.test(a.kalimat) && !/sambungan/i.test(a.kalimat), `502 dibaca "${a.ok ? 'ok' : a.kalimat}" — orang disuruh memeriksa HP-nya padahal bot yang mati`);
  /* Habis waktu: fetch yang baru berhenti saat sinyalnya dihentikan, jam 30 detik dipercepat. */
  const fetchAsli = globalThis.fetch; const jamAsli = globalThis.setTimeout;
  globalThis.fetch = (u, init = {}) => new Promise((_, tolak) => { init.signal?.addEventListener('abort', () => { tolak(new DOMException('dihentikan', 'AbortError')); }); });
  globalThis.setTimeout = (f, ms, ...x) => jamAsli(f, ms >= 30_000 ? 0 : ms, ...x);
  try {
    const b = await api.ambilPasar(true);
    tegas(!b.ok && /terlalu lama/.test(b.kalimat) && !/sambungan/i.test(b.kalimat), `habis waktu dibaca "${b.ok ? 'ok' : b.kalimat}" — 42 permintaan /api/pasar 9 Okt berhenti di sini`);
  } finally { globalThis.fetch = fetchAsli; globalThis.setTimeout = jamAsli; }
  /* Cabang lawan: jaringan HP yang benar-benar putus tetap disebut. */
  putus();
  const c = await api.ambilPasar(true);
  tegas(!c.ok && /Periksa sambungan/.test(c.kalimat), `jaringan putus dibaca "${c.ok ? 'ok' : c.kalimat}"`);
});

for (const [k, v] of Object.entries(globalSebelum)) { if (v === undefined) delete globalThis[k]; else globalThis[k] = v; }

process.stdout.write(`\n  ${jumlah} uji · ${terkirim.length} permintaan tiruan · nol jaringan\n`);
if (jumlah < 20) { process.stderr.write(`GAGAL — cuma ${jumlah} uji yang jalan\n`); process.exit(1); }
if (gagal.length > 0) {
  process.stderr.write(`GAGAL — ${gagal.length} dari ${jumlah} uji keputusan merah\n`);
  process.exit(1);
}
