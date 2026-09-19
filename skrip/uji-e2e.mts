/**
 * UJI END-TO-END — menembak API PRODUKSI, bukan tiruan.
 *
 * Yang diuji di sini tidak bisa diuji dari kode: bentuk jawaban server,
 * kode status per keadaan, dan apakah jalur yang dipakai app benar-benar
 * ada. Tiruan akan lulus untuk endpoint yang sudah dihapus.
 *
 * Read-only terhadap produksi: hanya GET, plus satu POST `sambung/masuk`
 * dengan token yang sengaja cacat. Tidak ada yang ditulis, tidak ada pesan
 * Telegram yang dikirim.
 *
 *   npx tsx skrip/uji-e2e.mts
 */
import { readdirSync } from 'node:fs';

const ASAL = process.env['ASAL'] ?? 'https://analismarket.com';

/** Lambang yang benar-benar ada di app — dibaca dari folder, bukan diketik. */
const LAMBANG = new Set(readdirSync('assets/lambang').filter((n) => n.endsWith('.png')).map((n) => n.replace('.png', '')));

function adaLambang(simbol: string): boolean {
  const s = simbol.toUpperCase();
  if (s.includes('/')) return LAMBANG.has((s.split('/')[0] ?? '').toLowerCase());
  for (const q of ['USDT', 'USDC', 'BUSD', 'BTC', 'ETH']) {
    if (s.endsWith(q) && s.length > q.length && LAMBANG.has(s.slice(0, -q.length).toLowerCase())) return true;
  }
  return LAMBANG.has(s.toLowerCase());
}

let gagal = 0;
let jumlah = 0;

function cek(nama: string, ok: boolean, pesan = ''): void {
  jumlah += 1;
  if (ok) { process.stdout.write(`  LOLOS  ${nama}\n`); return; }
  gagal += 1;
  process.stdout.write(`  GAGAL  ${nama}\n         ${pesan}\n`);
}

async function ambil(jalur: string, opsi: RequestInit = {}): Promise<{ kode: number; isi: Record<string, unknown> }> {
  const res = await fetch(`${ASAL}${jalur}`, { ...opsi, signal: AbortSignal.timeout(20_000) });
  const isi = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { kode: res.status, isi };
}

process.stdout.write(`\nUJI E2E terhadap ${ASAL}\n\n── Endpoint anonim (dipakai tanpa akun) ──\n`);

