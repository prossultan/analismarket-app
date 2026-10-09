/**
 * AKADEMI — kontrak `/api/saya/akademi` (dibaca dari repo web,
 * `analismarket-web/src/data/akademi.ts`, yang membacanya dari bot).
 *
 *   GET /api/saya/akademi              → kurikulum + akses peminta
 *   GET /api/saya/akademi/putar?id=…   → 200 {url} · 402 {galat: perlu-plus | perlu-penuh}
 *                                         · 404 {galat: segera | tidak-ada}
 *
 * Bearer ikut kalau ada sesi (pelanggan AM+ dapat Bab 2–3). Alamat video
 * WAJIB satu asal dengan analismarket.com: yang lain ditolak di sini,
 * bukan dibiarkan gagal diam-diam di pemutar.
 *
 * KEMAJUAN DI PERANGKAT INI, seperti web ("tersimpan di perangkat ini").
 * Sinkron antar-HP butuh endpoint yang belum ada; tidak dipura-purakan.
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ASAL } from './antrian';
import { hapusSesi, headerSesi } from './sesi';
import { alamatBunny } from './pemutar';
import type { Hasil } from './muat';

export type TierAkademi = 'gratis' | 'plus' | 'penuh';
export type SampulAkademi = { kecil: string; besar: string };
export type VideoAkademi = {
  id: string; no: number; judul: string; ringkas: string;
  /** Menit; null = belum diketahui (biasanya video yang belum jadi). */
  menit: number | null;
  /** Videonya sudah diproduksi. false = "Segera". */
  tersedia: boolean;
  /** Peminta boleh memutarnya. false = terkunci. */
  terbuka: boolean;
  sampul: SampulAkademi | null;
};
export type BabAkademi = { n: number; id: string; nama: string; ringkas: string; tier: TierAkademi; terbuka: boolean; video: VideoAkademi[] };
export type Akademi = {
  akses: { masuk: boolean; plus: boolean; penuh: boolean };
  harga: { penuhRp: number; penuhTersedia: boolean };
  jumlah: { video: number; tersedia: number };
  bab: BabAkademi[];
};

const BATAS_MS = 12_000;

async function minta(jalur: string): Promise<{ status: number; badan: unknown } | null> {
  const henti = new AbortController();
  const jam = setTimeout(() => { henti.abort(); }, BATAS_MS);
  try {
    const res = await fetch(`${ASAL}${jalur}`, { headers: await headerSesi(), signal: henti.signal });
    const badan = (await res.json().catch(() => null)) as unknown;
    return { status: res.status, badan };
  } catch {
    return null;
  } finally { clearTimeout(jam); }
}

/* ── penguraian ketat: bentuk yang meleset = galat, bukan layar setengah ── */
const obj = (x: unknown): Record<string, unknown> | null => (x !== null && typeof x === 'object' && !Array.isArray(x) ? x as Record<string, unknown> : null);
const teks = (x: unknown): string | null => (typeof x === 'string' ? x : null);
const angkaAtauNull = (x: unknown): number | null => (typeof x === 'number' && Number.isFinite(x) ? x : null);

function uraiVideo(x: unknown): VideoAkademi | null {
  const o = obj(x); if (o === null) return null;
  const id = teks(o.id); const judul = teks(o.judul); const no = angkaAtauNull(o.no);
  if (id === null || judul === null || no === null) return null;
  const s = obj(o.sampul);
  const sampul = s !== null && teks(s.kecil) !== null && teks(s.besar) !== null ? { kecil: teks(s.kecil) ?? '', besar: teks(s.besar) ?? '' } : null;
  return { id, no, judul, ringkas: teks(o.ringkas) ?? '', menit: angkaAtauNull(o.menit), tersedia: o.tersedia === true, terbuka: o.terbuka === true, sampul };
}
export function uraiAkademi(x: unknown): Akademi | null {
  const o = obj(x); if (o === null || !Array.isArray(o.bab)) return null;
  const bab: BabAkademi[] = [];
  for (const b of o.bab) {
    const ob = obj(b); if (ob === null || !Array.isArray(ob.video)) return null;
    const n = angkaAtauNull(ob.n); const nama = teks(ob.nama); const tier = teks(ob.tier);
    if (n === null || nama === null || (tier !== 'gratis' && tier !== 'plus' && tier !== 'penuh')) return null;
    const video = ob.video.map(uraiVideo);
    if (video.some((v) => v === null)) return null;
    bab.push({ n, id: teks(ob.id) ?? String(n), nama, ringkas: teks(ob.ringkas) ?? '', tier, terbuka: ob.terbuka === true, video: video as VideoAkademi[] });
  }
  const ak = obj(o.akses); const hg = obj(o.harga); const jm = obj(o.jumlah);
  const semua = bab.flatMap((b) => b.video);
  return {
    akses: { masuk: ak?.masuk === true, plus: ak?.plus === true, penuh: ak?.penuh === true },
    harga: { penuhRp: angkaAtauNull(hg?.penuhRp) ?? 0, penuhTersedia: hg?.penuhTersedia === true },
    jumlah: { video: angkaAtauNull(jm?.video) ?? semua.length, tersedia: angkaAtauNull(jm?.tersedia) ?? semua.filter((v) => v.tersedia).length },
    bab,
  };
}

