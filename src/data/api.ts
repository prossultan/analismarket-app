/**
 * Bentuk jawaban bot, diketik ulang dari `src/lib/api-bacaan.ts` dan
 * `src/lib/api-pasar.ts` di repo bot. Medan yang bertanda `?` memang DIHILANG
 * KAN endpoint saat tidak ada — bukan dikirim sebagai null.
 */
import { ambil, type Jawaban } from './antrian';

export type Pasar = {
  simbol: string;
  label: string;
  kategori: string;
  jenis: string;
  penyedia: string;
  tfMinimum: string;
  timeframes: string[];
  desimal: number;
  volume24hUsd: number;
  /** null = BELUM DIKETAHUI. Emas dan forex selalu null di sini. Jangan diganti angka. */
  harga: number | null;
  ubah24hPersen: number | null;
};

export type Syarat = { kode: string; nama: string; lolos: boolean; wajib: boolean; kalimat: string };
export type Zona = { atas: number; bawah: number; peran: string; teks: string; gaya?: string; terpilih?: boolean };
export type Level = { harga: number; peran: string; kode?: string; diLuarJangkauan: boolean };

export type Mesin = {
  mesin: string;
  keputusan: { kode: string; label: string; alasan: string };
  setup?: { id: string; keadaan: string; berlakuSampai: number | null };
  status: string;
  /** Kata dari endpoint. App TIDAK PERNAH memetakannya ke makna — lihat `arahTurun`. */
  arah: string;
  sebabTanpaAngka?: string;
  entry?: number;
  sl?: number;
  tp?: number;
  biayaPorsi: number | null;
  rr: number;
  rrBersih: number;
  jarakEntryAtr: number | null;
  syarat: Syarat[];
  zona: Zona[];
  level: Level[];
  konteksAtas: string;
  htfBias: string;
  htfTimeframe: string | null;
  caraMasuk: string | null;
  atr: number;
};

export type Lilin = { waktu: number; buka: number; tinggi: number; rendah: number; tutup: number; volume: number };

export type Bacaan = {
  pasar: string;
  tf: string;
  harga: number;
  hargaWaktu: number | null;
  lilinTerakhir: number;
  pasarTutupAlasan: string | null;
  pasarBukaLagi: number | null;
  /** 300 lilin tertutup, tertua dulu. Sparkline Home memakai 48 terakhir. */
  lilin: Lilin[];
  mesin: Mesin[];
};

export type Rilis = { waktu: number; kode: string; nama: string; acara: string; dampak: 'tinggi' | 'sedang' };

export function ambilPasar(segarkan = false): Promise<Jawaban<{ pasar: Pasar[]; pada: number }>> {
  return ambil('pasar', '/api/pasar', segarkan);
}

export function ambilBacaan(pasar: string, tf: string, segarkan = false): Promise<Jawaban<Bacaan>> {
  const jalur = `/api/bacaan?pasar=${encodeURIComponent(pasar)}&tf=${encodeURIComponent(tf)}`;
  return ambil(`bacaan:${pasar}:${tf}`, jalur, segarkan);
}

export function ambilJadwal(hari: number, segarkan = false): Promise<Jawaban<{ rilis: Rilis[] }>> {
  return ambil(`jadwal:${String(hari)}`, `/api/jadwal-berita?hari=${String(hari)}`, segarkan);
}

/**
 * ARAH DITENTUKAN ANGKA, BUKAN KATA.
 *
 * `arah` dari endpoint dicetak apa adanya; yang menentukan WARNANYA adalah
 * letak SL terhadap entry. Aturan ini diambil dari web, tempat penjaga
 * kosakata melarang kata arah diketik di kode sama sekali — supaya tidak ada
 * dua tempat yang bisa berbeda pendapat tentang arti satu kata.
 *
 * Tanpa angka rencana, tidak ada yang bisa disimpulkan, dan katanya netral.
 */
export function arahTurun(m: Mesin): boolean | null {
  if (m.entry === undefined || m.sl === undefined) return null;
  return m.sl > m.entry;
}

/** Hanya syarat WAJIB. Bonus disaring supaya hitungan "n dari sekian" sama dengan kartu bot. */
export function syaratWajib(m: Mesin): Syarat[] {
  return m.syarat.filter((s) => s.wajib);
}
