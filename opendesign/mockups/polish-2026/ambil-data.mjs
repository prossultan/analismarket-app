/**
 * AMBIL DATA ASLI untuk mockup semua layar (semua.html).
 *
 *   node opendesign/mockups/polish-2026/ambil-data.mjs
 *
 * Read-only terhadap produksi: hanya GET ke endpoint anonim, plus potret
 * /chart-embed lewat Playwright. Tidak ada sesi, tidak ada yang ditulis.
 *
 * Jeda 1,2 dtk antar-permintaan: /api/bacaan, /api/pasar, dan
 * /api/jadwal-berita berbagi zona nginx `1r/s burst=5` per IP — skrip yang
 * boros membuat 429 untuk pengguna lain di IP yang sama.
 *
 * Data AKUN (nama, pantauan, kotak masuk) TIDAK diambil: itu milik orang.
 * semua.html memakai akun contoh, tapi keadaan pasarnya dari bacaan di sini.
 */
import { writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const AKAR = dirname(fileURLToPath(import.meta.url));
const ASAL = 'https://analismarket.com';
const ASET = join(AKAR, 'aset', 'asli');
mkdirSync(ASET, { recursive: true });

const tidur = (ms) => new Promise((r) => setTimeout(r, ms));
let terakhir = 0;
async function ambil(jalur, jenis = 'json') {
  for (let coba = 0; coba < 4; coba++) {
    const tunggu = terakhir + 1200 - Date.now();
    if (tunggu > 0) await tidur(tunggu);
    terakhir = Date.now();
    const r = await fetch(ASAL + jalur, { signal: AbortSignal.timeout(25000) });
    if (r.status === 429) {
      const ra = Number(r.headers.get('retry-after') ?? '3');
      process.stdout.write(`  429 ${jalur} — tunggu ${ra}s\n`);
      await tidur((ra + 1) * 1000);
      continue;
    }
    if (!r.ok) throw new Error(`${r.status} ${jalur}`);
    return jenis === 'json' ? r.json() : Buffer.from(await r.arrayBuffer());
  }
  throw new Error(`menyerah: ${jalur}`);
}

const pasar = await ambil('/api/pasar');
process.stdout.write(`pasar: ${pasar.pasar.length}\n`);
const ada = new Set(pasar.pasar.map((p) => p.simbol));

/** Bacaan dipangkas: 1300 lilin → 80 terakhir (cukup untuk sparkline & chart mini). */
const pangkas = (b) => ({
  pasar: b.pasar, tf: b.tf, harga: b.harga, hargaWaktu: b.hargaWaktu, lilinTerakhir: b.lilinTerakhir,
  lilin: b.lilin.slice(-80).map((l) => [l.waktu, l.buka, l.tinggi, l.rendah, l.tutup]),
  pola: b.pola.slice(-3), katalog: b.katalog, pasarTutupAlasan: b.pasarTutupAlasan,
  mesin: b.mesin,
});

const DAFTAR = [
  ['BTCUSDT', 'h4'], ['ETHUSDT', 'h4'],
  ['BTCUSDT', 'h1'], ['XAU/USD', 'h1'], ['ETHUSDT', 'h1'], ['SOLUSDT', 'h1'], ['BNBUSDT', 'h1'], ['XRPUSDT', 'h1'],
  ['EUR/USD', 'h4'], ['LINKUSDT', 'h1'], ['DOGEUSDT', 'h1'], ['SUIUSDT', 'h1'], ['ADAUSDT', 'h1'], ['AVAXUSDT', 'h1'],
];
const bacaan = {};
for (const [p, tf] of DAFTAR) {
  if (!ada.has(p)) { process.stdout.write(`  lewati ${p}: tidak ada di /api/pasar\n`); continue; }
  try {
    const b = await ambil(`/api/bacaan?pasar=${encodeURIComponent(p)}&tf=${tf}`);
    bacaan[`${p}|${tf}`] = pangkas(b);
    process.stdout.write(`  bacaan ${p} ${tf}: ${b.mesin.map((m) => `${m.mesin}=${m.status}`).join(' ')}\n`);
  } catch (e) { process.stdout.write(`  GAGAL ${p} ${tf}: ${String(e)}\n`); }
}

const jadwal = await ambil('/api/jadwal-berita');
const akademi = await ambil('/api/saya/akademi');
process.stdout.write(`jadwal: ${jadwal.rilis.length} rilis · akademi: ${akademi.jumlah.video} video, ${akademi.jumlah.tersedia} tayang\n`);

/* Sampul: kecil untuk semua video bab 1–3 yang punya sampul, besar untuk video yang "sedang ditonton". */
const sampul = {};
for (const bab of akademi.bab.slice(0, 6)) {
  for (const v of bab.video) {
    if (v.sampul === null) continue;
    const ingin = bab.n <= 3 || v.no % 10 === 1;
    if (!ingin) continue;
    const berkas = `sampul-${String(v.no).padStart(2, '0')}k.jpg`;
    if (!existsSync(join(ASET, berkas))) writeFileSync(join(ASET, berkas), await ambil(v.sampul.kecil, 'bin'));
    sampul[v.no] = { kecil: `aset/asli/${berkas}` };
  }
}
for (const no of [4, 7]) {
  const v = akademi.bab.flatMap((b) => b.video).find((x) => x.no === no);
  if (v?.sampul) {
    const berkas = `sampul-${String(no).padStart(2, '0')}b.jpg`;
    if (!existsSync(join(ASET, berkas))) writeFileSync(join(ASET, berkas), await ambil(v.sampul.besar, 'bin'));
    sampul[no] = { ...(sampul[no] ?? {}), besar: `aset/asli/${berkas}` };
  }
}

/* Mesin "terakhir dibuka" = yang SETUP di BTCUSDT h4 kalau ada, selain itu SnR. */
const utama = bacaan['BTCUSDT|h4'];
const mesinUtama = utama?.mesin.find((m) => m.status === 'SETUP')?.mesin ?? 'snr';

/* Chart produk yang ASLI: /chart-embed, URL yang sama dengan app (Analisis.tsx). */
const { chromium } = await import('/home/analismarket/analismarket-web/node_modules/playwright/index.mjs');
const b = await chromium.launch();
/* Harga yang DICETAK chart ditangkap dari pesan yang ia kirim ke app
   (ReactNativeWebView.postMessage) — app memakai angka itu di kepala layar,
   jadi mockup juga, supaya satu layar tidak memuat dua harga berbeda. */
const hargaChart = {};
const potretChart = async (pair, tf, mesin, w, h, berkas) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  /* Chart menyambung ke aliran harga (relai /api/harga-ws: kline + aggTrade,
     web/src/data/soket.ts) dan label harganya ikut bergerak. Konstruktor
     WebSocket dibungkus: harga dari pesan yang DIPROSES chart dicatat, lalu
     pemrosesnya dilepas sebelum dipotret — jadi angka di kepala layar mockup
     = angka di label chart. (Menyela lewat routeWebSocket memutus jawaban
     relainya, jadi tidak dipakai.) */
  const p = await ctx.newPage();
  await p.addInitScript(() => {
    window.__pesan = []; window.__ws = []; window.__beku = false; window.__harga = null;
    window.ReactNativeWebView = { postMessage: (d) => { window.__pesan.push(String(d)); } };
    const Asli = window.WebSocket;
    const Bungkus = function (...a) {
      const s = new Asli(...a); window.__ws.push(s);
      s.addEventListener('message', (e) => {
        if (window.__beku) return;
        try { const j = JSON.parse(e.data); const d = j.data ?? j; if (d.k?.c) window.__harga = Number(d.k.c); else if (d.e === 'aggTrade' && d.p) window.__harga = Number(d.p); } catch { /* bukan JSON */ }
      });
      return s;
    };
    Bungkus.prototype = Asli.prototype;
    for (const k of ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED']) Bungkus[k] = Asli[k];
    window.WebSocket = Bungkus;
  });
  await tidur(Math.max(0, terakhir + 2500 - Date.now())); terakhir = Date.now();
  const url = `${ASAL}/chart-embed?pair=${encodeURIComponent(pair)}&tf=${tf}&mesin=${mesin}&alat=volume,zona,struktur,level`;
  /* Bacaan yang DIPAKAI chart ini ditangkap dari jawabannya sendiri — bukan
     diambil ulang — supaya harga di kepala layar sama dengan label chart. */
  let tangkap = null;
  p.on('response', async (r) => {
    if (!r.url().includes('/api/bacaan')) return;
    try { tangkap = await r.json(); } catch { /* bukan JSON */ }
  });
  await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
  await p.waitForTimeout(3000);
  /* Penunjuk di atas skala harga: garis bidik chart tidak digambar. */
  await p.mouse.move(w - 3, Math.round(h / 2));
  const hargaAliran = await p.evaluate(() => { window.__beku = true; for (const s of window.__ws) s.onmessage = null; return window.__harga; });
  await p.waitForTimeout(900);
  await p.screenshot({ path: join(ASET, berkas) });
  if (tangkap?.mesin) { bacaan[`${pair}|${tf}`] = pangkas(tangkap); hargaChart[`${pair}|${tf}`] = hargaAliran ?? tangkap.harga; }
  const pesan = await p.evaluate(() => window.__pesan);
  for (const x of pesan) { try { const j = JSON.parse(x); if (typeof j.harga === 'number') hargaChart[`${pair}|${tf}`] = j.harga; } catch { /* abaikan */ } }
  await ctx.close();
  process.stdout.write(`  chart ${pair} ${tf} ${mesin} → ${berkas} · harga chart ${hargaChart[`${pair}|${tf}`] ?? '—'} (aliran ${hargaAliran ?? 'tidak ada'})\n`);
};
await potretChart('BTCUSDT', 'h4', mesinUtama, 366, 318, 'chart-btc-h4.png');
/* Latar layar masuk: chart BTCUSDT h1 anonim, sama dengan Sambutan.tsx. */
await potretChart('BTCUSDT', 'h1', 'snr', 390, 380, 'chart-btc-h1.png');
await b.close();

const DATA = {
  diambil: Math.floor(Date.now() / 1000),
  pasar: pasar.pasar, sumberHarga: pasar.sumberHarga, pasarPada: pasar.pada,
  bacaan, mesinUtama, hargaChart, jadwal: jadwal.rilis, akademi, sampul,
  /* Lambang yang ADA di app (assets/lambang) — sisanya lingkaran berhuruf, seperti LambangPasar.tsx. */
  lambang: readdirSync(join(AKAR, 'aset', 'lambang')).filter((n) => n.endsWith('.png')).map((n) => n.slice(0, -4)),
};
writeFileSync(join(AKAR, 'data.js'), `/* Dibuat ambil-data.mjs — data produksi ${new Date().toISOString()} */\nwindow.DATA = ${JSON.stringify(DATA)};\n`);
process.stdout.write(`data.js ditulis (${Math.round(JSON.stringify(DATA).length / 1024)} KB) · mesin utama: ${mesinUtama}\n`);