/* Simpanan satu menit: tiga layar (daftar, bab, pelajaran) membaca muatan
   yang sama, dan berpindah di antaranya tidak boleh memuat ulang. */
let simpanan: { pada: number; isi: Akademi } | null = null;

export async function ambilAkademi(segarkan = false): Promise<Hasil<Akademi>> {
  if (!segarkan && simpanan !== null && Date.now() - simpanan.pada < 60_000) return { ok: true, isi: simpanan.isi };
  const h = await minta('/api/saya/akademi');
  if (h === null) return { ok: false, jenis: 'jaringan', kalimat: 'Tidak bisa menghubungi server.' };
  if (h.status === 401) {
    /* Sesi mati — satu pintu dengan saya.ts: dibuang, gerbang kembali ke layar masuk. */
    await hapusSesi();
    return { ok: false, jenis: 'sesi', kalimat: 'Sesi sudah habis. Sambungkan ulang lewat bot.' };
  }
  if (h.status === 429) return { ok: false, jenis: 'batas', kalimat: 'Terlalu banyak permintaan. Coba lagi sebentar lagi.' };
  if (h.status < 200 || h.status >= 300) return { ok: false, jenis: 'lain', kalimat: `Akademi belum bisa dimuat (kode ${String(h.status)}).` };
  const isi = uraiAkademi(h.badan);
  if (isi === null) return { ok: false, jenis: 'lain', kalimat: 'Jawaban Akademi tidak terbaca.' };
  simpanan = { pada: Date.now(), isi };
  return { ok: true, isi };
}

export type HasilPutar =
  | { keadaan: 'ada'; url: string; jenis: 'mp4' | 'iframe' }
  | { keadaan: 'terkunci'; perlu: 'plus' | 'penuh' }
  | { keadaan: 'segera' }
  | { keadaan: 'tidak-ada' }
  | { keadaan: 'galat'; kalimat: string };

/** Alamat video satu asal saja — relatif, atau absolut di analismarket.com. */
export function alamatSah(url: string): string | null {
  if (url.startsWith('/') && !url.startsWith('//')) return `${ASAL}${url}`;
  return url.startsWith('https://analismarket.com/') ? url : null;
}

export async function mintaPutar(id: string): Promise<HasilPutar> {
  /* `dukung=iframe`: app ini bisa memutar pemutar Bunny (PemutarVideo).
     Tanpa itu server tidak pernah menjawab iframe — dan video yang cuma ada
     di Bunny dialirkan lewat VPS sebagai MP4. */
  const h = await minta(`/api/saya/akademi/putar?id=${encodeURIComponent(id)}&dukung=iframe`);
  if (h === null) return { keadaan: 'galat', kalimat: 'Tidak bisa menghubungi server.' };
  const o = obj(h.badan);
  const galat = o === null ? null : teks(o.galat);
  if (h.status === 402 && (galat === 'perlu-plus' || galat === 'perlu-penuh')) return { keadaan: 'terkunci', perlu: galat === 'perlu-plus' ? 'plus' : 'penuh' };
  if (h.status === 404 && galat === 'segera') return { keadaan: 'segera' };
  if (h.status === 404 && galat === 'tidak-ada') return { keadaan: 'tidak-ada' };
  if (h.status === 401) { await hapusSesi(); return { keadaan: 'galat', kalimat: 'Sesi sudah habis. Sambungkan ulang lewat bot.' }; }
  const url = o === null ? null : teks(o.url);
  const iframe = o !== null && teks(o.jenis) === 'iframe';
  /* Iframe cuma diterima dari asal Bunny persis; MP4 cuma dari asal kita. */
  const sah = url === null ? null : iframe ? alamatBunny(url) : alamatSah(url);
  if (h.status < 200 || h.status >= 300 || sah === null) return { keadaan: 'galat', kalimat: `Video belum bisa diputar (kode ${String(h.status)}).` };
  return { keadaan: 'ada', url: sah, jenis: iframe ? 'iframe' : 'mp4' };
}

/** Sampul dari API berupa jalur relatif `/api/saya/akademi/sampul/…`. */
export function urlSampul(jalur: string | undefined): string | null {
  if (jalur === undefined || jalur === '') return null;
  return alamatSah(jalur);
}

