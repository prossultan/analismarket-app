/**
 * SESI AKUN — satu-satunya tempat app menyimpan identitas.
 *
 * Jalurnya SUDAH ADA di server dan tidak perlu satu pun perubahan bot:
 *
 *   1. Bot menerbitkan token sekali pakai (32 byte base64url, umur 10 menit)
 *      dan mengirimnya sebagai tombol `https://analismarket.com/?masuk=<token>`.
 *   2. `POST /api/sambung/masuk {token}` menukarnya dengan SESI (umur 12 jam)
 *      — dan di situ gerbang wajib-gabung ikut diperiksa, sama seperti web.
 *   3. `Authorization: Bearer <sesi>` membuka 15 rute `/api/saya/*`.
 *
 * Yang hilang cuma sisi app, dan itu berkas ini.
 *
 * KENAPA TEMPEL-TAUTAN, BUKAN TAUTAN DALAM. Tautan dalam (`analismarket://`)
 * butuh perubahan bot DAN build EAS; keduanya belum ada. Menempelkan tautan
 * yang sudah dikirim bot bekerja HARI INI, termasuk di Expo Go. Skema tautan
 * dalam tetap dipasang di `app.json` supaya satu tombol tambahan di bot nanti
 * langsung menaikkannya jadi sekali ketuk — tanpa berkas ini berubah.
 *
 * Sesi disimpan di perangkat, bukan di memori: orang tidak boleh diminta
 * menyambung ulang tiap kali app ditutup.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ASAL } from './antrian';

const KUNCI = 'am_sesi_v1';

/** Umur sesi server: 12 jam (`UMUR_SESI_MINI_DETIK`), dikurangi satu menit. */
const UMUR_SESI_MS = 12 * 3600 * 1000 - 60_000;

export type Akun = {
  akunId: number;
  email: string | null;
  nama: string | null;
  telegramTersambung: boolean;
  /**
   * STRING, bukan objek. `/api/sambung/masuk` mengirim `ringkas.langganan`
   * dari `ringkasAkun()` di bot: `'plus' | 'gratis'`. Tipe ini sempat
   * dideklarasikan `{ aktif, sampai, paket }`, jadi layar Sambungkan membaca
   * `langganan.aktif` — selalu `undefined` — dan mencetak "Gratis" untuk
   * pelanggan AM+ tepat sesudah ia berhasil menyambung. Diuji pemilik di HP,
   * 19 Sep: "AM+ tidak terbawa".
   */
  langganan: 'plus' | 'gratis';
};

/**
 * DUA JENIS SESI, SATU BENTUK.
 *
 * `mini`  — token dari bot, ditukar di `/api/sambung/masuk`, 12 jam, dipegang
 *           di AsyncStorage. `sesi` adalah tokennya.
 * `clerk` — masuk lewat Google. Tokennya PENDEK UMUR (~60 dtk) dan diperbarui
 *           Clerk sendiri, jadi TIDAK disimpan di sini: `sesi` kosong, dan
 *           `tokenSesi()` yang memintanya ke Clerk tiap kali dibutuhkan.
 *
 * Layar tidak perlu tahu bedanya: `useSesi()` memberi satu `Sesi`, dan
 * `saya.ts` memakai `headerSesi()` yang sudah memilih tokennya.
 */
export type Sesi = { jenis?: 'mini' | 'clerk'; sesi: string; akun: Akun; pada: number };

type PenyediaClerk = {
  getToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
  /** `null` = belum masuk. */
  akun: Akun | null;
};
let clerk: PenyediaClerk | null = null;
let clerkDipasang = false;

function sesiClerk(): Sesi | null {
  if (clerk === null || clerk.akun === null) return null;
  return { jenis: 'clerk', sesi: '', akun: clerk.akun, pada: Date.now() };
}

/**
 * Dipanggil `JembatanClerk` di App.tsx tiap kali keadaan Clerk berubah.
 * Sesi mini yang sedang ada TETAP menang — Telegram adalah identitas yang
 * membuka fitur bot; Google cuma identitas.
 */
