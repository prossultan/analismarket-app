/**
 * `/api/saya/*` — FITUR AKUN, lewat sesi yang sudah ditukar di `sesi.ts`.
 *
 * TIDAK lewat antrean `ambil()`, dan itu disengaja: rute-rute ini di luar zona
 * pembatas laju `apibacaan` (yang dikunci alamat IP dan dibagi seluruh
 * pengguna CGNAT), sementara rute akun dikunci SESI. Menyalurkannya lewat
 * antrean yang sama berarti permintaan pribadi ikut menunggu giliran di
 * belakang permintaan publik orang lain.
 *
 * SATU PINTU untuk 401. Sesi kedaluwarsa atau dicabut menjawab 401 di rute
 * mana pun; kalau tiap layar menanganinya sendiri, satu layar akan lupa dan
 * menampilkan "gagal" untuk keadaan yang sebenarnya "silakan sambung ulang".
 * Di sini 401 MENGHAPUS sesi dan menjawab `jenis: 'sesi'`.
 */
import { ASAL } from './antrian';
import { hapusSesi, headerSesi, sesiSekarang } from './sesi';

export type JawabanSaya<T> =
  | { ok: true; isi: T }
  /** `sesi` = harus sambung ulang · `plus` = butuh AM+ · sisanya apa adanya. */
  | { ok: false; jenis: 'sesi' | 'plus' | 'batas' | 'jaringan' | 'lain'; kalimat: string };

const BATAS_MS = 15_000;

async function panggil<T>(jalur: string, metode: 'GET' | 'POST', badan?: unknown): Promise<JawabanSaya<T>> {
  if (sesiSekarang() === null) {
    return { ok: false, jenis: 'sesi', kalimat: 'Belum tersambung ke akun Telegram.' };
  }
  const henti = new AbortController();
  const jam = setTimeout(() => { henti.abort(); }, BATAS_MS);
  try {
    const res = await fetch(`${ASAL}${jalur}`, {
      method: metode,
      headers: { ...headerSesi(), ...(metode === 'POST' ? { 'content-type': 'application/json' } : {}) },
      body: metode === 'POST' ? JSON.stringify(badan ?? {}) : undefined,
      signal: henti.signal,
    });

    if (res.status === 401) {
      /* Sesi mati. Dibuang di sini supaya seluruh app sepakat dalam satu tarikan. */
      await hapusSesi();
      return { ok: false, jenis: 'sesi', kalimat: 'Sesi sudah habis. Sambungkan ulang lewat bot.' };
    }
    const isi = (await res.json().catch(() => ({}))) as T & { galat?: string; pesan?: string };
    if (res.status === 402) {
      return { ok: false, jenis: 'plus', kalimat: isi.pesan ?? 'Fitur ini bagian dari AnalisMarket+.' };
    }
    if (res.status === 429) {
      return { ok: false, jenis: 'batas', kalimat: isi.pesan ?? 'Jatah hari ini sudah habis.' };
    }
    if (!res.ok) {
      return { ok: false, jenis: 'lain', kalimat: isi.pesan ?? isi.galat ?? 'Permintaan ditolak.' };
    }
    return { ok: true, isi: isi as T };
  } catch {
    return { ok: false, jenis: 'jaringan', kalimat: 'Tidak bisa menghubungi server.' };
  } finally {
    clearTimeout(jam);
  }
}

/* ── Bentuk jawaban, disalin dari `src/lib/api-saya.ts` di bot ─────────── */

export type Ringkas = {
  telegramTersambung: boolean;
  langganan: 'plus' | 'gratis';
  sisaHariPlus: number;
  plusBerakhirPada: number | null;
  poin: number;
  pantauanAktif: number;
  maksPantauan: number;
  setelan: { pair: string; tf: string; strategi: string | null } | null;
};

export type Pantauan = {
  id: number; pair: string; tf: string; aktif: boolean;
  strategi: string | null; strategiKode: string | null;
  jamMulai: number | null; jamSelesai: number | null; dibuat: string;
};
export type DaftarPantauan = { maks: number; minPoin: number; pantauan: Pantauan[] };

export type KabarOtomatis = {
  plus: boolean;
  dipilih: { tf: string; mesin: string }[];
  irama: string;
  jam: { mulai: number; selesai: number } | null;
  pilihanJam: number[];
  tfTersedia: { tf: string; mesin: { kode: string; nama: string }[] }[];
};

export type Kredit = {
  poin: number; poinPerAnalisa: number; minPoinNotifikasi: number;
  paket: { nama: string; poin: number; harga: number }[];
  riwayat: { delta: number; sebab: string; pada: string }[];
  topupDiBot: boolean;
};

/* `/api/saya/plus` TIDAK dipakai app, dan tipenya sempat dideklarasikan salah
   di sini — `aktif` dan `harga`, padahal server mengirim `plus`, `sisaHari`,
   `telegramTersambung`, dan `paket[]`. Tipe yang salah atas fungsi yang tidak
   pernah dipanggil tidak bisa ditemukan siapa pun; dibuang, bukan ditambal.
   Status AM+ datang dari `ambilRingkas().langganan`, satu sumber. */
export const ambilRingkas = (): Promise<JawabanSaya<Ringkas>> => panggil('/api/saya', 'GET');
export const ambilPantauan = (): Promise<JawabanSaya<DaftarPantauan>> => panggil('/api/saya/pantauan', 'GET');
export const ambilKabarOtomatis = (): Promise<JawabanSaya<KabarOtomatis>> => panggil('/api/saya/kabar-otomatis', 'GET');
export const ambilKredit = (): Promise<JawabanSaya<Kredit>> => panggil('/api/saya/kredit', 'GET');

export const tambahPantauan = (b: { pair: string; tf: string; strategi?: string }): Promise<JawabanSaya<unknown>> =>
  panggil('/api/saya/pantauan/tambah', 'POST', b);
export const matikanPantauan = (id: number): Promise<JawabanSaya<unknown>> =>
  panggil('/api/saya/pantauan/matikan', 'POST', { id });
export const setelJamKabar = (mulai: number, selesai: number): Promise<JawabanSaya<unknown>> =>
  panggil('/api/saya/kabar-otomatis/jam', 'POST', { mulai, selesai });
/**
 * Dua bentuk, dan server memang menerima dua: satu pasangan (tf, mesin), atau
 * `{ semua: false }` yang mematikan seluruhnya. TIDAK ADA `{ semua: true }` —
 * menyalakan selalu satu per satu, karena "nyalakan semua" berarti memilihkan
 * mesin untuk tiap timeframe, dan itu memilih diam-diam untuk orang lain.
 */
export const setelKabarOtomatis = (
  b: { tf: string; mesin: string; aktif: boolean } | { semua: false },
): Promise<JawabanSaya<unknown>> => panggil('/api/saya/kabar-otomatis/setel', 'POST', b);
export const cekBanyak = (pasar: string[], tf: string): Promise<JawabanSaya<unknown>> =>
  panggil('/api/saya/cek-banyak', 'POST', { pasar, tf });