/* ── kemajuan di perangkat ini ─────────────────────────────────────────── */

export const AMBANG_SELESAI = 0.9;
const KUNCI_KEMAJUAN = 'am:akademi:kemajuan:v1';

/** Ringkasan video terakhir — supaya kartu "Lanjut belajar" di Home tidak butuh jaringan. */
export type InfoTerakhir = { id: string; no: number; judul: string; bab: number; sampul: string | null; menit: number | null };
export type Kemajuan = {
  selesai: string[];
  terakhir: InfoTerakhir | null;
  /** Detik terakhir per video, untuk melanjutkan dari tempat yang sama. */
  posisi: Record<string, number>;
};
const KOSONG: Kemajuan = { selesai: [], terakhir: null, posisi: {} };

let kemajuan: Kemajuan = KOSONG;
let terbaca = false;
const pendengar = new Set<(k: Kemajuan) => void>();

function uraiKemajuan(t: string | null): Kemajuan {
  if (t === null) return KOSONG;
  try {
    const o = obj(JSON.parse(t) as unknown);
    if (o === null) return KOSONG;
    const selesai = Array.isArray(o.selesai) ? o.selesai.filter((x): x is string => typeof x === 'string') : [];
    const p = obj(o.posisi); const posisi: Record<string, number> = {};
    if (p !== null) for (const [k, v] of Object.entries(p)) if (typeof v === 'number' && Number.isFinite(v) && v > 0) posisi[k] = v;
    const tk = obj(o.terakhir);
    const terakhir = tk !== null && teks(tk.id) !== null && teks(tk.judul) !== null
      ? { id: teks(tk.id) ?? '', no: angkaAtauNull(tk.no) ?? 0, judul: teks(tk.judul) ?? '', bab: angkaAtauNull(tk.bab) ?? 1, sampul: teks(tk.sampul), menit: angkaAtauNull(tk.menit) }
      : null;
    return { selesai: [...new Set(selesai)], terakhir, posisi };
  } catch { return KOSONG; }
}

async function bacaKemajuan(): Promise<Kemajuan> {
  if (terbaca) return kemajuan;
  try { kemajuan = uraiKemajuan(await AsyncStorage.getItem(KUNCI_KEMAJUAN)); } catch { kemajuan = KOSONG; }
  terbaca = true;
  return kemajuan;
}
function ganti(k: Kemajuan): void {
  kemajuan = k;
  for (const f of pendengar) f(k);
  void AsyncStorage.setItem(KUNCI_KEMAJUAN, JSON.stringify(k)).catch(() => { /* penyimpanan ditolak — kemajuan sesi ini tetap terlihat */ });
}

export function useKemajuan(): Kemajuan {
  const [k, setK] = useState<Kemajuan>(kemajuan);
  useEffect(() => {
    void bacaKemajuan().then(setK);
    pendengar.add(setK);
    return () => { pendengar.delete(setK); };
  }, []);
  return k;
}

export function catatTerakhir(v: VideoAkademi, bab: number): void {
  ganti({ ...kemajuan, terakhir: { id: v.id, no: v.no, judul: v.judul, bab, sampul: v.sampul?.kecil ?? null, menit: v.menit } });
}
export function catatPosisi(id: string, detik: number, durasi: number): void {
  const selesai = Number.isFinite(durasi) && durasi > 0 && detik / durasi >= AMBANG_SELESAI;
  const k = { ...kemajuan, posisi: { ...kemajuan.posisi, [id]: Math.round(detik) } };
  ganti(selesai && !k.selesai.includes(id) ? { ...k, selesai: [...k.selesai, id] } : k);
}

export type KeadaanVideo = 'selesai' | 'sedang' | 'tersedia' | 'segera' | 'terkunci';
export function keadaanVideo(v: VideoAkademi, k: Kemajuan): KeadaanVideo {
  if (!v.terbuka) return 'terkunci';
  if (!v.tersedia) return 'segera';
  if (k.selesai.includes(v.id)) return 'selesai';
  if (k.terakhir?.id === v.id || (k.posisi[v.id] ?? 0) > 0) return 'sedang';
  return 'tersedia';
}

/** Urutan kursus menyeberang bab: video sesudah `id`, atau null di ujung. */
export function sesudah(a: Akademi, id: string): { v: VideoAkademi; bab: BabAkademi } | null {
  const semua = a.bab.flatMap((b) => b.video.map((v) => ({ v, bab: b })));
  const i = semua.findIndex((x) => x.v.id === id);
  return i < 0 ? null : semua[i + 1] ?? null;
}
export function cariVideo(a: Akademi, id: string): { v: VideoAkademi; bab: BabAkademi } | null {
  for (const b of a.bab) { const v = b.video.find((x) => x.id === id); if (v !== undefined) return { v, bab: b }; }
  return null;
}