export function pasangClerk(p: PenyediaClerk | null): void {
  clerk = p;
  clerkDipasang = true;
  if (hidup === undefined) return;            // belum dibaca; bacaSesi() yang menggabungkan
  umumkan(hidup !== null && hidup.jenis !== 'clerk' ? hidup : sesiClerk());
}

/**
 * App TIDAK BOLEH memutuskan "belum masuk" sebelum dua-duanya dibaca:
 * simpanan sesi mini DAN keadaan Clerk. Memutuskan lebih awal berarti
 * pelanggan yang sudah masuk melihat layar masuk sekejap tiap kali membuka
 * app — dan "sekejap" itu yang membuat app terasa tidak percaya diri.
 */
export function sudahSiapSesi(): boolean {
  return hidup !== undefined && clerkDipasang;
}

/**
 * Sesi yang sedang berlaku, DIPEGANG DI MEMORI supaya tiap permintaan tidak
 * menunggu AsyncStorage. `null` = belum tersambung, `undefined` = belum dibaca.
 */
let hidup: Sesi | null | undefined;

/** Pemberi tahu perubahan — layar berlangganan ke sini, bukan menjajaki ulang. */
type Pendengar = (s: Sesi | null) => void;
const pendengar = new Set<Pendengar>();

export function dengarSesi(f: Pendengar): () => void {
  pendengar.add(f);
  return () => { pendengar.delete(f); };
}

function umumkan(s: Sesi | null): void {
  hidup = s;
  for (const f of pendengar) f(s);
}

/**
 * Sesi yang tersimpan, atau `null`.
 *
 * Yang KEDALUWARSA dibuang di sini, bukan dibiarkan sampai server menolaknya:
 * sesi basi yang masih tersimpan membuat app menampilkan "tersambung" untuk
 * akun yang sebenarnya sudah tidak bisa dipakai.
 */
export async function bacaSesi(): Promise<Sesi | null> {
  if (hidup !== undefined) return hidup;
  let hasil: Sesi | null;
  try {
    const mentah = await AsyncStorage.getItem(KUNCI);
    if (mentah === null) hasil = sesiClerk();
    else {
      const s = JSON.parse(mentah) as Sesi;
      if (typeof s.sesi !== 'string' || s.sesi === '') hasil = sesiClerk();
      else if (Date.now() - s.pada > UMUR_SESI_MS) { try { await AsyncStorage.removeItem(KUNCI); } catch { /* abaikan */ } hasil = sesiClerk(); }
      else hasil = { ...s, jenis: 'mini' };
    }
  } catch {
    hasil = sesiClerk();
  }
  /* Diumumkan, bukan cuma disimpan: pendengar (gerbang di App.tsx) menunggu
     justru momen ini untuk memutuskan layar mana yang tampil. */
  umumkan(hasil);
  return hasil;
}

/** Sesi yang sedang dipegang TANPA menunggu — dipakai layar saat render. */
export function sesiSekarang(): Sesi | null {
  return hidup ?? null;
}

/**
 * Token yang dikirim sebagai Bearer. Mini: dari simpanan. Clerk: diminta ke
 * Clerk TIAP KALI, karena ia memperbarui tokennya sendiri di belakang.
 */
export async function tokenSesi(): Promise<string | null> {
  const s = hidup ?? null;
  if (s === null) return null;
  if (s.jenis === 'clerk') {
    try { return await clerk?.getToken() ?? null; } catch { return null; }
  }
  return s.sesi;
}

export async function hapusSesi(): Promise<void> {
  const lama = hidup ?? null;
  try { await AsyncStorage.removeItem(KUNCI); } catch { /* penyimpanan ditolak */ }
  if (lama?.jenis === 'clerk') {
    try { await clerk?.signOut(); } catch { /* Clerk sudah keluar */ }
    umumkan(null);
    return;
  }
  /* Sesi mini dicabut; kalau Google masih masuk, ia yang tampil sekarang. */
  umumkan(sesiClerk());
}

export type HasilSambung =
  | { ok: true; sesi: Sesi }
  /** `sebab` dipakai layar untuk memilih kalimatnya; jangan ditampilkan mentah. */
  | { ok: false; sebab: 'token-cacat' | 'kedaluwarsa' | 'dipakai' | 'belum-gabung' | 'jaringan' | 'lain'; kalimat: string };

