/**
 * TOKEN GERAK — satu sumber untuk durasi, kurva, dan pegas.
 *
 * Aturan yang dipakai (dari skill `animate-expo`, dibaca utuh 20 Sep):
 * - Yang disentuh jari memakai PEGAS, supaya kecepatan jari diteruskan ke
 *   animasinya tanpa sambungan yang terasa. Selain itu memakai kurva.
 * - Tidak pernah `ease-in` di UI: ia lambat di awal, tepat saat mata menunggu.
 * - Tekan 100–150 ms dan skala 0,97 adalah LANGIT-LANGIT untuk sesuatu yang
 *   disentuh puluhan kali sehari. Lembar ~300 ms. Transisi antar-layar ikut
 *   bawaan platform, tidak diubah.
 * - `transform` dan `opacity` saja. Yang lain memicu layout tiap frame.
 *
 * Nilainya SAMA dengan yang dipakai web (`--ease-out`, `--ease-lembar`):
 * satu produk, satu bahasa gerak.
 */
import type { ComponentProps } from 'react';
import Animated, { Easing, cubicBezier, type WithSpringConfig } from 'react-native-reanimated';

/**
 * Tipe gaya yang diterima `Animated.View` — termasuk properti transisi CSS
 * Reanimated (`transitionProperty` dkk.) yang DITOLAK `StyleSheet.create`
 * bawaan RN. Gaya bertransisi ditulis sebagai objek bertipe ini, bukan lewat
 * StyleSheet; sisanya tetap StyleSheet seperti biasa.
 */
export type GayaGerak = NonNullable<ComponentProps<typeof Animated.View>['style']>;

/** Kurva transisi CSS Reanimated — `cubicBezier()`, bukan string: tipenya `CSSTimingFunction`. */
export const KURVA_KELUAR = cubicBezier(0.23, 1, 0.32, 1);
export const KURVA_LEMBAR = cubicBezier(0.32, 0.72, 0, 1);

/** Kurva Easing — untuk `withTiming` dan animasi layout. */
export const EASE_KELUAR = Easing.bezier(0.23, 1, 0.32, 1);
export const EASE_LEMBAR = Easing.bezier(0.32, 0.72, 0, 1);

export const MS = {
  /** Umpan balik tekan. Di atas 150 ms terasa lambat untuk yang sesering ini. */
  tekan: 120,
  /** Chip, saklar, perubahan keadaan kecil. */
  kecil: 160,
  /** Isi yang datang menggantikan rangka. */
  muncul: 180,
} as const;

/**
 * Skala tekan. Skill menyarankan 0,97 sebagai batas "nyaris tak terasa";
 * pemilik mencobanya di HP dan menyebutnya KAKU. Keputusannya: tekan harus
 * TERASA — 0,95 saat jari menyentuh, lalu memantul balik dengan pegas yang
 * sedikit melewati 1. "Empuk" lahir dari pantulan baliknya, bukan dari
 * seberapa dalam ia turun.
 */
export const SKALA_TEKAN = 0.95;
/** Turun cepat saat disentuh — 90 ms, supaya jawabannya seketika. */
export const MS_TURUN = 90;
/** Balik dengan pantulan kecil: dampingRatio 0,55 melewati 1 sedikit lalu diam. */
export const PEGAS_EMPUK: WithSpringConfig = { duration: 420, dampingRatio: 0.55 };
/** Pil tab yang baru aktif "mekar" dari 0,86 — pindah tab tidak menggeser layar, tapi terasa. */
export const PEGAS_PIL: WithSpringConfig = { duration: 380, dampingRatio: 0.6 };

/**
 * Pegas lembar — dua parameter perancang Apple, bukan mass/stiffness/damping.
 * `velocity` diisi dari gestur saat dipanggil.
 */
export const PEGAS_LEMBAR: WithSpringConfig = { duration: 320, dampingRatio: 0.82 };
/** Menutup: TIDAK boleh melewati tepi bawah — celah sekejap terlihat. */
export const PEGAS_TUTUP: WithSpringConfig = { duration: 300, dampingRatio: 1, overshootClamping: true };
/** Masuk tanpa jari: tanpa pantulan. Pantulan cuma untuk yang membawa momentum. */
export const PEGAS_MASUK: WithSpringConfig = { duration: 380, dampingRatio: 1 };

/**
 * Proyeksi momentum: seberapa jauh jari "akan" membawa benda kalau dilepas
 * sekarang. Dipakai untuk memutuskan tutup/kembali dari KECEPATAN, bukan
 * cuma jarak — jentikan pendek pun cukup untuk menutup.
 */
export function proyeksi(kecepatan: number, gesekan = 0.998): number {
  'worklet';
  return (kecepatan / 1000) * gesekan / (1 - gesekan);
}

/** Hambatan karet di luar batas: makin jauh ditarik, makin berat. */
export function karet(jarak: number, dimensi: number, kekuatan = 0.55): number {
  'worklet';
  return (1 - 1 / ((Math.abs(jarak) * kekuatan) / dimensi + 1)) * dimensi * Math.sign(jarak);
}
