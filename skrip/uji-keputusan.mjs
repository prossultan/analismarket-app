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
  if (!existsSync(notif) || !existsSync(menu)) return null;
  const maks = /export const MAKS_WATCH\s*=\s*(\d+)/.exec(readFileSync(notif, 'utf8'));
  const blok = /JAM_SUNYI_PILIHAN[^=]*=\s*\[([\s\S]*?)\n\]/.exec(readFileSync(menu, 'utf8'));
  const jam = blok === null ? [] : [...blok[1].matchAll(/\{\s*mulai:\s*(\d+),\s*selesai:\s*(\d+)\s*\}/g)].map((m) => ({ mulai: Number(m[1]), selesai: Number(m[2]) }));
  return { maksWatch: maks === null ? null : Number(maks[1]), jamSunyiPilihan: jam };
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
  return gagalBacaan.gagalBacaan({ jenis: j.jenis, kalimat: j.kalimat, galat: j.galat });
}

await uji('KEPUTUSAN: 402 perlu-plus di bacaan adalah ajakan AM+, bukan "Mesin tidak menjawab · Coba lagi"', async () => {
  const pesan = 'M5 untuk XAU/USD bagian AnalisMarket+. Data emas dan forex dibeli dengan jatah harian, dan M1/M5 yang paling banyak menagih. XAU/USD tetap terbuka di timeframe lain.';
  const g = await bacaanGagal(() => { jawab(402, { galat: 'perlu-plus', pesan }); }, 'XAU/USD');
  tegas(terakhir().header.authorization === 'Bearer jwt-clerk-uji', `bacaan berangkat tanpa sesi Google: ${JSON.stringify(terakhir().header)}`);
  const isi = gagalBacaan.isiLembarGagal(g, 'XAU/USD', 'm5');
  tegas(g.jenis === 'plus' && isi.aksi === 'plus', `402 perlu-plus menjadi jenis "${g.jenis}", aksi "${String(isi.aksi)}"`);
  tegas(!/tidak menjawab|tersambung/i.test(`${isi.label} ${isi.judul} ${isi.ket}`), `lembar AM+ berbunyi gangguan: ${JSON.stringify(isi)}`);
  tegas(/AnalisMarket\+/.test(isi.judul), `judul lembar tidak menyebut AnalisMarket+: "${isi.judul}"`);
  /* Build Play diam soal harga dan cara beli — lembar ini diam di build mana pun. */
  const semua = `${isi.label} ${isi.judul} ${isi.ket}`;
  tegas(!/Rp|\/plus|@|bot|bayar|beli/i.test(semua), `lembar AM+ menyebut harga atau jalur beli: "${semua}" — dilarang di build Play`);
});

