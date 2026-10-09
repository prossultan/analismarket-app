/**
 * KEADAAN SEKARANG tiap pantauan — dibaca dari `/api/bacaan` lewat antrean
 * yang sama dengan layar Pasar (simpanan 20 detik), jadi pasangan yang baru
 * dibuka di Pasar tidak ditagih dua kali.
 *
 * m1/m5 emas & forex TIDAK dibaca otomatis. Tiap bacaan di sana memakai jatah
 * harian AM+ (`BATAS_PLUS_M1M5_HARIAN` di bot), dan layar yang menghabiskan
 * jatah orang hanya karena dibuka adalah biaya yang tidak pernah ia setujui.
 * Penyedianya ditentukan dengan aturan bot sendiri (`penyediaUntuk`): simbol
 * bergaris miring → Twelve Data, yang menagih kredit per panggilan.
 *
 * Modul murni (tanpa impor React Native) — diuji di `uji-keputusan.mjs`.
 */
import { syaratWajib, type Bacaan } from './api';

export function bolehDibacaOtomatis(pair: string, tf: string): boolean {
  const t = tf.toLowerCase();
  return !(pair.includes('/') && (t === 'm1' || t === 'm5'));
}

export type KeadaanPantauan = { label: 'Setup' | 'Pantau' | 'Tidak dicetak'; mesin: string; lolos: number; wajib: number };

/**
 * Mesin yang dipantau, atau — untuk pantauan "mesin apa saja" — mesin yang
 * paling dekat: Setup dulu, lalu Pantau, lalu porsi syarat wajib yang lolos.
 * `null` kalau mesinnya tidak ada di bacaan (kode lama yang sudah dicabut).
 */
export function keadaanPantauan(b: Bacaan, kode: string | null): KeadaanPantauan | null {
  const kandidat = kode === null ? b.mesin : b.mesin.filter((m) => m.mesin === kode);
  let terbaik: KeadaanPantauan | null = null;
  let skor = -1;
  for (const m of kandidat) {
    const w = syaratWajib(m);
    const lolos = w.filter((s) => s.lolos).length;
    const st = m.status.toUpperCase();
    const s = (st === 'SETUP' ? 2 : st === 'PANTAU' ? 1 : 0) + (w.length > 0 ? lolos / w.length : 0);
    if (s > skor) {
      skor = s;
      terbaik = { label: st === 'SETUP' ? 'Setup' : st === 'PANTAU' ? 'Pantau' : 'Tidak dicetak', mesin: m.mesin, lolos, wajib: w.length };
    }
  }
  return terbaik;
}

/**
 * CONTOH NOTIFIKASI di formulir Pantauan baru — bentuknya SALINAN
 * `pesanKabarPush` di bot (`src/lib/push.ts`), dan `uji-keputusan.mjs`
 * mencocokkannya dengan templat di sana. Contoh yang tidak sama dengan
 * notifikasi sungguhan adalah janji yang dilanggar di layar kunci.
 *
 * Jamnya `hh.mm`, bukan jam karangan: "berlaku sampai" baru diketahui saat
 * kondisinya terpenuhi. Arah, entry, SL, dan TP tidak pernah ikut — sama
 * dengan bot.
 */
export const JAM_CONTOH = 'hh.mm';
export function contohKabarPush(pair: string, tf: string, mesin: string): { judul: string; isi: string } {
  return {
    judul: `${pair} ${tf.toLowerCase()} · kondisi terpenuhi`,
    isi: `${mesin} · berlaku sampai ${JAM_CONTOH} WIB. Buka app untuk membaca levelnya.`,
  };
}