/* ── /api/pasar ────────────────────────────────────────────────────────── */
{
  const { kode, isi } = await ambil('/api/pasar');
  const pasar = (isi['pasar'] ?? []) as { simbol: string; timeframes: string[]; desimal: number; volume24hUsd: number }[];
  cek('/api/pasar menjawab 200', kode === 200, `kode ${String(kode)}`);
  /* Minimum, bukan "lebih dari nol": daftar 2 pasar akan meloloskan sapuan
     yang tidak menguji apa pun. 100 memisahkan daftar sungguhan dari fixture. */
  cek('daftar pasar cukup besar', pasar.length >= 100, `cuma ${String(pasar.length)} pasar`);
  const btc = pasar.find((p) => p.simbol === 'BTCUSDT');
  cek('BTCUSDT ada dan punya timeframes', btc !== undefined && btc.timeframes.length > 0);
  cek('tiap pasar punya desimal', pasar.every((p) => typeof p.desimal === 'number'));
  /* ── Lambang 20 pasar tersibuk ─────────────────────────────────────
     Empat pasar teratas TIDAK PUNYA logo di satu pun sumbernya. Diperiksa
     19 Sep, bukan diduga: `@web3icons/core` 4.0.55 (terpasang) dan 4.0.56
     (terbaru, isinya didaftar dari tarball-nya) sama-sama tidak memuatnya,
     begitu juga `cryptocurrency-icons` 0.18.1 yang terbit ~2021 — dua-duanya
     lebih tua daripada koinnya. Web menampilkan lambang huruf yang sama.

     Jadi 20/20 adalah ambang yang MUSTAHIL dipenuhi dari sini, dan menuntutnya
     cuma menghasilkan satu baris merah tetap yang lama-lama diabaikan.

     Mengecualikan tanpa menggantikan berarti MEMINDAHKAN lubang, bukan
     menutupnya — karena itu satu penegasan jadi tiga: (1) yang di luar daftar
     ini wajib berlambang, (2) daftarnya tidak boleh menyimpan nama yang
     sebenarnya sudah punya lambang, (3) cakupannya tidak boleh turun. Cabang
     hurufnya sendiri dijaga di `skrip/periksa-lambang.mjs`. */
  const TANPA_LOGO_HULU = new Set(['ENAUSDT', 'WLDUSDT', 'CRCLBUSDT', 'MARSCOINUSDT']);
  {
    const teratas = [...pasar].sort((a, b) => b.volume24hUsd - a.volume24hUsd).slice(0, 20);
    const tanpa = teratas.filter((p) => !adaLambang(p.simbol)).map((p) => p.simbol);

    const baruTanpa = tanpa.filter((s) => !TANPA_LOGO_HULU.has(s));
    cek('tiap pasar teratas berlambang, kecuali yang memang tak ada di hulu',
      baruTanpa.length === 0, `kehilangan lambang: ${baruTanpa.join(', ')}`);

    /* CABANG LAWAN: daftar kecualinya ikut basi kalau hulu akhirnya menerbitkan
       logonya. Tanpa ini, daftar yang sudah tidak berlaku tetap melindungi
       simbol yang sebetulnya sudah bisa diperiksa. */
    const kecualiBasi = [...TANPA_LOGO_HULU].filter((s) => adaLambang(s));
    cek('daftar kecuali tidak memuat pasar yang sudah punya lambang',
      kecualiBasi.length === 0, `sudah punya lambang, cabut dari daftar: ${kecualiBasi.join(', ')}`);

    /* Lantai cakupan, bukan nol-atau-semua: 16/20 adalah yang TERUKUR hari ini.
       Turun berarti ada yang hilang, naik berarti daftar kecualinya perlu
       dipangkas — dan cabang di atas yang mengatakannya. */
    const berlambang = teratas.length - tanpa.length;
    cek('cakupan lambang 20 pasar teratas tidak turun dari 16',
      berlambang >= 16, `cuma ${String(berlambang)}/20 berlambang`);
  }
}

/* ── /api/bacaan ───────────────────────────────────────────────────────── */
{
  const { kode, isi } = await ambil('/api/bacaan?pasar=BTCUSDT&tf=h1');
  const mesin = (isi['mesin'] ?? []) as { mesin: string; syarat: { wajib: boolean }[]; rr: number; entry?: number; sl?: number; tp?: number }[];
  cek('/api/bacaan menjawab 200', kode === 200, `kode ${String(kode)}`);
  cek('lima mesin dalam SATU muatan', mesin.length >= 5, `cuma ${String(mesin.length)} mesin`);
  cek('tiap mesin punya syarat wajib', mesin.every((m) => m.syarat.some((s) => s.wajib)));
  cek('harga terbaca', typeof isi['harga'] === 'number' && (isi['harga'] as number) > 0);
  cek('lilin dikirim', Array.isArray(isi['lilin']) && (isi['lilin'] as unknown[]).length > 100);
  /* ATURAN PRODUK: yang mencetak angka rencana wajib RR di dalam [1,3].
     Level yang SUDAH TERBIT dikecualikan — pasca-proses sengaja tidak
     menggeser angka yang sudah dilihat orang. */
  const langgar = mesin.filter((m) => {
    if (m.entry === undefined || m.sl === undefined || m.tp === undefined) return false;
    if ((m as { setup?: unknown }).setup != null) return false;
    const risiko = Math.abs(m.entry - m.sl);
    if (risiko <= 0) return false;
    const rr = Math.abs(m.tp - m.entry) / risiko;
    return rr < 1 - 1e-6 || rr > 3 + 1e-6;
  });
  cek('RR kartu segar di dalam 1:1..1:3', langgar.length === 0,
    langgar.map((m) => m.mesin).join(', '));
}