/**
 * Ambil token dari apa pun yang ditempel orang.
 *
 * Yang disalin dari Telegram bisa berupa tautan penuh, tautan tanpa skema,
 * atau tokennya saja — dan menuntut bentuk tertentu berarti menyalahkan orang
 * atas hal yang tidak ia kendalikan. Ketiganya diterima.
 */
export function tokenDariTempelan(teks: string): string | null {
  const bersih = teks.trim();
  if (bersih === '') return null;
  const cocok = /[?&]masuk=([A-Za-z0-9_-]{20,64})/.exec(bersih);
  if (cocok?.[1] !== undefined) return cocok[1];
  return /^[A-Za-z0-9_-]{20,64}$/.test(bersih) ? bersih : null;
}

function kalimatSebab(galat: string): { sebab: 'kedaluwarsa' | 'dipakai' | 'belum-gabung' | 'lain'; kalimat: string } {
  if (galat === 'kedaluwarsa') {
    return { sebab: 'kedaluwarsa', kalimat: 'Tautannya sudah lewat 10 menit. Minta yang baru ke bot, lalu tempel lagi.' };
  }
  if (galat === 'dipakai') {
    /* Sebabnya hampir selalu SATU hal: tombolnya ditekan biasa, peramban
       terbuka, dan tautan sekali-pakai itu habis di sana. Menyebut sebabnya
       mengubah pesan galat jadi perbaikan — tanpa itu orang mengulangi
       persis gerakan yang sama dan gagal lagi. */
    return {
      sebab: 'dipakai',
      kalimat: 'Tautan itu sudah dipakai sekali — biasanya karena tombolnya ditekan '
        + 'biasa lalu terbuka di peramban. Minta yang baru ke bot, lalu TEKAN LAMA '
        + 'tombolnya dan pilih Salin tautan.',
    };
  }
  if (galat === 'belum-gabung') {
    return { sebab: 'belum-gabung', kalimat: 'Akunmu belum bergabung di grup dan channel. Gabung dulu lewat bot, lalu coba lagi.' };
  }
  return { sebab: 'lain', kalimat: 'Tautannya tidak dikenali. Minta tautan baru ke bot.' };
}

/**
 * Tukar token dengan sesi.
 *
 * TIDAK lewat antrean `ambil()`: ini POST sekali jalan yang tidak boleh
 * di-cache maupun disatukan single-flight, dan ia bukan bagian dari zona
 * pembatas laju `apibacaan`.
 */
export async function sambungkan(tempelan: string): Promise<HasilSambung> {
  const token = tokenDariTempelan(tempelan);
  if (token === null) {
    return { ok: false, sebab: 'token-cacat', kalimat: 'Yang ditempel bukan tautan dari bot. Salin tautannya utuh, lalu tempel di sini.' };
  }
  const henti = new AbortController();
  const jam = setTimeout(() => { henti.abort(); }, 15_000);
  try {
    const res = await fetch(`${ASAL}/api/sambung/masuk`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
      signal: henti.signal,
    });
    const badan = (await res.json().catch(() => ({}))) as { sesi?: string; akun?: Akun; galat?: string };
    if (!res.ok || typeof badan.sesi !== 'string' || badan.akun === undefined) {
      return { ok: false, ...kalimatSebab(String(badan.galat ?? '')) };
    }
    const s: Sesi = { jenis: 'mini', sesi: badan.sesi, akun: badan.akun, pada: Date.now() };
    try { await AsyncStorage.setItem(KUNCI, JSON.stringify(s)); } catch { /* tetap dipakai di memori */ }
    umumkan(s);
    return { ok: true, sesi: s };
  } catch {
    return { ok: false, sebab: 'jaringan', kalimat: 'Tidak bisa menghubungi server. Periksa sambungan, lalu coba lagi.' };
  } finally {
    clearTimeout(jam);
  }
}

/**
 * Header untuk `/api/saya/*`. Kosong kalau belum tersambung — pemanggil yang
 * memutuskan, bukan fungsi ini yang melempar.
 */
export async function headerSesi(): Promise<Record<string, string>> {
  const t = await tokenSesi();
  return t === null ? {} : { authorization: `Bearer ${t}` };
}