await uji('KEPUTUSAN: "Coba lagi" HANYA untuk kegagalan jaringan (cabang lawan)', async () => {
  const jar = await bacaanGagal(() => { putus(); }, 'EUR/USD');
  const isiJar = gagalBacaan.isiLembarGagal(jar, 'EUR/USD', 'm5');
  tegas(jar.jenis === 'jaringan' && isiJar.aksi === 'coba' && isiJar.judul === 'Mesin tidak menjawab', `jaringan putus menjadi ${JSON.stringify(isiJar)}`);
  const bts = await bacaanGagal(() => { jawab(429, { galat: 'batas-harian', pesan: 'Jatah AnalisMarket+ untuk M1/M5 emas-forex hari ini sudah terpakai: 20 dari 20.' }); }, 'GBP/USD');
  const isiBts = gagalBacaan.isiLembarGagal(bts, 'GBP/USD', 'm5');
  tegas(bts.jenis === 'batas' && isiBts.aksi === null, `batas harian (20 dari 20) menjadi ${JSON.stringify(isiBts)} — mengulang cuma menagih jatah untuk jawaban yang sama`);
  const tlk = await bacaanGagal(() => { jawab(400, { galat: 'badan-salah', pesan: 'timeframe tidak berlaku' }); }, 'USD/JPY');
  tegas(gagalBacaan.isiLembarGagal(tlk, 'USD/JPY', 'm5').aksi === null, '400 ditolak menawarkan "Coba lagi"');
  const plus = gagalBacaan.isiLembarGagal({ jenis: 'plus', kalimat: 'x' }, 'XAU/USD', 'm5');
  tegas(plus.judul !== isiJar.judul && plus.aksi !== isiJar.aksi, 'lembar AM+ dan lembar jaringan identik — salah satu cabang diam-diam disamakan');
  /* Layar Pasar wajib lewat keputusan ini, bukan menulis kalimat gangguannya sendiri lagi. */
  const layar = tanpaKomentar(readFileSync('src/layar/Analisis.tsx', 'utf8'));
  tegas(/isiLembarGagal\(/.test(layar) && /gagalBacaan\(/.test(layar), 'layar Pasar tidak memakai gagalBacaan/isiLembarGagal');
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

/** Jalankan skrip suntikan seperti WebView menjalankannya, atas localStorage tiruan. */
function jalankanSuntikan(skrip, awal = {}) {
  const isi = new Map(Object.entries(awal));
  const localStorage = { setItem: (k, v) => { isi.set(k, String(v)); }, removeItem: (k) => { isi.delete(k); }, getItem: (k) => isi.get(k) ?? null };
  // eslint-disable-next-line no-new-func
  new Function('localStorage', skrip)(localStorage);
  return isi;
}

await uji('KEPUTUSAN: chart tertanam membawa token sesi Google, bukan cuma sesi mini', async () => {
  const token = await sesi.tokenSesi();
  tegas(token === 'jwt-clerk-uji', `tokenSesi() untuk sesi Google menjawab ${JSON.stringify(token)}`);
  const ls = jalankanSuntikan(sesiChart.skripSesiChart(token));
  tegas(ls.get(sesiChart.KUNCI_SESI_CHART) === 'jwt-clerk-uji', `localStorage halaman embed sesudah suntikan: ${JSON.stringify([...ls])} — web membaca 'am_sesi_mini' sebagai Bearer`);
  tegas(sesiChart.KUNCI_SESI_CHART === 'am_sesi_mini', `kunci "${sesiChart.KUNCI_SESI_CHART}" bukan kunci yang dibaca miniapp.ts web`);
  const layar = tanpaKomentar(readFileSync('src/layar/Analisis.tsx', 'utf8'));
  tegas(/<ChartTertanam\b[^>]*ambilToken=\{tokenSesi\}/.test(layar), 'layar Pasar tidak memberi ChartTertanam tokenSesi (semua jenis sesi)');
  tegas(!/jenis\s*===\s*'mini'/.test(layar), "layar Pasar masih menyaring sesi chart dengan jenis === 'mini' — pengguna Google anonim di chart");
});

await uji('KEPUTUSAN: tanpa sesi, token lama DIHAPUS dari WebView (cabang lawan)', async () => {
  const ls = jalankanSuntikan(sesiChart.skripSesiChart(null), { am_sesi_mini: 'token-orang-sebelumnya' });
  tegas(!ls.has('am_sesi_mini'), 'token sesi orang sebelumnya tertinggal di localStorage WebView sesudah keluar');
  tegas(sesiChart.skripSesiChart(null) !== sesiChart.skripSesiChart('x'), 'skrip dengan dan tanpa token identik');
  tegas(sesiChart.SEGARKAN_TOKEN_CHART_MS < 60_000, `token chart disegarkan tiap ${sesiChart.SEGARKAN_TOKEN_CHART_MS} ms — JWT Clerk berumur ±60 detik`);
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
await uji('tf pengganti dipakai KEDUA jalan layar Pasar (muat daftar & pilih pasar), tanpa punya[0]', async () => {
  const kode = tanpaKomentar(readFileSync(join(AKAR, 'src/layar/Analisis.tsx'), 'utf8'));
  const pakai = (kode.match(/tfNaik\(/g) ?? []).length;
  tegas(pakai >= 2, `tfNaik dipanggil ${pakai}x di Analisis.tsx, seharusnya di kedua jalan (muat daftar, pilih pasar)`);
  tegas(!/punya\[0\]/.test(kode), 'Analisis.tsx masih memakai punya[0] — penggantian diam-diam ke tf terendah');
  tegas((kode.match(/setKataTf\(catatanTf\(/g) ?? []).length >= 2, 'kedua jalan wajib menyimpan kalimat penggantian (setKataTf(catatanTf(...)))');
});

process.stdout.write(`\n  ${jumlah} uji · ${terkirim.length} permintaan tiruan · nol jaringan\n`);
if (jumlah < 20) { process.stderr.write(`GAGAL — cuma ${jumlah} uji yang jalan\n`); process.exit(1); }
if (gagal.length > 0) {
  process.stderr.write(`GAGAL — ${gagal.length} dari ${jumlah} uji keputusan merah\n`);
  process.exit(1);
}
