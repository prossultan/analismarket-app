/* Semua layar app — dirakit dari data.js (data produksi, ambil-data.mjs).
   Data PASAR/BACAAN/KALENDER/AKADEMI asli; data AKUN (nama, pantauan, kotak
   masuk) contoh, karena itu milik orang. Teks layar diangkut dari src/layar. */
'use strict';
const D = window.DATA;
const NOW = D.diambil;
const TZ = 'Asia/Jakarta';

/* ── format (cerminan src/data/tampil.ts) ───────────────────────── */
const nfc = {};
const nf = (d) => (nfc[d] ??= new Intl.NumberFormat('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d }));
const angka = (n, d = 2) => (n === null || n === undefined || Number.isNaN(n)) ? '—' : nf(d).format(n);
const persen = (n, d = 2) => (n === null || n === undefined) ? '—' : (n > 0 ? '+' : n < 0 ? '−' : '') + nf(d).format(Math.abs(n)) + '%';
const P = Object.fromEntries(D.pasar.map((p) => [p.simbol, p]));
const des = (s) => P[s]?.desimal ?? 2;
const harga = (s, n) => angka(n, des(s));
const volR = (v) => !v ? '—' : v >= 1e9 ? angka(v / 1e9, 1) + ' M' : v >= 1e6 ? angka(v / 1e6, 1) + ' jt' : angka(v / 1e3, 0) + ' rb';
const jam = (ts) => new Date(ts * 1000).toLocaleTimeString('id-ID', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.');
const tglPanjang = (ts) => new Date(ts * 1000).toLocaleDateString('id-ID', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' });
const tglPendek = (ts) => new Date(ts * 1000).toLocaleDateString('id-ID', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'short' });
const hariIdx = (ts) => Math.floor((ts + 7 * 3600) / 86400);
const selisihHari = (ts) => hariIdx(ts) - hariIdx(NOW);
const judulHari = (ts) => {
  const k = selisihHari(ts);
  const t = new Date(ts * 1000).toLocaleDateString('id-ID', { timeZone: TZ, day: 'numeric', month: 'long' }).toUpperCase();
  if (k === 0) return 'HARI INI · ' + t;
  if (k === 1) return 'BESOK · ' + t;
  if (k === -1) return 'KEMARIN · ' + t;
  return new Date(ts * 1000).toLocaleDateString('id-ID', { timeZone: TZ, weekday: 'long' }).toUpperCase() + ' · ' + t;
};
const warnaUbah = (n) => n > 0 ? 'hijau' : n < 0 ? 'merah' : 'samar';

/* ── bacaan ─────────────────────────────────────────────────────── */
const B = (p, tf) => D.bacaan[`${p}|${tf}`];
const mesin = (b, k) => b?.mesin.find((m) => m.mesin === k) ?? null;
const wajib = (m) => m.syarat.filter((s) => s.wajib);
const lolos = (m) => wajib(m).filter((s) => s.lolos).length;
const kata = (m) => m.status === 'SETUP' ? 'Setup' : m.status === 'PANTAU' ? 'Pantau' : 'Tidak dicetak';
const kelas = (m) => m.status === 'SETUP' ? 'setup' : m.status === 'PANTAU' ? 'pantau' : 'tdk';
const titik = (m) => m.status === 'SETUP' ? 'hijau' : m.status === 'PANTAU' ? 'krem' : 'redup';
const berangka = (m) => m.entry != null && m.sl != null && m.tp != null;
const biaya = (m) => m.biayaPorsi == null ? null : Math.round(m.biayaPorsi);
const namaMesin = (b, k) => b.katalog.find((x) => x.kode === k)?.nama ?? k;
const tutupLilin = (b, n = 48) => b.lilin.slice(-n).map((l) => l[4]);
const ubahLilin = (b, n = 24) => { const c = b.lilin.map((l) => l[4]); const a = c[c.length - 1 - n]; const z = c[c.length - 1]; return (z - a) / a * 100; };

const UTAMA = B('BTCUSDT', 'h4');
const MU = D.mesinUtama;
const MUM = mesin(UTAMA, MU);
const HARGA_BTC = D.hargaChart?.['BTCUSDT|h4'] ?? UTAMA.harga;

/* ── akun contoh (data akun milik orang, jadi tidak diambil) ───── */
const AKUN = { nama: 'Yudi', inisial: 'Y', sisa: 23, berakhir: NOW + 23 * 86400, maks: 10 };
const PANTAUAN = [['BTCUSDT', 'h4', 'ichimoku'], ['SOLUSDT', 'h1', 'snr'], ['ETHUSDT', 'h4', 'smc'], ['XAU/USD', 'h1', 'snr']];
const VIDEO = D.akademi.bab.flatMap((b) => b.video.map((v) => ({ ...v, bab: b })));
const v = (no) => VIDEO.find((x) => x.no === no);
const sampul = (no, uk = 'kecil') => D.sampul[no]?.[uk] ?? D.sampul[no]?.kecil ?? '';
const TONTON = 4; /* kemajuan contoh: 01–03 selesai, 04 sedang (62%) */
const mss = (detik) => `${Math.floor(detik / 60)}:${String(Math.round(detik % 60)).padStart(2, '0')}`;
/* pasangan kabar otomatis contoh — satu sumber untuk semua layar yang menyebut jumlahnya */
const KO = [['h1', 'snr', true], ['h1', 'smc', false], ['h4', 'ichimoku', true], ['h4', 'ema200', true], ['h4', 'fibonacci', false], ['h1', 'ema50200', true]];
const KO_NYALA = KO.filter((r) => r[2]).length;

/* ── lambang (cerminan LambangPasar.tsx) ───────────────────────── */
const LMB = new Set(D.lambang);
function kunciLambang(s) {
  s = s.toUpperCase();
  if (s.includes('/')) { const d = s.split('/')[0].toLowerCase(); return LMB.has(d) ? d : null; }
  for (const q of ['USDT', 'USDC', 'BUSD', 'BTC', 'ETH']) {
    if (s.endsWith(q) && s.length > q.length) { const d = s.slice(0, -q.length).toLowerCase(); if (LMB.has(d)) return d; }
  }
  const p = s.toLowerCase(); return LMB.has(p) ? p : null;
}
function rona(s) { let h = 0; for (const c of s.toUpperCase()) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }
function lambang(s, uk = 22) {
  const k = kunciLambang(s);
  if (k) return `<img class="lmb" style="width:${uk}px;height:${uk}px" src="aset/lambang/${k}.png" alt="">`;
  const h = rona(s);
  return `<span class="lmb huruf" style="width:${uk}px;height:${uk}px;background:hsl(${h},32%,26%);color:hsl(${h},55%,82%);--tepiH:hsl(${h},30%,34%);font-size:${Math.round(uk * 0.4)}px">${s.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase()}</span>`;
}

/* ── grafis dari data asli ─────────────────────────────────────── */
let gid = 0;
function spark(vals, w, h, warna, isi = 0.28, titikAkhir = false) {
  const mn = Math.min(...vals); const mx = Math.max(...vals);
  const pts = vals.map((x, i) => [i / (vals.length - 1) * w, h - 3 - (x - mn) / ((mx - mn) || 1) * (h - 7)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const id = 'sg' + (gid++); const z = pts[pts.length - 1];
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" style="height:${h}px"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${warna}" stop-opacity="${isi}"/><stop offset="1" stop-color="${warna}" stop-opacity="0"/></linearGradient></defs><path d="${d} L${w} ${h} L0 ${h} Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${warna}" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"/>${titikAkhir ? `<circle cx="${(z[0] - 3).toFixed(1)}" cy="${z[1].toFixed(1)}" r="7.5" fill="${warna}" opacity=".18"/><circle cx="${(z[0] - 3).toFixed(1)}" cy="${z[1].toFixed(1)}" r="3.2" fill="${warna}"/>` : ''}</svg>`;
}
/** Lilin asli, yang terakhir dibedah (O/H/L/C). */
function lilinBedah(b, n, w, h) {
  const L = b.lilin.slice(-n).map(([t, o, hi, lo, c]) => ({ o, h: hi, l: lo, c }));
  const ak = L[L.length - 1]; const naik = ak.c >= ak.o;
  const nil = L.flatMap((x) => [x.h, x.l]); const mn = Math.min(...nil); const mx = Math.max(...nil);
  const areaW = 178; const y = (val) => 8 + (mx - val) / (mx - mn) * (h - 16); const cw = areaW / L.length;
  let s = '';
  for (let g = 0; g < 4; g++) { const yy = 8 + g * (h - 16) / 3; s += `<line x1="0" x2="${areaW + 6}" y1="${yy}" y2="${yy}" stroke="rgba(255,236,206,.06)"/>`; }
  L.forEach((x, i) => {
    const cx = i * cw + cw / 2; const up = x.c >= x.o; const col = up ? '#10B981' : '#F43F5E'; const akhir = i === L.length - 1;
    s += `<line x1="${cx}" x2="${cx}" y1="${y(x.h)}" y2="${y(x.l)}" stroke="${col}" stroke-width="1" opacity="${akhir ? 1 : 0.75}"/>`;
    s += `<rect x="${cx - cw * 0.32}" y="${y(Math.max(x.o, x.c))}" width="${cw * 0.64}" height="${Math.max(1, Math.abs(y(x.o) - y(x.c)))}" fill="${col}" rx=".6" opacity="${akhir ? 1 : 0.75}"/>`;
    if (akhir) s += `<rect x="${cx - cw * 0.8}" y="${y(x.h) - 4}" width="${cw * 1.6}" height="${y(x.l) - y(x.h) + 8}" rx="3" fill="rgba(229,173,81,.08)" stroke="#E5AD51" stroke-width="1.1" stroke-dasharray="2.5 2"/>`;
  });
  const zx = 214; const top = 10; const bot = h - 10; const zy = (val) => top + (ak.h - val) / ((ak.h - ak.l) || 1) * (bot - top);
  const xa = (L.length - 1) * cw + cw / 2; const col = naik ? '#10B981' : '#F43F5E';
  s += `<path d="M${xa + cw * 0.8} ${y(ak.h) - 4} L${zx - 14} ${top - 2}" stroke="rgba(229,173,81,.45)" stroke-dasharray="2 3" fill="none"/>`;
  s += `<path d="M${xa + cw * 0.8} ${y(ak.l) + 4} L${zx - 14} ${bot + 2}" stroke="rgba(229,173,81,.45)" stroke-dasharray="2 3" fill="none"/>`;
  s += `<rect x="${zx - 24}" y="${top - 6}" width="48" height="${bot - top + 12}" rx="9" fill="rgba(255,236,206,.04)" stroke="rgba(255,232,196,.1)"/>`;
  s += `<line x1="${zx}" x2="${zx}" y1="${zy(ak.h)}" y2="${zy(ak.l)}" stroke="${col}" stroke-width="2.2" stroke-linecap="round"/>`;
  s += `<rect x="${zx - 10}" y="${zy(Math.max(ak.o, ak.c))}" width="20" height="${Math.max(3, Math.abs(zy(ak.o) - zy(ak.c)))}" rx="2.5" fill="${col}"/>`;
  const lab = [[zy(ak.h), 'H', 'tertinggi'], [zy(naik ? ak.c : ak.o), naik ? 'C' : 'O', naik ? 'tutup' : 'buka'], [zy(naik ? ak.o : ak.c), naik ? 'O' : 'C', naik ? 'buka' : 'tutup'], [zy(ak.l), 'L', 'terendah']];
  /* label tidak boleh bertumpuk: geser yang terlalu dekat */
  for (let i = 1; i < lab.length; i++) if (lab[i][0] - lab[i - 1][0] < 13) lab[i][0] = lab[i - 1][0] + 13;
  lab[lab.length - 1][0] = Math.min(lab[lab.length - 1][0], h - 6);
  for (let i = lab.length - 2; i >= 0; i--) if (lab[i + 1][0] - lab[i][0] < 13) lab[i][0] = lab[i + 1][0] - 13;
  lab[0][0] = Math.max(lab[0][0], 8);
  lab.forEach(([yy, k, t]) => { s += `<line x1="${zx + 12}" x2="${zx + 30}" y1="${yy}" y2="${yy}" stroke="rgba(229,173,81,.6)"/><text x="${zx + 35}" y="${yy + 3.6}" font-family="JetBrains Mono" font-size="10.5" font-weight="700" fill="#E5AD51">${k}</text><text x="${zx + 49}" y="${yy + 3.6}" font-family="Inter" font-size="10.5" fill="#BDB5A9">${t}</text>`; });
  return `<svg class="lilin" viewBox="0 0 ${w} ${h}">${s}</svg>`;
}

/* ── potongan ──────────────────────────────────────────────────── */
const ik = (n) => `<svg><use href="#i-${n}"/></svg>`;
const chev = '<svg class="chev"><use href="#i-kanan"/></svg>';
const sb = () => `<div class="sb"><span>${jam(NOW)}</span><svg><use href="#i-status"/></svg></div>`;
function bilah(aktif, belum = 3) {
  const t = [['home', 'Home'], ['pasar', 'Pasar'], ['akademi', 'Akademi'], ['kabar', 'Kabar'], ['plus', 'PLUS+']];
  return `<nav class="bilah">${t.map(([k, l]) => `<div class="t${k === 'plus' ? ' plus' : ''}${k === aktif ? ' on' : ''}">${ik(k)}${l}${k === 'kabar' && belum ? `<i class="lencana">${belum}</i>` : ''}</div>`).join('')}</nav>`;
}
function hp(isi, o = {}) {
  return `<div class="hp${o.bilah ? ' berbilah' : ''}"><div class="cahaya ${o.cahaya ?? ''}"></div><div class="kamera"></div>${o.tanpaSb ? '' : sb()}${isi}${o.bilah ? bilah(o.bilah, o.belum ?? 3) : ''}</div>`;
}
function br({ ikon = null, ikKelas = '', judul, sub = '', kanan = '', panah = false, kelas = '' }) {
  return `<div class="br ${kelas} ${ikon ? '' : 'tanpa-ik'}">${ikon ? `<span class="ik ${ikKelas}">${ik(ikon)}</span>` : ''}<div class="tx"><b>${judul}</b>${sub ? `<em>${sub}</em>` : ''}</div>${kanan}${panah ? chev : ''}</div>`;
}
const nilai = (t, kls = '') => `<span class="nilai ${kls}">${t}</span>`;
const saklar = (on) => `<span class="saklar${on ? ' on' : ''}"></span>`;
const nav = (judul, sub = '', aksi = '', subSamar = false) => `<div class="nav"><span class="bulat kaca">${ik('kiri')}</span><div class="tj"><b>${judul}</b>${sub ? `<small class="${subSamar ? 's' : ''}">${sub}</small>` : ''}</div>${aksi || '<span class="kosong"></span>'}</div>`;
const seksi = (judul, kanan = '', kecil = false) => `<div class="seksi${kecil ? ' kecil' : ''}"><b>${judul}</b>${kanan ? `<span>${kanan}</span>` : ''}</div>`;

/* ═════════════════════ LAYAR ═════════════════════ */

/* 01 · Masuk */
function sMasuk() {
  const b = B('BTCUSDT', 'h1');
  const strip = b.mesin.map((m) => `<div class="sm-sel"><b>${m.mesin.length > 6 ? m.mesin.slice(0, 4) + '…' : m.mesin}</b><em><i class="dot ${titik(m)}"></i>${m.status === 'SETUP' ? 'setup ' : m.status === 'PANTAU' ? 'pantau ' : ''}${lolos(m)}/${wajib(m).length}</em></div>`).join('');
  const kisi = [['target', 'Entry, SL, TP', 'Lengkap dengan RR bersih sesudah biaya'], ['kabar', 'Pantauan', 'Dikabari saat syarat setupnya lolos'], ['tren', 'Harga langsung', 'Dari bursa, diperbarui tiap lilin tutup'], ['kalender', 'Kalender berita', '30 hari, dampak tinggi dan sedang']];
  return hp(`
    <div class="masuk-latar">
      <div class="ml-tf">${['m5', 'm15', 'm30', 'h1', 'h4', 'd1'].map((t) => `<span class="${t === 'h1' ? 'on' : ''}">${t}</span>`).join('')}</div>
      <div class="ml-strip">${strip}</div>
      <img class="ml-chart" src="aset/asli/chart-btc-h1.png" alt="">
    </div>
    <div class="masuk-kartu kilap">
      <div class="mk-merek"><img src="aset/mark.png" alt="">Analis<span>Market</span></div>
      <h1>Masuk untuk membaca analisa lengkapnya</h1>
      <p>Kripto, emas, dan forex · 5 mesin dibaca sekaligus. Semuanya angka mentah, dan kamu yang memutuskan.</p>
      <div class="mk-kisi">${kisi.map(([i, j, s]) => `<div><span class="ik">${ik(i)}</span><b>${j}</b><em>${s}</em></div>`).join('')}</div>
      <span class="btn amber penuh">${ik('kirim')}Sambungkan Telegram</span>
      <span class="btn kaca penuh" style="margin-top:8px"><svg class="g"><use href="#i-google"/></svg>Masuk dengan Google</span>
      <p class="mk-kecil">Gratis, tanpa formulir. Dengan masuk kamu menyetujui Syarat &amp; Ketentuan dan Kebijakan Privasi.</p>
    </div>`, { cahaya: 'redup' });
}

/* 02 · Masuk lewat Telegram */
function sMasukTelegram() {
  return hp(`
    <div class="nav"><span class="bulat kaca">${ik('kiri')}</span><div class="tj"><b>Sambungkan Telegram</b><small class="s">tiga langkah, sekali saja</small></div><span class="kosong"></span></div>
    <div class="isi">
      <div class="grup kaca" style="padding:4px 14px">
        <div class="langkah"><span class="n">1</span><div><b>Buka @analismarketbot di Telegram</b><em>Namanya bisa disalin dari blok di bawah.</em></div></div>
        <div class="langkah"><span class="n">2</span><div><b>Tekan “🌐 Buka Akses Web”</b><em>Bot membalas dengan tautannya, tercetak sebagai teks.</em></div></div>
        <div class="langkah"><span class="n">3</span><div><b>Ketuk tautannya sekali → tersalin</b><em>Lalu tempel di kotak bawah. Jangan dibuka di peramban: sekali terbuka, tautannya habis.</em></div></div>
      </div>
      <div class="grup kaca" style="margin-top:10px;padding:12px 14px;display:flex;align-items:center;gap:12px">
        <span class="ik">${ik('kirim')}</span><div style="flex:1"><small class="mono" style="font-size:9.5px;color:var(--samar)">NAMA BOT DI TELEGRAM</small><b style="display:block;font-size:15px;margin-top:3px">@analismarketbot</b></div><span class="chip besar am">${ik('salin')}Salin nama</span>
      </div>
      <div class="label-kecil">TEMPEL TAUTAN DARI BOT</div>
      <div class="tempel">https://analismarket.com/?masuk=…</div>
      <span class="btn amber penuh" style="margin-top:10px">${ik('tempel')}Tempel &amp; sambungkan</span>
      <p class="catat" style="padding-top:10px">Tautannya sekali pakai dan tidak kedaluwarsa. Kalau sudah terpakai, minta lagi ke bot.</p>
      <div class="garis-atau">atau masuk dengan akun web</div>
      <span class="btn kaca penuh"><svg class="g"><use href="#i-google"/></svg>Masuk dengan Google</span>
      <p class="catat">Akun yang sama dengan analismarket.com. Pantauan dan kabar jalan di app lewat notifikasi HP; Telegram opsional.</p>
    </div>`, { cahaya: 'redup' });
}

/* 03 · Home */
function sHome(basi = false) {
  const pB = P['BTCUSDT'];
  const sparkW = 326;
  const fav = [['XAU/USD', B('XAU/USD', 'h1')], ['ETHUSDT', B('ETHUSDT', 'h1')], ['SOLUSDT', B('SOLUSDT', 'h1')]].map(([s, b]) => {
    const u = P[s]?.ubah24hPersen ?? ubahLilin(b);
    const h = P[s]?.harga ?? b.harga;
    return `<div class="fav kaca"><div class="f1">${lambang(s, 18)}${s}</div><div class="fh">${harga(s, h)}</div><div class="fu ${warnaUbah(u)}">${persen(u)}</div>${spark(tutupLilin(b), 126, 30, u >= 0 ? '#10B981' : '#F43F5E', 0.25)}</div>`;
  }).join('');
  const vid = v(TONTON);
  const babN = vid.bab;
  const pita = basi ? `<div class="pita-basi">${ik('peringatan')}<div><b>Tidak bisa menghubungi server.</b>Angka di bawah terakhir diperbarui ${jam(NOW - 1260)}.</div><span>Coba lagi</span></div>` : '';
  return hp(`
    <div class="kepala">
      <div class="ava">${AKUN.inisial}</div>
      <div class="sapa"><small>${tglPendek(NOW).replace(/^(\w)/, (c) => c.toUpperCase())}</small><b>Halo, ${AKUN.nama}</b></div>
      <div class="kanan-k"><span class="lencana-am">AM+ · ${AKUN.sisa} hari</span><span class="bulat kaca">${ik('kabar')}<i class="lencana" style="top:-3px;right:-3px">3</i></span></div>
    </div>
    ${pita}
    <div class="isi">
      <div class="hero kilap" ${basi ? 'style="opacity:.78"' : ''}>
        <div class="b1">${lambang('BTCUSDT')}<b>BTCUSDT</b><span class="chip">h4 · ${MU}</span><span class="ket mono" style="white-space:nowrap">TERAKHIR DIBUKA</span></div>
        <div class="harga-besar">${harga('BTCUSDT', HARGA_BTC).replace(/,(\d+)$/, '<span>,$1</span>')}</div>
        <div class="ubah ${warnaUbah(pB.ubah24hPersen)}">${persen(pB.ubah24hPersen)} <em>24 jam</em></div>
        ${spark(tutupLilin(UTAMA, 60), sparkW, 60, pB.ubah24hPersen >= 0 ? '#10B981' : '#F43F5E', 0.3, true)}
        <div class="keadaan"><i class="dot ${titik(MUM)}"></i>${kata(MUM)} · ${lolos(MUM)} dari ${wajib(MUM).length} syarat <span>RR bersih ${angka(MUM.rrBersih, 2)} · biaya ${biaya(MUM)}%</span></div>
        <div class="tombol2"><span class="btn amber">Buka chart ${ik('panah')}</span><span class="btn kaca">Bacaan</span></div>
      </div>
      <div class="lanjut kaca">
        <div class="thumb"><img src="${sampul(TONTON)}" alt=""><span class="mini-putar">${ik('putar')}</span></div>
        <div class="tx"><small>AKADEMI · BAB ${babN.n} · ${String(vid.no).padStart(2, '0')}/${D.akademi.jumlah.video}</small><b>${vid.judul}</b><div class="bar"><i style="width:30%"></i></div><em>3 dari ${babN.video.length} selesai di bab ini</em></div>
        ${chev}
      </div>
      <div class="pintu">
        <div class="p kaca"><span class="ik">${ik('mata')}</span><b>Pantauan</b><em>${PANTAUAN.length} dari ${AKUN.maks} aktif</em></div>
        <div class="p kaca"><span class="ik">${ik('tambah')}</span><b>Pantau baru</b><em>pasar × tf</em></div>
        <div class="p kaca"><span class="am">AM+</span><span class="ik">${ik('kilat')}</span><b>Kabar otomatis</b><em>rangkuman pagi</em></div>
        <div class="p kaca"><span class="am">AM+</span><span class="ik">${ik('kisi')}</span><b>Cek banyak</b><em>sampai 12 pasar</em></div>
        <div class="p kaca"><span class="ik">${ik('kalender')}</span><b>Kalender</b><em>30 hari ke depan</em></div>
        <div class="p kaca"><span class="ik">${ik('buku')}</span><b>Istilah</b><em>16 istilah</em></div>
      </div>
      ${seksi('Pasar favorit', 'Atur')}
      <div class="favorit">${fav}</div>
    </div>`, { bilah: 'home', cahaya: 'dua' });
}

/* 04 · Menu akun (dulu tab Lainnya) */
function sMenu() {
  const kripto = D.pasar.filter((p) => p.jenis === 'kripto').length;
  return hp(`
    ${nav('Menu')}
    <div class="isi">
      <div class="akun-mini kilap"><div class="ava">${AKUN.inisial}</div><div class="tx"><b>${AKUN.nama}</b><em>AnalisMarket+ aktif · Telegram</em></div>${chev}</div>
      ${seksi('BACA', '', true)}
      <div class="grup kaca">${br({ ikon: 'kalender', judul: 'Kalender berita', kanan: nilai('30 hari'), panah: true })}${br({ ikon: 'buku', judul: 'Istilah', kanan: nilai('16 istilah'), panah: true })}</div>
      ${seksi('AKUN', '', true)}
      <div class="grup kaca">${br({ ikon: 'orang', judul: 'Profil', kanan: nilai('AM+', 'amber'), panah: true })}${br({ ikon: 'mata', judul: 'Pantauan', kanan: nilai(`${PANTAUAN.length} aktif`), panah: true })}${br({ ikon: 'gear', judul: 'Pengaturan', kanan: `<span class="nilai mono" style="letter-spacing:0;font-size:11.5px">h4 · BTCUSDT</span>`, panah: true })}</div>
      ${seksi('DOKUMEN', '', true)}
      <div class="grup kaca">${br({ ikon: 'dokumen', ikKelas: 'netral', judul: 'Syarat &amp; Ketentuan', panah: true })}${br({ ikon: 'perisai', ikKelas: 'netral', judul: 'Kebijakan Privasi', panah: true })}${br({ ikon: 'info', ikKelas: 'netral', judul: 'Tentang AnalisMarket', kanan: `<span class="nilai mono" style="letter-spacing:0;font-size:11px">v1.0.0 · aabea88</span>`, panah: true })}</div>
      <div class="merek-blok kaca">
        <div class="m1"><img src="aset/mark.png" alt=""><b>Analis<span>Market</span><em>v1.0.0 · aabea88 · Binance &amp; Twelve Data</em></b></div>
        <div class="data-masuk"><div><small>Harga</small><b>${jam(D.pasarPada)}</b></div><div><small>Lilin</small><b>${jam(UTAMA.hargaWaktu ?? NOW)}</b></div><div><small>Kalender</small><b>${jam(NOW)}</b></div></div>
      </div>
      <p class="catat">Analisa teknikal otomatis. Bukan nasihat investasi. · ${kripto} pasar kripto</p>
    </div>`, { bilah: 'home', cahaya: 'redup' });
}

/* data kotak masuk — keadaan dari bacaan asli, riwayatnya contoh */
function kabarMasuk() {
  const r = [];
  for (const [p, tf, k] of PANTAUAN) {
    const b = B(p, tf); const m = mesin(b, k);
    if (m?.status === 'SETUP') {
      const detik = tf === 'h4' ? 14400 : 3600;
      r.push({ jenis: 'pantauan', judul: `${p} ${tf} · ${k} masuk Setup`, isi: `${lolos(m)} dari ${wajib(m).length} syarat wajib lolos. ${m.keputusan.label}.`, ts: Math.min(NOW - 120, b.lilinTerakhir + detik), baca: false, pair: true });
    }
  }
  const cb = cekBanyakData();
  r.push({ jenis: 'otomatis', judul: 'Ringkasan 12 pasar h1', isi: `${cb.n.setup} setup · ${cb.n.pantau} pantau · ${cb.n.tdk} tidak terbaca atau tidak dicetak.`, ts: NOW - 900, baca: false, pair: false });
  const baru = VIDEO.filter((x) => x.tersedia).sort((a, b) => b.no - a.no)[0];
  r.push({ jenis: 'sistem', judul: `Akademi: video ${String(baru.no).padStart(2, '0')} sudah tayang`, isi: `“${baru.judul}” — Bab ${baru.bab.n}, ${angka(baru.menit, 0)} menit.`, ts: NOW - 5 * 3600, baca: true, pair: false });
  r.sort((a, b) => b.ts - a.ts);
  r.push({ jenis: 'pantauan', judul: 'XAU/USD h1 · snr masuk Setup', isi: '7 dari 7 syarat wajib lolos. Menunggu entry.', ts: NOW - 86400 - 7200, baca: true, pair: true });
  r.push({ jenis: 'sistem', judul: 'AnalisMarket+ aktif', isi: 'Masa aktif 30 hari dimulai. Kabar otomatis dan cek banyak sudah terbuka.', ts: NOW - 7 * 86400, baca: true, pair: false });
  return r;
}
/* 05 · Kotak masuk */
function sKotakMasuk() {
  const rows = kabarMasuk();
  const belum = rows.filter((x) => !x.baca).length;
  const ikJenis = { pantauan: ['kabar', ''], otomatis: ['bintang', ''], sistem: ['gear', 'netral'], promo: ['bintang', ''] };
  const lencana = { otomatis: '<span class="lg am">AM+</span>', sistem: '<span class="lg netral">Sistem</span>', promo: '<span class="lg am">Promo</span>', pantauan: '' };
  const grup = {};
  for (const x of rows) { const k = selisihHari(x.ts); (grup[k] ??= []).push(x); }
  const label = (k, ts) => k === 0 ? 'HARI INI' : k === -1 ? 'KEMARIN' : tglPendek(ts).toUpperCase();
  const isi = Object.keys(grup).map(Number).sort((a, b) => b - a).map((k) => `<div class="lbl-hari">${label(k, grup[k][0].ts)}</div><div class="grup kaca">${grup[k].map((x) => `
    <div class="km${x.baca ? ' dibaca' : ''}"><span class="ik ${ikJenis[x.jenis][1]}">${ik(ikJenis[x.jenis][0])}</span>
      <div class="tx"><div class="j"><b>${x.judul}</b>${lencana[x.jenis]}</div><p>${x.isi}</p></div>
      <div class="kn"><small>${jam(x.ts)}</small><div class="baris-kn">${x.baca ? '' : '<i class="dot amber"></i>'}${x.pair ? chev : ''}</div></div>
    </div>`).join('')}</div>`).join('');
  return hp(`
    <div class="kb"><div><h1>Kabar</h1><p>${belum} belum dibaca · pantauan, AM+, dan pesan dari kami</p></div><div class="aksi"><span class="chip besar am">${ik('centang')}Tandai dibaca</span></div></div>
    <div class="chips-baris"><span class="chip besar on">Semua</span><span class="chip besar">Pantauan</span><span class="chip besar">Otomatis</span><span class="chip besar">Sistem</span><span class="chip besar">Promo</span></div>
    <div class="isi">${isi}</div>`, { bilah: 'kabar', belum, cahaya: 'redup' });
}

/* potongan layar Pasar */
function pasarKepala() {
  const u = P['BTCUSDT'].ubah24hPersen;
  return `<div class="pasar-kepala"><div class="pil-pasar kaca">${lambang('BTCUSDT', 24)}<b>BTCUSDT</b><span class="ganti">ganti ${ik('bawah')}</span></div><div class="hg"><b>${harga('BTCUSDT', HARGA_BTC)}</b><em class="${warnaUbah(u)}">${persen(u)}</em></div></div>
  <div class="tf-baris kaca">${P['BTCUSDT'].timeframes.map((t) => `<span class="${t.toLowerCase() === 'h4' ? 'on' : ''}">${t.toLowerCase()}</span>`).join('')}</div>
  <div class="pita-mesin">${UTAMA.mesin.map((m) => `<div class="pm${m.mesin === MU ? ' on' : ''}${m.status === 'SETUP' ? ' setup' : ''}"><b>${m.mesin}</b><em><i class="dot ${titik(m)}"></i>${m.status === 'SETUP' ? 'setup ' : ''}${lolos(m)}/${wajib(m).length}</em></div>`).join('')}</div>`;
}
const rencana = (m) => `<div class="rencana"><div><small>ENTRY</small><b>${harga('BTCUSDT', m.entry)}</b></div><div class="sl"><small>SL</small><b>${harga('BTCUSDT', m.sl)}</b></div><div class="tp"><small>TP</small><b>${harga('BTCUSDT', m.tp)}</b></div><div><small>RR BERSIH</small><b>${angka(m.rrBersih, 2)}</b></div></div>`;

/* 06 · Pasar */
function sPasar() {
  const m = MUM;
  return hp(`
    ${pasarKepala()}
    <div class="chart-bingkai"><img src="aset/asli/chart-btc-h4.png" alt=""></div>
    <div class="alat"><span class="chip nyala">volume</span><span class="chip nyala">zona</span><span class="chip nyala">struktur</span><span class="chip nyala">level</span><span class="chip">pola lilin</span><span class="chip am">${ik('dua')}banding</span></div>
    <div class="intip kilap">
      <div class="pegangan"></div>
      <div class="r1"><small>${MU.toUpperCase()} · H4</small><span class="chip">ATR ${harga('BTCUSDT', m.atr)}</span><span class="chip">Biaya ${biaya(m)}% risiko</span></div>
      <div class="r2"><i class="dot ${titik(m)}"></i><b>${kata(m)} · ${lolos(m)} dari ${wajib(m).length}</b><span class="samar" style="font-size:12px">${m.keputusan.label}</span></div>
      ${rencana(m)}
    </div>`, { bilah: 'pasar', cahaya: 'redup' });
}

/* 07 · Lembar bacaan */
function sBacaan() {
  const m = MUM;
  const merah = m.sl > m.entry;
  const w = wajib(m);
  return hp(`
    ${pasarKepala()}
    <div class="tirai"></div>
    <div class="lembar" style="top:112px">
      <div class="pegangan"></div>
      <div class="lb-kepala"><small>BACAAN · BTCUSDT H4 · ${MU.toUpperCase()}</small><span class="tutup">tutup</span></div>
      <div class="kl">
        <div class="kk"><small>STATUS RENCANA</small><span>RR bersih 1:${angka(m.rrBersih, 1)}</span></div>
        <div class="status-besar"><i class="dot ${titik(m)}"></i><b>${m.keputusan.label}</b>${berangka(m) ? `<span class="arah ${merah ? 'merah' : 'hijau'}">${m.arah}</span>` : ''}</div>
        <div style="margin-top:12px">${rencana(m)}</div>
        ${m.caraMasuk ? `<div class="arahan"><small>ARAHAN</small><p>${m.caraMasuk}</p></div>` : ''}
      </div>
      <div class="kl">
        <div class="kk"><small>BIAYA</small><span>wajar di bawah 50%</span></div>
        <div class="meter-b"><i style="width:${Math.max(2, Math.min(100, m.biayaPorsi))}%"></i></div>
        <p class="alasan">Biaya ${biaya(m)}% dari risiko · ${namaMesin(UTAMA, MU)}</p>
      </div>
      <div class="kl">
        <div class="kk"><small>SYARAT ${MU.toUpperCase()}</small><span class="hijau">${lolos(m)} dari ${w.length} lolos</span></div>
        ${w.slice(0, 4).map((s) => `<div class="syarat"><span class="cek ${s.lolos ? 'ya' : 'tidak'}">${ik(s.lolos ? 'centang' : 'silang')}</span><div><b>${s.nama}</b><em>${s.kalimat}</em></div></div>`).join('')}
      </div>
    </div>`, { cahaya: 'redup' });
}

/* 08 · Lembar bacaan, digulir: level, zona, konteks */
function sBacaanLanjut() {
  const m = MUM;
  const w = wajib(m);
  return hp(`
    ${pasarKepala()}
    <div class="tirai"></div>
    <div class="lembar" style="top:112px">
      <div class="pegangan"></div>
      <div class="lb-kepala"><small>BACAAN · BTCUSDT H4 · ${MU.toUpperCase()}</small><span class="tutup">tutup</span></div>
      <div class="kl" style="padding-top:6px;padding-bottom:6px">
        ${w.slice(4, 8).map((s) => `<div class="syarat"><span class="cek ${s.lolos ? 'ya' : 'tidak'}">${ik(s.lolos ? 'centang' : 'silang')}</span><div><b>${s.nama}</b><em>${s.kalimat}</em></div></div>`).join('')}
      </div>
      <div class="kl">
        <div class="kk"><small>LEVEL YANG DIAWASI</small><span>${m.level.length}</span></div>
        ${m.level.map((l) => `<div class="zl"><span class="zt">${harga('BTCUSDT', l.harga)}</span><div><b>${l.peran}</b>${l.diLuarJangkauan ? '<em>di luar jangkauan</em>' : ''}</div></div>`).join('')}
      </div>
      <div class="kl">
        <div class="kk"><small>ZONA (${m.zona.length})</small><span>${namaMesin(UTAMA, MU)}</span></div>
        ${m.zona.slice(0, 3).map((z) => `<div class="zl"><span class="zt ${z.peran}">${z.teks}</span><div><b>${harga('BTCUSDT', z.bawah)} – ${harga('BTCUSDT', z.atas)}</b><em>${z.peran}${z.terpilih ? ' · dipakai rencana' : ''}</em></div></div>`).join('')}
      </div>
      <div class="kl">
        <div class="kk"><small>KONTEKS ATAS</small><span>${m.htfTimeframe ?? '—'}</span></div>
        <p class="alasan" style="margin-top:0">${m.konteksAtas ?? '—'}</p>
        <div style="margin-top:6px">
          <div class="kv"><span>ATR</span><b>${harga('BTCUSDT', m.atr)}</b></div>
          <div class="kv"><span>Jarak entry</span><b>${m.jarakEntryAtr == null ? '—' : angka(m.jarakEntryAtr, 2) + ' ATR'}</b></div>
        </div>
      </div>
      <p class="catat" style="padding:4px 10px 0">Ini alat baca chart, bukan alat prediksi. Semua analisa bersifat informasi, bukan ajakan melakukan transaksi.</p>
    </div>`, { cahaya: 'redup' });
}

/* 09 · Banding mesin */
function sBanding() {
  const bera = UTAMA.mesin.filter(berangka);
  const per = {}; for (const m of bera) per[m.arah] = (per[m.arah] ?? 0) + 1;
  const maks = Math.max(0, ...Object.values(per));
  return hp(`
    ${pasarKepala()}
    <div class="tirai"></div>
    <div class="lembar" style="top:212px">
      <div class="pegangan"></div>
      <div class="lb-kepala"><small>BANDING MESIN · BTCUSDT H4</small><span class="tutup">tutup</span></div>
      ${UTAMA.mesin.map((m) => `<div class="bd${m.mesin === MU ? ' on' : ''}">
        <div class="nm"><b><i class="dot ${titik(m)}"></i>${m.mesin}</b><em>${m.keputusan.label}</em></div>
        <div class="kol st-k"><small>STATUS</small><b>${kata(m)} ${lolos(m)}/${wajib(m).length}</b></div>
        <div class="kol"><small>RR</small><b>${berangka(m) ? angka(m.rrBersih, 2) : '—'}</b></div>
        <div class="kol"><small>JARAK</small><b>${m.jarakEntryAtr == null || !berangka(m) ? '—' : angka(m.jarakEntryAtr, 1) + ' ATR'}</b></div>
      </div>`).join('')}
      <div class="sepakat kaca"><b>${bera.length ? `${maks}/${bera.length}` : '—'}</b><div>${bera.length ? `mesin berangka menunjuk ke sisi yang sama. Mesin tanpa angka rencana tidak ikut dihitung.` : 'tidak ada mesin yang punya angka rencana'}</div></div>
      <p class="catat" style="padding:10px 6px 0">Lima mesin membaca lilin yang sama. Yang berbeda cuma aturannya, dan kesepakatan di antara mereka tidak membuat satu pun lebih mungkin benar.</p>
    </div>`, { cahaya: 'redup' });
}

/* 10 · Pilih pasar */
function sPilihPasar() {
  const urut = [...D.pasar].sort((a, b) => b.volume24hUsd - a.volume24hUsd).filter((p) => p.simbol !== 'BTCUSDT').slice(0, 9);
  const baris = (p, dibuka = false) => {
    const h = p.simbol === 'BTCUSDT' ? HARGA_BTC : p.harga;
    return `<div class="pp${dibuka ? ' dibuka' : ''}">${lambang(p.simbol, 30)}<div class="tx"><b>${p.simbol}${dibuka ? '<span class="lg am">dibuka</span>' : ''}</b><em>${p.label} · vol ${volR(p.volume24hUsd)}</em></div><div class="hg"><b>${harga(p.simbol, h)}</b><em class="${warnaUbah(p.ubah24hPersen)}">${persen(p.ubah24hPersen)}</em></div></div>`;
  };
  return hp(`
    ${pasarKepala()}
    <div class="tirai" style="background:rgba(5,4,3,.35)"></div>
    <div class="lembar" style="top:150px">
      <div class="pegangan"></div>
      <div class="cari kaca">${ik('cari')}Cari dari ${D.pasar.length} pasar…</div>
      <div style="display:flex;gap:6px;margin:10px 0 6px"><span class="chip besar on">Semua</span><span class="chip besar">Kripto ${D.pasar.filter((p) => p.jenis === 'kripto').length}</span><span class="chip besar">Emas &amp; forex ${D.pasar.filter((p) => p.jenis !== 'kripto').length}</span></div>
      <div style="padding:0 4px">${baris(P['BTCUSDT'], true)}${urut.map((p) => baris(p)).join('')}</div>
    </div>`, { cahaya: 'redup' });
}

/* 11 · Akademi */
function sAkademi() {
  const vid = v(TONTON);
  const bab = D.akademi.bab;
  const ringkas = (b) => {
    const tayang = b.video.filter((x) => x.tersedia).length;
    if (b.n === 1) return `<span class="lg gratis">Gratis</span>3 dari ${b.video.length} selesai · ${tayang} tayang`;
    if (b.tier === 'plus') return `<span class="lg am">AM+</span>Terbuka · ${tayang ? tayang + ' tayang' : 'segera tayang'}`;
    return `<span class="lg penuh">Akses penuh</span>${b.video.length} video · terkunci`;
  };
  const segmen = bab[0].video.map((x) => x.no < TONTON ? '<i class="s"></i>' : x.no === TONTON ? '<i class="h" style="--h:62%"></i>' : x.tersedia ? '<i></i>' : '<i class="g"></i>').join('');
  return hp(`
    <div class="kb"><div><small class="mono amber">AKADEMI ANALISMARKET</small><h1>Belajar dari <span>nol.</span></h1><p>${bab.length} bab · ${D.akademi.jumlah.video} pelajaran · ${D.akademi.jumlah.tersedia} sudah tayang</p></div><div class="aksi"><span class="bulat kaca">${ik('buku')}</span><span class="bulat kaca">${ik('cari')}</span></div></div>
    <div class="isi">
      <div class="lanjutkan kilap">
        <div class="sampul"><img src="${sampul(TONTON, 'besar')}" alt=""><div class="gelap"></div><span class="putar-besar">${ik('putar')}</span><span class="sisa">sisa ${mss(v(TONTON).menit * 60 * 0.38)}</span><div class="jejak"><i style="width:62%"></i></div></div>
        <div class="ket"><small class="mono amber">LANJUTKAN · VIDEO ${String(vid.no).padStart(2, '0')} DARI ${D.akademi.jumlah.video}</small><b>${vid.judul}</b><em>Bab ${vid.bab.n} · ${vid.bab.nama}</em></div>
      </div>
      ${seksi('Jalur belajar', '<span class="akses">Akses kamu · Bab 1–3</span>')}
      <div class="jalur">
        ${bab.slice(0, 5).map((b) => `<div class="bab kaca${b.tier === 'penuh' ? ' kunci' : ''}">
          ${b.n === 1 ? '<div class="simpul cincin" style="--p:36"><span>1</span></div>' : b.tier === 'penuh' ? `<div class="simpul">${ik('gembok')}</div>` : `<div class="simpul"><span>${b.n}</span></div>`}
          <div class="tx"><b>${b.nama}</b><em>${ringkas(b)}</em>${b.n === 1 ? `<div class="segmen">${segmen}</div>` : ''}</div>${chev}</div>`).join('')}
      </div>
    </div>`, { bilah: 'akademi', cahaya: '' });
}

/* 12 · Isi bab */
function sBab() {
  const b = D.akademi.bab[0];
  const tayang = b.video.filter((x) => x.tersedia).length;
  const vids = b.video.map((x) => {
    const sel = x.no < TONTON; const sed = x.no === TONTON; const seg = !x.tersedia;
    const lapis = sel ? `<span class="lapis selesai">${ik('centang')}</span>` : seg ? `<span class="lapis">${ik('jam')}</span>` : sed ? '<span class="bar-v" style="width:62%"></span>' : '';
    const ket = sel ? '<span class="hijau">Selesai</span>' : sed ? `<span class="amber">Sedang ditonton · sisa ${mss(x.menit * 60 * 0.38)}</span>` : seg ? 'Segera' : `Tersedia · ${angka(x.menit, 0)} mnt`;
    return `<div class="vid${seg ? ' segera' : ''}"><div class="th">${sampul(x.no) ? `<img src="${sampul(x.no)}" alt="">` : ''}${lapis}</div><div class="tx"><b>${String(x.no).padStart(2, '0')} · ${x.judul}</b><em>${ket}</em></div></div>`;
  }).join('');
  return hp(`
    ${nav(`Bab ${b.n}`, 'Gratis · login untuk menonton', `<span class="bulat kaca">${ik('cari')}</span>`, true)}
    <div class="isi">
      <div class="grup kilap" style="padding:14px;border-radius:22px;display:flex;gap:14px;align-items:center">
        <div class="simpul cincin" style="--p:36;width:54px;height:54px"><span style="width:44px;height:44px;font-size:15px">30%</span></div>
        <div style="flex:1"><b style="font-size:16px;font-weight:600;display:block">${b.nama}</b><em style="font-style:normal;font-size:12px;color:var(--muted);display:block;margin-top:3px;line-height:1.4">${b.ringkas}</em></div>
      </div>
      <div class="seksi kecil" style="margin-top:14px"><b>${b.video.length} VIDEO · ${tayang} TAYANG · 3 SELESAI</b></div>
      <div class="grup kaca" style="padding:4px 0">${vids}</div>
    </div>`, { bilah: 'akademi', cahaya: 'redup' });
}

/* 13 · Pelajaran */
function sPelajaran() {
  const vid = v(TONTON); const lanjut = v(TONTON + 1);
  return hp(`
    <div class="nav"><span class="bulat kaca">${ik('kiri')}</span><span class="mono" style="font-size:10.5px;color:var(--muted)">BAB ${vid.bab.n} · ${String(vid.no).padStart(2, '0')} / ${D.akademi.jumlah.video}</span><span class="bulat kaca">${ik('titik')}</span></div>
    <div class="pemutar"><img src="${sampul(TONTON, 'besar')}" alt=""><div class="gelap2"></div><span class="putar-besar jeda">${ik('jeda')}</span>
      <div class="kontrol"><span>${mss(vid.menit * 60 * 0.62)}</span><div class="rel"><i style="width:62%"></i><b style="left:62%"></b></div><span>${mss(vid.menit * 60)}</span></div></div>
    <div class="pelajaran"><small class="mono amber">VIDEO ${String(vid.no).padStart(2, '0')} DARI ${D.akademi.jumlah.video} · BAB ${vid.bab.n}</small><h2>${vid.judul}</h2><p class="ringkas">${vid.ringkas}</p></div>
    <div class="coba kilap">
      <div class="coba-kepala"><span class="ik">${ik('pasar')}</span><div><b>Coba di chart</b><em>Lilin terakhir BTCUSDT, dibedah</em></div><span class="chip">h1</span></div>
      ${lilinBedah(B('BTCUSDT', 'h1'), 20, 330, 118)}
      <span class="btn amber">Buka BTCUSDT h1 di Pasar ${ik('panah')}</span>
    </div>
    <div class="istilah-c"><small class="mono" style="font-size:9.5px;color:var(--samar)">ISTILAH DI PELAJARAN INI</small>
      <div class="cc"><span class="chip">${ik('buku')}OHLC</span><span class="chip">Body</span><span class="chip">Sumbu (wick)</span><span class="chip">Timeframe</span></div></div>
    <div class="berikut kaca"><img src="${sampul(lanjut.no)}" alt=""><div><small>BERIKUTNYA · ${String(lanjut.no).padStart(2, '0')}</small><b>${lanjut.judul}</b><em>${angka(lanjut.menit, 0)} mnt</em></div>${chev}</div>`, { cahaya: 'redup' });
}

/* 14 · Istilah (dulu Belajar) */
const ISTILAH = [
  ['Order block', 'OB', 'Lilin terakhir sebelum harga bergerak kuat ke satu arah. Kotak zonanya dipakai sebagai acuan entry kalau belum pernah disentuh lagi (“belum termitigasi”).'],
  ['Fair value gap', 'FVG', 'Celah harga yang ditinggalkan gerakan cepat: rentang yang tidak sempat diperdagangkan. Dipakai sebagai zona entry hanya kalau tidak ada order block yang layak.'],
  ['Break of structure', 'BOS', 'Harga menembus puncak atau lembah terakhir SEARAH struktur yang sedang berjalan. Penanda bahwa tren masih dilanjutkan.'],
  ['Awan Ichimoku', 'Kumo', 'Wilayah antara Senkou A dan Senkou B. Lebar dan letaknya terhadap harga jadi penguat bias; stop diletakkan di seberang awan.'],
  ['Average true range', 'ATR', 'Rentang gerak rata-rata satu lilin. Jarak entry dari harga sekarang dan lebar SL dinyatakan dalam ATR; rencana yang entry-nya lebih jauh dari 2 ATR tidak dicetak.'],
  ['Biaya dari risiko', 'biaya', 'Ongkos masuk-keluar (fee dan slippage) dibagi jarak stop loss. Di bawah 50% wajar; di atas 100% ongkos melebihi seluruh risiko dan angka rencana ditahan.'],
];
function sIstilah() {
  return hp(`
    ${nav('Istilah', '16 istilah · cara baca kartu', `<span class="bulat kaca">${ik('cari')}</span>`, true)}
    <div class="isi">
      <div class="seg kaca"><span class="on">Istilah</span><span>Cara baca kartu</span></div>
      <div class="grup kaca" style="margin-top:12px">${ISTILAH.map(([n, k, a]) => `<div class="ist"><div class="j"><b>${n}</b><span class="kd">${k}</span></div><p>${a}</p></div>`).join('')}</div>
    </div>`, { bilah: 'akademi', cahaya: 'redup' });
}

/* 15 · Pantauan */
function sPantauan() {
  const rows = PANTAUAN.map(([p, tf, k]) => {
    const m = mesin(B(p, tf), k);
    return `<div class="br">${lambang(p, 30)}<div class="tx"><b>${p} ${tf} · ${k}</b><em><i class="dot ${titik(m)}" style="margin-right:5px;width:6px;height:6px"></i>${kata(m)} · ${lolos(m)} dari ${wajib(m).length} syarat wajib</em></div><span class="chip">matikan</span></div>`;
  }).join('');
  const sekarang = UTAMA.mesin.map((m) => {
    const dipantau = m.mesin === MU;
    return `<div class="br tanpa-ik"><div class="tx"><b>BTCUSDT h4 · ${m.mesin}</b><em>${lolos(m)} dari ${wajib(m).length} syarat wajib lolos</em></div>${dipantau ? '<span class="lg netral">dipantau</span>' : `<span class="chip${m.status === 'SETUP' ? ' am' : ''}">+ pantau</span>`}</div>`;
  }).join('');
  return hp(`
    ${nav('Pantauan', '', `<span class="chip besar am">${ik('tambah')}Baru</span>`)}
    <div class="isi">
      <div class="ringkas-pt kilap"><div class="cincin-pt" style="--p:${PANTAUAN.length / AKUN.maks * 100}"><span>${PANTAUAN.length}/${AKUN.maks}</span></div><div class="tx"><b>${PANTAUAN.length} pantauan aktif</b><em>Batas ${AKUN.maks} pantauan · kabar ke HP ini saat syarat wajib lolos semua</em></div></div>
      <div style="display:flex;gap:6px;margin:12px 0 0"><span class="chip besar on">Aktif ${PANTAUAN.length}</span><span class="chip besar">Dimatikan 1</span></div>
      ${seksi('Sedang dipantau', 'keadaan sekarang')}
      <div class="grup kaca">${rows}</div>
      ${seksi('Bisa dipantau sekarang', 'BTCUSDT h4')}
      <div class="grup kaca">${sekarang}</div>
    </div>`, { bilah: 'home', cahaya: 'redup' });
}

/* 16 · Pantau baru */
function sPantauBaru() {
  const m = MUM;
  return hp(`
    ${nav('Pantauan baru', `${PANTAUAN.length} dari ${AKUN.maks} terpakai`, '', true)}
    <div class="isi">
      ${seksi('PASAR &amp; TIMEFRAME', '', true)}
      <div class="grup kaca">${br({ judul: 'BTCUSDT', sub: 'dari layar Pasar', kanan: lambang('BTCUSDT', 26) })}${br({ judul: 'Timeframe', kanan: nilai('h4') })}${br({ judul: 'Mesin', kanan: nilai(MU) })}</div>
      <p class="catat" style="text-align:left;padding:8px 4px 0">Ganti pasar, timeframe, atau mesin di layar Pasar, lalu kembali ke sini.</p>
      <div class="kl kaca" style="margin-top:12px;border-radius:18px">
        <div class="kk"><small>KEADAAN SEKARANG</small><span class="${m.status === 'SETUP' ? 'hijau' : ''}">${kata(m)} · ${lolos(m)}/${wajib(m).length}</span></div>
        <p class="alasan" style="margin-top:0">${m.keputusan.label}. Kabar pertama datang saat keadaannya berubah, bukan saat dipasang.</p>
      </div>
      ${seksi('KABARI SAYA SAAT', '', true)}
      <div class="grup kaca">
        ${br({ judul: 'Syarat wajib lolos semua', sub: 'Kartunya berubah jadi SETUP', kanan: '<span class="radio on"></span>' })}
        ${br({ judul: 'Entry tersentuh', sub: 'Harga mencapai level entry · menyusul', kanan: '<span class="radio"></span>', kelas: 'redup' })}
        ${br({ judul: 'TP atau SL tersentuh', sub: 'Posisi berjalan selesai · menyusul', kanan: '<span class="radio"></span>' })}
      </div>
      <span class="btn amber penuh" style="margin-top:14px">${ik('mata')}Simpan pantauan</span>
      ${seksi('CONTOH KABAR DI LAYAR KUNCI', '', true)}
      <div class="grup kaca" style="padding:12px 14px;display:flex;gap:11px;align-items:flex-start">
        <img src="aset/mark.png" alt="" style="width:30px;height:30px;border-radius:9px;flex:none">
        <div style="flex:1;min-width:0"><div style="display:flex;justify-content:space-between"><b style="font-size:12.5px">AnalisMarket</b><small style="font-size:11px;color:var(--samar)">sekarang</small></div>
        <b style="display:block;font-size:13px;margin-top:2px">BTCUSDT h4 · ${MU} masuk Setup</b><em style="display:block;font-style:normal;font-size:12px;color:var(--muted);margin-top:2px">${lolos(m)} dari ${wajib(m).length} syarat wajib lolos. Ketuk untuk membuka chart.</em></div>
      </div>
      <p class="catat" style="text-align:left;padding:8px 4px 0">Kabar tidak memuat entry, SL, TP, maupun arah — dibaca di layar kunci, sering jauh sesudah tiba.</p>
    </div>`, { cahaya: 'redup' });
}

/* 17 · Kabar otomatis */
function sKabarOtomatis() {
  const rows = KO;
  const pilihan = ['Tidak ada', '00.00–03.00', '00.00–05.00', '23.00–07.00'];
  return hp(`
    ${nav('Kabar otomatis', 'AnalisMarket+')}
    <div class="isi">
      <div class="grup kilap" style="padding:14px;border-radius:22px;display:flex;align-items:center;gap:12px">
        <span class="ik">${ik('kilat')}</span><div style="flex:1"><b style="font-size:15px;font-weight:600;display:block">Kabar otomatis</b><em style="font-style:normal;font-size:12px;color:var(--muted)">${KO_NYALA} pasangan · tanpa membuka app</em></div><span class="chip besar">Matikan semua</span>
      </div>
      ${seksi('JAM SUNYI', '', true)}
      <div class="grup kaca">${br({ ikon: 'kirim', judul: 'Kabar dikirim', kanan: nilai('07.00–22.59 WIB') })}${br({ ikon: 'bulan', judul: 'Sunyi', kanan: nilai('23.00–07.00 WIB') })}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">${pilihan.map((x) => `<span class="chip besar${x === '23.00–07.00' ? ' on' : ''}">${x}</span>`).join('')}</div>
      <p class="catat" style="text-align:left;padding:8px 4px 0">Di jam sunyi kabar otomatis tidak dikirim, dan tidak disusulkan sesudahnya. Jam mengikuti WIB.</p>
      ${seksi('TIMEFRAME YANG DIPANTAU OTOMATIS', '', true)}
      <div class="grup kaca">${rows.map(([tf, k, on]) => br({ judul: `${tf} · ${k}`, sub: namaMesin(UTAMA, k), kanan: saklar(on) })).join('')}</div>
    </div>`, { bilah: 'plus', cahaya: 'redup' });
}

/* 18 · Kalender */
function sKalender() {
  const rilis = [...D.jadwal].sort((a, b) => a.waktu - b.waktu);
  const pertama = rilis[0];
  const hari = Math.max(0, selisihHari(pertama.waktu));
  const grup = {}; for (const r of rilis) (grup[hariIdx(r.waktu)] ??= []).push(r);
  const daftar = Object.values(grup).map((rs) => `<div class="lbl-hari">${judulHari(rs[0].waktu)}</div><div class="grup kaca">${rs.map((r) => `<div class="kal"><span class="dampak ${r.dampak}"></span><span class="jm">${jam(r.waktu)}</span><div class="tx"><b>${r.nama}</b><em>${r.acara}</em><span class="lg ${r.dampak}">${r.kode} · dampak ${r.dampak}</span></div></div>`).join('')}</div>`).join('');
  return hp(`
    ${nav('Kalender berita', '30 hari ke depan', '', true)}
    <div class="isi">
      <div class="hitung kilap"><div class="angka-h">${hari}<small>hari lagi</small></div><div style="flex:1"><b style="font-size:14px;font-weight:600;display:block">${pertama.nama}</b><em style="font-style:normal;font-size:12px;color:var(--muted);display:block;margin-top:3px">${tglPendek(pertama.waktu)} · ${jam(pertama.waktu)} WIB · dampak ${pertama.dampak}</em></div></div>
      <div style="display:flex;gap:6px;margin-top:12px"><span class="chip besar on">Semua ${rilis.length}</span><span class="chip besar">Tinggi ${rilis.filter((r) => r.dampak === 'tinggi').length}</span><span class="chip besar">Sedang ${rilis.filter((r) => r.dampak === 'sedang').length}</span></div>
      ${daftar}
      <div class="grup kaca legenda-kal" style="margin-top:12px"><p><b>Dampak tinggi</b> — emas dan forex sering melebar beberapa menit sebelum dan sesudahnya. Setup di sekitarnya lebih jarang lolos.</p><p>Jam dalam WIB. Kripto tidak libur; emas dan forex tutup Sabtu–Minggu.</p></div>
    </div>`, { bilah: 'home', cahaya: 'redup' });
}

/* 19 · PLUS+ pelanggan */
function kartuMember() {
  return `<div class="kartu-member"><div class="garis-km"></div><div class="kilau"></div>
    <div class="km-atas"><img class="km-logo" src="aset/mark.png" alt=""><span class="mono">ANALISMARKET+</span><span class="km-aktif"><i></i>Aktif</span></div>
    <div class="km-tengah"><div class="km-angka">${AKUN.sisa}<small>hari tersisa</small></div><div class="km-cincin" style="--p:${AKUN.sisa / 30 * 100}"><span>${AKUN.sisa}/30</span></div></div>
    <div class="km-bawah"><div><small>Berlaku sampai</small><b>${tglPanjang(AKUN.berakhir)}</b></div><div class="km-plat">${ik('monitor')}${ik('hp')}${ik('kirim')}<span>satu akun</span></div></div></div>`;
}
function sPlus() {
  const tayang23 = D.akademi.bab.slice(1, 3).reduce((n, b) => n + b.video.filter((x) => x.tersedia).length, 0);
  return hp(`
    <div class="kb"><div><h1>AnalisMarket<span>+</span></h1></div><div class="aksi"><span class="nilai" style="font-size:12px;color:var(--samar);margin-top:12px">Akun ${AKUN.nama}</span></div></div>
    <div class="isi">
      ${kartuMember()}
      ${seksi('Yang sedang jalan', 'dari akunmu')}
      <div class="grup kaca">
        ${br({ ikon: 'kilat', judul: 'Kabar otomatis', sub: `${KO_NYALA} pasangan · kirim 07.00–22.59`, kanan: '<i class="dot hijau"></i>', panah: true })}
        ${br({ ikon: 'kisi', judul: 'Cek banyak', sub: 'Sampai 12 pasar sekali tekan', panah: true })}
        ${br({ ikon: 'bulan', judul: 'Jam sunyi', sub: 'Diam 23.00–07.00', panah: true })}
        ${br({ ikon: 'akademi', judul: 'Akademi Bab 2–3', sub: tayang23 ? `Terbuka · ${tayang23} tayang` : 'Terbuka · segera tayang', panah: true })}
        ${br({ ikon: 'jam', judul: 'm1 &amp; m5 emas/forex', sub: '20 analisa per hari' })}
        ${br({ ikon: 'dua', judul: 'Multi-chart 2 atau 4', sub: 'Di Terminal web', kanan: '<span class="tag">web</span>' })}
      </div>
      <p class="catat">Berakhir sendiri di tanggalnya. Tidak ada potong otomatis.</p>
    </div>`, { bilah: 'plus', cahaya: 'dua' });
}

/* 20 · PLUS+ akun gratis (build Play) */
function sPlusGratis() {
  const fitur = [['kilat', 'Kabar otomatis', 'Pasar dipantau sendiri, tanpa dipasang satu-satu'], ['kisi', 'Cek banyak', 'Sampai 12 pasar sekali tekan, satu tabel'], ['jam', 'm1 &amp; m5 emas/forex', '20 analisa sehari'], ['bulan', 'Jam sunyi', 'Pilih jam kabar otomatis berhenti'], ['akademi', 'Akademi Bab 2–3', 'Struktur pasar & indikator']];
  return hp(`
    <div class="kb"><div><h1>AnalisMarket<span>+</span></h1></div></div>
    <div class="isi">
      <div class="kartu-member grafit"><div class="kilau"></div>
        <div class="km-atas"><img class="km-logo" src="aset/mark.png" alt=""><span class="mono">PAKET GRATIS</span><span class="km-aktif"><i></i>Gratis</span></div>
        <div class="km-tengah"><div style="font-size:19px;font-weight:600;line-height:1.3;letter-spacing:-.015em;color:var(--text);max-width:300px">Pasar dipantau otomatis, tanpa memasang satu-satu</div></div>
        <div class="km-bawah"><div><b>AnalisMarket+ belum aktif di akun ini.</b></div></div></div>
      ${seksi('Terbuka dengan AnalisMarket+')}
      <div class="grup kaca">${fitur.map(([i, j, s]) => br({ ikon: i, judul: j, sub: s, kanan: `<span class="ik netral" style="width:26px;height:26px;border-radius:8px">${ik('gembok')}</span>` })).join('')}</div>
      ${seksi('Yang tetap gratis')}
      <div class="grup kaca">${['Semua pasar, di timeframe yang tersedia', 'm1 dan m5 kripto', '10 pantauan', 'Kelima mesin analisa'].map((x) => br({ judul: x, kanan: `<span class="hijau">${'<svg style="width:16px;height:16px"><use href="#i-centang"/></svg>'}</span>` })).join('')}</div>
    </div>`, { bilah: 'plus', cahaya: 'redup' });
}

/* data cek banyak h1 — dari bacaan asli tiap pasar (cerminan terbaik() di Akun.tsx) */
function cekBanyakData() {
  const daftar = ['BTCUSDT', 'XAU/USD', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'EUR/USD', 'LINKUSDT', 'DOGEUSDT', 'SUIUSDT', 'ADAUSDT', 'AVAXUSDT'];
  const ubin = daftar.map((p) => {
    if (!P[p]?.timeframes.includes('H1')) return { p, k: 'tdk', lab: 'Tidak terbaca', mesin: null, jarak: null, ket: 'h1 tidak tersedia untuk pasar ini' };
    const b = B(p, 'h1');
    if (!b) return { p, k: 'tdk', lab: 'Tidak terbaca', mesin: null, jarak: null, ket: 'data gagal' };
    const t = [...b.mesin].sort((x, y) => Number(y.status === 'SETUP') - Number(x.status === 'SETUP') || (x.jarakEntryAtr ?? 99) - (y.jarakEntryAtr ?? 99))[0];
    const k = kelas(t);
    return { p, k, lab: kata(t), mesin: t.mesin, jarak: k === 'tdk' ? null : t.jarakEntryAtr, ket: null };
  });
  const urutan = { setup: 0, pantau: 1, tdk: 2 };
  ubin.sort((a, b) => urutan[a.k] - urutan[b.k] || (a.jarak ?? 99) - (b.jarak ?? 99));
  const n = { setup: ubin.filter((x) => x.k === 'setup').length, pantau: ubin.filter((x) => x.k === 'pantau').length, tdk: ubin.filter((x) => x.k === 'tdk').length };
  return { ubin, n };
}
/* 21 · Cek banyak */
function sCekBanyak() {
  const { ubin, n } = cekBanyakData();
  const tile = (u) => {
    const dot = u.k === 'setup' ? 'hijau' : u.k === 'pantau' ? 'krem' : 'redup';
    const meter = u.jarak == null ? '<div class="meter kosong"></div>' : `<div class="meter"><b style="left:${Math.min(u.jarak / 3, 1) * 100}%"></b></div>`;
    return `<div class="slot kaca ${u.k}"><div class="s1">${lambang(u.p, 18)}<b>${u.p}</b>${u.mesin ? `<span class="mesin">${u.mesin}</span>` : ''}</div><div class="s2"><i class="dot ${dot}"></i>${u.lab}</div>${meter}<div class="s3">${u.ket ?? (u.jarak == null ? 'jarak —' : u.jarak < 0.05 ? 'di level entry' : `${angka(u.jarak, 1)} ATR ke entry`)}</div></div>`;
  };
  return hp(`
    ${nav('Cek banyak', 'AnalisMarket+ · 12 pasar · 5 mesin', `<span class="bulat kaca">${ik('saring')}</span>`)}
    <div class="isi">
      <div class="kontrol-cb"><span class="chip kaca">Set <b>Pagi</b>${ik('bawah')}</span><span class="chip kaca">Timeframe <b>h1</b>${ik('bawah')}</span><span class="btn amber">${ik('ulang')}Jalankan lagi</span></div>
      <div class="ringkasan kaca">
        <div class="rbar"><i class="s" style="flex:${n.setup}"></i><i class="p" style="flex:${n.pantau}"></i><i class="t" style="flex:${n.tdk}"></i></div>
        <div class="rleg"><span><i class="dot hijau"></i><b>${n.setup}</b>Setup</span><span><i class="dot krem"></i><b>${n.pantau}</b>Pantau</span><span><i class="dot redup"></i><b>${n.tdk}</b>Lain</span><em>${jam(NOW)}</em></div>
      </div>
      <div class="papan-cb">${ubin.map(tile).join('')}</div>
    </div>`, { cahaya: 'redup' });
}

/* 22 · Berlangganan (build tautan unduhan — build Play tidak menyebut harga) */
function sBerlangganan() {
  const paket = [[1, 50000], [3, 135000], [6, 250000], [12, 480000]];
  const rp = (n) => 'Rp ' + angka(n, 0);
  return hp(`
    ${nav('Berlangganan', 'AnalisMarket+')}
    <div class="isi">
      <div class="kartu-member" style="height:170px"><div class="garis-km"></div><div class="kilau"></div>
        <div class="km-atas"><img class="km-logo" src="aset/mark.png" alt=""><span class="mono">ANALISMARKET+</span><span class="km-aktif"><i></i>${AKUN.sisa} hari lagi</span></div>
        <div class="harga-plus">${rp(50000)} <small>/ 30 hari</small></div>
        <div class="km-bawah"><div><small>Sekali bayar · tanpa potong otomatis</small><b>Berlaku sampai ${tglPanjang(AKUN.berakhir)}</b></div></div></div>
      ${seksi('PILIH MASA AKTIF', '', true)}
      <div class="paket">${paket.map(([b, h], i) => { const hemat = Math.round((1 - h / (50000 * b)) * 100); return `<div class="${i === 0 ? 'on' : ''}"><b>${b * 30} hari</b><small>${rp(h)}</small><small class="${hemat ? 'hemat' : ''}">${hemat ? `hemat ${hemat}%` : 'mulai di sini'}</small></div>`; }).join('')}</div>
      ${seksi('CARA BAYAR', '', true)}
      <div class="grup kaca">${br({ ikon: 'kirim', judul: 'Lewat bot Telegram', sub: 'Satu-satunya jalur yang aktif', kanan: '<span class="radio on"></span>' })}${br({ ikon: 'hp', ikKelas: 'netral', judul: 'Pembelian dalam app', sub: 'Belum tersedia', kanan: '<span class="radio"></span>' })}</div>
      ${seksi('RINCIAN', '', true)}
      <div class="grup kaca" style="padding:6px 14px"><div class="kv"><span>AnalisMarket+ · 1 bulan</span><b>${rp(50000)}</b></div><div class="kv"><span>PPN</span><b>Termasuk</b></div><div class="kv"><span style="color:var(--text);font-weight:600">Total</span><b>${rp(50000)}</b></div></div>
      <span class="btn mati penuh" style="margin-top:12px">${ik('kirim')}Kirim /plus ke @analismarketbot</span>
      <p class="catat">App ini tidak memproses pembayaran.</p>
    </div>`, { bilah: 'plus', cahaya: 'dua' });
}

/* 23 · Profil */
function sProfil() {
  return hp(`
    ${nav('Profil')}
    <div class="identitas"><div class="ava besar">${AKUN.inisial}</div><b>${AKUN.nama}</b><em>Tersambung lewat Telegram</em><span class="chip besar am">${ik('plus')}AnalisMarket+ aktif</span></div>
    <div class="isi">
      <div class="stat3"><div class="kaca"><b>h4</b><small>Timeframe</small></div><div class="kaca"><b>${PANTAUAN.length}/${AKUN.maks}</b><small>Pantauan</small></div><div class="kaca"><b class="amber">${AKUN.sisa}</b><small>Hari AM+</small></div></div>
      ${seksi('BAWAAN SAAT APP DIBUKA', '', true)}
      <div class="grup kaca">${br({ judul: 'Pasar', kanan: `<span class="nilai" style="display:flex;align-items:center;gap:6px">${lambang('BTCUSDT', 18)}BTCUSDT</span>`, panah: true })}${br({ judul: 'Mesin', kanan: nilai(MU), panah: true })}</div>
      ${seksi('AKUN', '', true)}
      <div class="grup kaca">
        ${br({ ikon: 'plus', judul: 'Kelola langganan', kanan: nilai('aktif', 'amber'), panah: true })}
        ${br({ ikon: 'kilat', judul: 'Kabar otomatis &amp; jam sunyi', kanan: nilai('aktif'), panah: true })}
        ${br({ ikon: 'keluar', ikKelas: 'netral', judul: 'Putuskan sambungan Telegram' })}
        ${br({ ikon: 'hapus', ikKelas: 'merah', judul: 'Hapus akun', kanan: nilai('permanen'), kelas: 'merah', panah: true })}
      </div>
    </div>`, { bilah: 'home', cahaya: 'dua' });
}

/* 24 · Pengaturan */
function sPengaturan() {
  return hp(`
    ${nav('Pengaturan')}
    <div class="isi">
      ${seksi('TIMEFRAME BAWAAN', '', true)}
      <div class="seg kaca">${['m15', 'm30', 'h1', 'h4', 'd1'].map((t) => `<span class="${t === 'h4' ? 'on' : ''}">${t}</span>`).join('')}</div>
      <p class="catat" style="text-align:left;padding:8px 4px 0">m1 dan m5 tidak ditawarkan sebagai bawaan: sesudah biaya dihitung, nyaris tidak ada setup di sana yang layak.</p>
      ${seksi('CHART', '', true)}
      <div class="grup kaca">${br({ ikon: 'lapis', judul: 'Lapisan bawaan', sub: 'volume · zona · struktur · level' })}${br({ ikon: 'matahari', judul: 'Tetap menyala saat chart terbuka', kanan: saklar(false) })}</div>
      ${seksi('NOTIFIKASI', '', true)}
      <div class="grup kaca">${br({ ikon: 'kabar', judul: 'Kabar di HP ini', sub: 'Telegram jadi cadangan saat HP tidak terdaftar', kanan: saklar(true) })}</div>
      ${seksi('TAMPILAN', '', true)}
      <div class="grup kaca">
        <div class="br"><span class="ik">${ik('bulan')}</span><div class="tx"><b>Tema</b></div><div class="seg" style="padding:0;gap:3px"><span class="on" style="padding:6px 10px">Gelap</span><span style="padding:6px 10px">Terang</span><span style="padding:6px 10px">Sistem</span></div></div>
        ${br({ ikon: 'info', ikKelas: 'netral', judul: 'Bahasa', kanan: nilai('Indonesia') })}
        ${br({ ikon: 'jam', ikKelas: 'netral', judul: 'Zona waktu', kanan: nilai('WIB') })}
      </div>
      <p class="catat">Disimpan di perangkat ini saja — termasuk tema dan notifikasi. Pantauan dan langganan ikut akunmu.</p>
    </div>`, { bilah: 'home', cahaya: 'redup' });
}

/* 25 · Tautkan Telegram (akun Google) */
function sTautkan() {
  return hp(`
    ${nav('Sambungkan Telegram')}
    <div class="identitas" style="padding-top:0"><div class="ava besar" style="background:linear-gradient(145deg,#8FE7C6,#10B981)">R</div><b>Rina</b><em>Masuk dengan Google · AnalisMarket+</em></div>
    <div class="isi">
      <div class="grup kilap" style="padding:16px;border-radius:22px">
        <div style="display:flex;align-items:center;gap:12px"><span class="ik">${ik('kirim')}</span><div><b style="font-size:15px;font-weight:600;display:block">Telegram</b><em style="font-style:normal;font-size:12px;color:var(--amber);font-weight:600">Opsional</em></div></div>
        <p style="font-size:13px;color:var(--muted);line-height:1.5;margin-top:10px">Kabar sudah jalan lewat notifikasi HP; Telegram jadi cadangan dan pintu ke bot.</p>
        <span class="btn amber penuh" style="margin-top:12px">${ik('kirim')}Buka Telegram untuk menautkan</span>
        <p class="catat" style="padding:10px 0 0">Telegram terbuka di bot @analismarketbot, tekan Start — selesai. Kembali ke app, statusnya ikut berubah.</p>
      </div>
      ${seksi('YANG TERBUKA SEKARANG', '', true)}
      <div class="grup kaca">
        ${br({ ikon: 'mata', judul: 'Pantauan', sub: '10 pantauan, dikabari ke HP ini saat syarat setup lolos' })}
        ${br({ ikon: 'kilat', judul: 'Kabar otomatis', sub: 'Bagian dari AnalisMarket+, terbuka di akunmu' })}
        ${br({ ikon: 'gear', judul: 'Setelan bawaan', sub: 'Pasar, timeframe, dan mesin tersimpan di HP ini' })}
      </div>
      <span class="btn garis penuh" style="margin-top:12px">Keluar dari akun Google</span>
    </div>`, { bilah: 'home', cahaya: 'redup' });
}

/* 26 · Hapus akun */
function sHapus() {
  return hp(`
    ${nav('Profil')}
    <div class="identitas"><div class="ava besar">${AKUN.inisial}</div><b>${AKUN.nama}</b><em>Tersambung lewat Telegram</em></div>
    <div class="tirai" style="background:rgba(5,4,3,.7)"></div>
    <div class="dialog">
      <span class="ik merah">${ik('hapus')}</span>
      <h3>Hapus akun?</h3>
      <p>Akun, sambungan, pantauan, kabar, perangkat, dan setelan dihapus seketika dan tidak bisa dikembalikan.</p>
      <div class="daftar-hapus">${[`${PANTAUAN.length} pantauan`, `${KO_NYALA} kabar otomatis`, 'AnalisMarket+ (' + AKUN.sisa + ' hari)', '1 perangkat'].map((x) => `<span class="chip">${x}</span>`).join('')}</div>
      <p style="font-size:11.5px;color:var(--samar)">Catatan pembayaran disimpan tanpa identitas selama diwajibkan hukum.</p>
      <div class="tombol-d"><span class="btn bahaya penuh">${ik('hapus')}Hapus akun</span><span class="btn kaca penuh">Batal</span></div>
    </div>`, { bilah: 'home', cahaya: 'redup' });
}

/* 27 · Tentang */
function sTentang() {
  const kripto = D.pasar.filter((p) => p.jenis === 'kripto').length;
  const lain = D.pasar.length - kripto;
  return hp(`
    ${nav('Tentang')}
    <div class="tentang-id"><img src="aset/mark.png" alt=""><b>Analis<span>Market</span></b><code>v1.0.0 · aabea88</code><p>Analisa teknikal otomatis untuk ${D.pasar.length} pasar. Bukan nasihat investasi, dan tidak menjanjikan hasil apa pun.</p></div>
    <div class="isi">
      ${seksi('SUMBER DATA', '', true)}
      <div class="grup kaca">${br({ ikon: 'tren', judul: 'Binance', sub: 'kripto', kanan: nilai(`${kripto} pasar`) })}${br({ ikon: 'tren', judul: 'Twelve Data', sub: 'emas &amp; forex', kanan: nilai(`${lain} pasar`) })}</div>
      ${seksi('CARA KERJANYA', '', true)}
      <div class="grup kaca">
        ${[['1.300 lilin dibaca tiap kali', 'Indikator butuh riwayat panjang supaya angkanya konvergen.'], ['Lima mesin, satu muatan', 'Semua mesin dibaca sekaligus dari satu panggilan.'], ['RR yang dicetak RR bersih', 'Spread dan slippage dipotong dulu. 1:2 di kartu berarti 1:2 sesudah biaya.'], ['Angka ditahan kalau tidak jujur', 'Kalau imbalan tidak sepadan dengan risikonya, Entry/SL/TP tidak dicetak.']].map(([j, s], i) => `<div class="cara"><span class="n">0${i + 1}</span><div><b>${j}</b><em>${s}</em></div></div>`).join('')}
      </div>
      <div class="grup kaca" style="margin-top:12px">${br({ ikon: 'kirim', ikKelas: 'netral', judul: 'Bot Telegram', kanan: nilai('@analismarketbot') })}</div>
    </div>`, { bilah: 'home', cahaya: '' });
}

/* 28 · Dokumen (Kebijakan Privasi) */
function sDokumen() {
  const bagian = [
    ['Yang kami simpan.', 'Dari Telegram: id numerik, nama tampilan, username. Dari Google: alamat email dan nama. Selain itu: pasar yang kamu buka, pantauan yang kamu pasang, dan status langgananmu.'],
    ['Yang tidak kami minta.', 'Kami tidak pernah meminta kunci API bursa, akses akun trading, maupun data kartu. App ini belum memproses pembayaran apa pun.'],
    ['Kenapa email Google.', 'Hanya untuk mengenali akun yang sama saat kamu masuk lagi. Kami tidak mengirim email pemasaran.'],
    ['Menghapus akun.', 'Dari app (Profil → Hapus akun), dari situs web, atau lewat bot. Riwayat pembayaran disimpan selama diwajibkan hukum.'],
    ['Pihak ketiga.', 'Telegram, Google, dan penyedia data pasar. Kami tidak menjual data ke siapa pun.'],
  ];
  return hp(`
    ${nav('Kebijakan Privasi', 'Berlaku sejak 10 September 2026', '', true)}
    <div class="isi">
      <div class="grup kaca">${bagian.map(([j, s], i) => `<div class="dok"><b><span>${i + 1}</span>${j}</b><p>${s}</p></div>`).join('')}</div>
      <div class="grup kaca" style="margin-top:12px;padding:12px 14px"><b style="font-size:13px">Berlaku untuk</b><p style="font-size:12px;color:var(--muted);line-height:1.5;margin-top:4px">Bot Telegram, situs web, dan app ini — satu dokumen untuk ketiganya.</p></div>
    </div>`, { bilah: 'home', cahaya: 'redup' });
}

/* ═════════════════════ PAPAN ═════════════════════ */
const PAPAN = [
  { no: '1 / 7', judul: 'Masuk &amp; beranda', ket: 'Layar masuk memakai <b>chart BTCUSDT h1 asli</b> di belakang kacanya. Tab "Lainnya" diganti Akademi; isinya pindah ke Menu dari avatar.', layar: [
    ['01', 'Masuk', sMasuk, 'Chart & pita mesin di belakang kaca = bacaan BTCUSDT h1 saat ini. <i>Tombol utama tidak pernah mati.</i>'],
    ['02', 'Masuk lewat Telegram', sMasukTelegram, 'Tiga langkah yang sama dengan FormulirSambung, plus blok nama bot yang bisa disalin.'],
    ['03', 'Home', sHome, `Kartu utama = BTCUSDT h4 · ${MU} dari setelan, angka & sparkline dari bacaan asli.`],
    ['04', 'Menu (dulu tab Lainnya)', sMenu, 'Dibuka dari avatar. Jam "data terakhir masuk" = waktu data diambil.'],
    ['05', 'Kabar', sKotakMasuk, 'Keadaan pantauan dari bacaan asli; riwayat kotak masuk contoh. <i>Saringan "Otomatis" ditambahkan.</i>'],
  ] },
  { no: '2 / 7', judul: 'Pasar', ket: `Chart = <b>/chart-embed asli</b> (URL yang sama dengan app), bacaan BTCUSDT h4 dari jawaban yang dipakai chart itu, jadi harga di kepala dan di chart sama: <b>${harga('BTCUSDT', HARGA_BTC)}</b>.`, layar: [
    ['06', 'Pasar', sPasar, 'Pita 5 mesin dengan syarat wajib lolos/total, chart asli, ringkasan bacaan mengintip di atas bilah tab.'],
    ['07', 'Bacaan', sBacaan, 'Status rencana, biaya, syarat wajib — teks syaratnya kalimat server apa adanya.'],
    ['08', 'Bacaan · level, zona, konteks', sBacaanLanjut, 'Lembar yang sama, digulir. Zona & level milik mesin yang aktif.'],
    ['09', 'Banding mesin', sBanding, 'Lima mesin dari satu muatan, nol permintaan tambahan. Mesin tanpa angka tidak dihitung netral.'],
    ['10', 'Pilih pasar', sPilihPasar, `${D.pasar.length} pasar asli, urut volume 24 jam, lambang dari aset app (sisanya huruf berona).`],
  ] },
  { no: '3 / 7', judul: 'Akademi', ket: `Kurikulum dari <b>/api/saya/akademi</b>: ${D.akademi.bab.length} bab, ${D.akademi.jumlah.video} pelajaran, ${D.akademi.jumlah.tersedia} sudah tayang, sampul studio asli. Kemajuan contoh: 01–03 selesai, 04 sedang.`, layar: [
    ['11', 'Akademi', sAkademi, 'Tab baru. Bab yang belum tayang disebut "segera tayang", judul bab terkunci tetap terbaca.'],
    ['12', 'Isi bab', sBab, 'Sepuluh video Bab 1 dengan keadaan asli: tayang / segera, plus kemajuan di perangkat ini.'],
    ['13', 'Pelajaran', sPelajaran, '"Coba di chart" = 20 lilin terakhir BTCUSDT h1 yang asli, lilin terakhirnya dibedah.'],
    ['14', 'Istilah', sIstilah, 'Daftar 16 istilah lama tetap ada, sekarang di bawah Akademi.'],
  ] },
  { no: '4 / 7', judul: 'Pantau &amp; kabar', ket: 'Pasangan pantauan contoh, tapi <b>keadaan tiap baris dari bacaan asli</b>. Kalender = <b>/api/jadwal-berita</b> apa adanya.', layar: [
    ['15', 'Pantauan', sPantauan, 'Tiap pantauan menampilkan keadaannya sekarang — satu bacaan per baris, lewat antrean & cache 20 dtk.'],
    ['16', 'Pantauan baru', sPantauBaru, 'Keadaan sekarang ditampilkan sebelum disimpan. Pemicu kedua & ketiga ditandai "menyusul".'],
    ['17', 'Kabar otomatis', sKabarOtomatis, 'Satu baris per pasangan (timeframe, mesin), nama mesin dari katalog server.'],
    ['18', 'Kalender berita', sKalender, `Rilis berikutnya: ${D.jadwal[0]?.nama ?? '—'}. Dampak = bentuk dan warna sekaligus.`],
  ] },
  { no: '5 / 7', judul: 'AnalisMarket+', ket: 'Cek banyak = <b>12 bacaan h1 asli</b>, dipilih dengan urutan terbaik() app. Harga paket = PAKET_PLUS bot, <b>hanya di build tautan unduhan</b>.', layar: [
    ['19', 'PLUS+ · pelanggan', sPlus, 'Kartu member: sisa hari, cincin masa aktif, fitur yang sedang jalan.'],
    ['20', 'PLUS+ · akun gratis (build Play)', sPlusGratis, 'Tanpa harga dan tanpa jalan beli, sesuai kebijakan pembayaran Play.'],
    ['21', 'Cek banyak', sCekBanyak, 'EUR/USD "tidak terbaca" karena memang tidak punya h1 — persis jawaban server.'],
    ['22', 'Berlangganan (build tautan)', sBerlangganan, 'Empat masa aktif dari PAKET_PLUS. Di build Play layar ini cuma status.'],
  ] },
  { no: '6 / 7', judul: 'Akun', ket: 'Panah › hanya di baris yang membuka sesuatu. Baris tampilan (Bahasa, Zona waktu) tanpa panah.', layar: [
    ['23', 'Profil', sProfil, 'Identitas, tiga angka akun, bawaan saat app dibuka, dan pintu akun.'],
    ['24', 'Pengaturan', sPengaturan, '"Lapisan bawaan" sekarang menyebut struktur, yang memang menyala sejak awal.'],
    ['25', 'Tautkan Telegram (akun Google)', sTautkan, 'Untuk orang yang masuk lewat Google; Telegram opsional.'],
    ['26', 'Hapus akun', sHapus, 'Dialog menyebut apa saja yang ikut terhapus, dengan angka dari akun itu.'],
  ] },
  { no: '7 / 7', judul: 'Info &amp; keadaan', ket: 'Termasuk keadaan yang paling mahal kalau salah: <b>angka lama yang terlihat seperti angka baru</b>.', layar: [
    ['27', 'Tentang', sTentang, `Jumlah pasar dihitung dari /api/pasar (${D.pasar.length}), bukan diketik.`],
    ['28', 'Kebijakan Privasi', sDokumen, 'Bagian "Menghapus akun" disesuaikan dengan jalur hapus di app (sekarang masih "lewat bot").'],
    ['29', 'Home · gagal menyegarkan', () => sHome(true), 'Pita basi dengan jam terakhir diperbarui; kartu utama diredupkan. "Coba lagi" karena sebabnya jaringan.'],
  ] },
];

const akar = document.body;
const semuaHp = [];
for (const p of PAPAN) {
  const sel = p.layar.map(([no, nama, f, ket]) => { const html = f(); semuaHp.push([no, nama, html]); return `<div class="sel">${html}<div class="cap"><small>${no}</small><b>${nama}</b><p>${ket}</p></div></div>`; }).join('');
  akar.insertAdjacentHTML('beforeend', `<section class="papan-s"><div class="kp"><div><div class="no">BAGIAN ${p.no}</div><h2>${p.judul}</h2></div><p>${p.ket}</p></div><div class="deret">${sel}</div>
    <div class="kaki-papan"><span><b>Data asli</b> diambil ${tglPendek(NOW)} · ${jam(NOW)} WIB dari analismarket.com</span><span><b>Akun contoh:</b> ${AKUN.nama}, AnalisMarket+ ${AKUN.sisa} hari</span></div></section>`);
}
akar.insertAdjacentHTML('beforeend', `<section class="lembar-kontak" id="kontak"><div class="mono amber" style="font-size:12px;letter-spacing:.22em">ANALISMARKET APP · SEMUA LAYAR · ${tglPendek(NOW).toUpperCase()}</div>
  <h1 style="margin-top:14px">29 layar, satu bahasa kaca,<br><span>data hari ini.</span></h1>
  <p class="sub">Pasar, bacaan mesin, chart, kalender, dan Akademi diambil dari produksi pada ${jam(NOW)} WIB. Data akun (nama, pantauan, kotak masuk) contoh, karena milik orang.</p>
  <div class="kisi-kontak">${semuaHp.map(([no, nama, html]) => `<div class="k"><div class="bk">${html}</div><div><small>${no}</small><b>${nama}</b></div></div>`).join('')}</div></section>`);
document.fonts.ready.then(() => { document.body.dataset.siap = '1'; });