/* ── /api/jadwal-berita ────────────────────────────────────────────────── */
{
  const { kode, isi } = await ambil('/api/jadwal-berita?hari=30');
  const rilis = (isi['rilis'] ?? []) as { dampak: string; waktu: number; acara: string }[];
  cek('/api/jadwal-berita menjawab 200', kode === 200, `kode ${String(kode)}`);
  cek('ada rilis dalam 30 hari', rilis.length > 0, 'kosong — layar Kalender akan kosong');
  cek('dampak hanya tinggi/sedang', rilis.every((r) => r.dampak === 'tinggi' || r.dampak === 'sedang'));
}

/* ── chart tertanam ────────────────────────────────────────────────────── */
{
  const res = await fetch(`${ASAL}/chart-embed?pair=BTCUSDT&tf=h1`, { signal: AbortSignal.timeout(20_000) });
  cek('/chart-embed menjawab 200', res.status === 200, `kode ${String(res.status)}`);
  const html = await res.text();
  cek('chart-embed tidak bertembok masuk', !html.includes('Masuk dulu'), 'app akan menampilkan tembok di dalam chart');
}

process.stdout.write('\n── Jalur akun (sesi) ──\n');

/* ── gerbang 401 di tiga bentuk ────────────────────────────────────────── */
{
  const a = await ambil('/api/saya');
  cek('/api/saya tanpa token → 401', a.kode === 401 && a.isi['galat'] === 'butuh token sesi', JSON.stringify(a));
  const b = await ambil('/api/saya', { headers: { authorization: 'Bearer palsu' } });
  cek('/api/saya token palsu → 401 "sesi tidak sah"', b.kode === 401 && b.isi['galat'] === 'sesi tidak sah', JSON.stringify(b));
  const c = await ambil('/api/sambung/masuk', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: 'A'.repeat(32) }),
  });
  /* Token berbentuk sah tapi tidak terdaftar: 401 dengan SEBAB, bukan 500. */
  cek('sambung/masuk token tak dikenal → 401 bersebab',
    c.kode === 401 && typeof c.isi['galat'] === 'string', JSON.stringify(c));
  const d = await ambil('/api/sambung/masuk', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ token: 'pendek' }),
  });
  cek('sambung/masuk token cacat → 400', d.kode === 400, JSON.stringify(d));
}

/* ── tiap rute yang dipanggil app benar-benar ada ──────────────────────── */
{
  const RUTE: [string, 'GET' | 'POST'][] = [
    ['/api/saya', 'GET'], ['/api/saya/pantauan', 'GET'], ['/api/saya/kabar-otomatis', 'GET'],
    ['/api/saya/pantauan/tambah', 'POST'], ['/api/saya/pantauan/matikan', 'POST'],
    ['/api/saya/kabar-otomatis/jam', 'POST'], ['/api/saya/kabar-otomatis/setel', 'POST'],
    ['/api/saya/cek-banyak', 'POST'],
  ];
  /* `/api/saya/plus` dan `/api/saya/kredit` sengaja TIDAK di daftar: app tidak memanggilnya.
     Daftar ini menjawab "rute yang dipakai app masih ada", dan rute yang
     tidak dipakai di dalamnya membuat jawabannya berbohong ke dua arah. */
  let hilang = 0;
  for (const [jalur, metode] of RUTE) {
    /* Tanpa token semuanya 401. Yang TIDAK ADA menjawab 404 — dan itu yang
       dicari: rute yang dipanggil app tapi sudah dihapus dari server. */
    const r = await ambil(jalur, { method: metode, headers: { authorization: 'Bearer palsu' } });
    if (r.kode === 404) { hilang += 1; process.stdout.write(`         hilang: ${metode} ${jalur}\n`); }
  }
  cek(`${String(RUTE.length)} rute akun yang dipanggil app masih ada di server`, hilang === 0);
}

process.stdout.write(`\n${String(jumlah)} pemeriksaan · ${String(gagal)} gagal\n`);
if (jumlah < 15) {
  process.stdout.write('pemeriksaannya terlalu sedikit — berkas ini tidak menguji apa pun\n');
  process.exit(1);
}
process.exit(gagal === 0 ? 0 : 1);