/* ── pelajaran → chart dan istilah ─────────────────────────────────────── */

/**
 * "COBA DI CHART": pasar, timeframe, dan mesin yang memperlihatkan isi
 * pelajarannya di layar Pasar. Statis di app dulu; kalau API Akademi kelak
 * mengirim `contohChart`, peta ini pindah ke server dan ikut tiap video baru.
 * Hanya video yang punya padanan jelas di chart — tanpa entri, kartunya
 * tidak digambar (bukan kartu kosong).
 */
export type ContohChart = { pasar: string; tf: string; mesin?: string; bedah?: boolean };
export const CONTOH_CHART: Readonly<Record<string, ContohChart>> = {
  'ta-membaca-candlestick': { pasar: 'BTCUSDT', tf: 'h1', bedah: true },
  'ta-timeframe-mulai-h1': { pasar: 'BTCUSDT', tf: 'h1' },
  'ta-spread-dan-biaya': { pasar: 'BTCUSDT', tf: 'h1', mesin: 'snr' },
  'ta-volume-likuiditas': { pasar: 'BTCUSDT', tf: 'h1' },
  'ta-tur-chart-analismarket': { pasar: 'BTCUSDT', tf: 'h4', mesin: 'snr' },
  'ta-tren-naik-turun-sideways': { pasar: 'ETHUSDT', tf: 'h4' },
  'ta-swing-high-low': { pasar: 'ETHUSDT', tf: 'h4', mesin: 'fibonacci' },
  'ta-support-resistance': { pasar: 'XAU/USD', tf: 'h4', mesin: 'snr' },
  'ta-break-retest-fakeout': { pasar: 'BTCUSDT', tf: 'h1', mesin: 'snr' },
  'ta-multi-timeframe': { pasar: 'BTCUSDT', tf: 'h4' },
  'ta-ema200-ema50-200': { pasar: 'ETHUSDT', tf: 'h4', mesin: 'ema200' },
  'ta-atr-volatilitas': { pasar: 'BTCUSDT', tf: 'h1' },
  'ta-ichimoku-dasar': { pasar: 'BTCUSDT', tf: 'h4', mesin: 'ichimoku' },
  'ta-fibonacci': { pasar: 'ETHUSDT', tf: 'h4', mesin: 'fibonacci' },
  'ta-latihan-kartu-mesin': { pasar: 'BTCUSDT', tf: 'h4' },
  'ta-likuiditas': { pasar: 'BTCUSDT', tf: 'h1', mesin: 'smc' },
  'ta-bos-choch': { pasar: 'BTCUSDT', tf: 'h1', mesin: 'smc' },
  'ta-order-block': { pasar: 'BTCUSDT', tf: 'h1', mesin: 'smc' },
  'ta-fair-value-gap': { pasar: 'BTCUSDT', tf: 'h1', mesin: 'smc' },
  'ta-liquidity-sweep': { pasar: 'BTCUSDT', tf: 'h1', mesin: 'smc' },
  'ta-premium-discount': { pasar: 'BTCUSDT', tf: 'h1', mesin: 'smc' },
  'ta-setup-smc': { pasar: 'BTCUSDT', tf: 'h1', mesin: 'smc' },
  'ta-setup-snr-ema200': { pasar: 'XAU/USD', tf: 'h4', mesin: 'snr' },
};

/** Istilah yang dibahas — HANYA kode yang ada di `istilah.ts`, supaya chipnya tidak menjanjikan entri kosong. */
export const ISTILAH_VIDEO: Readonly<Record<string, readonly string[]>> = {
  'ta-spread-dan-biaya': ['biaya'],
  'ta-tur-chart-analismarket': ['setup / pantau', 'R nx / S nx'],
  'ta-swing-high-low': ['Swing'],
  'ta-support-resistance': ['R nx / S nx'],
  'ta-ema200-ema50-200': ['EMA200'],
  'ta-atr-volatilitas': ['ATR'],
  'ta-ichimoku-dasar': ['Kumo', 'Tenkan / Kijun / Chikou'],
  'ta-fibonacci': ['Retracement'],
  'ta-latihan-kartu-mesin': ['setup / pantau', 'biaya'],
  'ta-likuiditas': ['SWEEP'],
  'ta-bos-choch': ['BOS', 'CHoCH'],
  'ta-order-block': ['OB', 'termitigasi'],
  'ta-fair-value-gap': ['FVG'],
  'ta-liquidity-sweep': ['SWEEP'],
  'ta-premium-discount': ['TENGAH'],
  'ta-sl-struktur-atr': ['ATR', 'Swing'],
  'ta-tp-rr-bersih': ['biaya'],
  'ta-biaya-slippage-funding': ['biaya'],
};
