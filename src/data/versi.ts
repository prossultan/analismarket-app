/**
 * IDENTITAS BUILD — supaya "build mana yang sedang kamu jalankan" selalu
 * bisa dijawab dari layar, bukan ditebak dari ukuran berkas.
 *
 * KENAPA ADA: 21 Sep 2026. Layar Chart crash di HP, perbaikannya sudah
 * didorong, dan pemilik bilang "masih crash". Butuh setengah jam membuktikan
 * bahwa ketiga saluran yang bisa ia pasang (tautan unduhan, internal testing,
 * closed testing) SEMUANYA masih memuat build lama — lewat perbandingan
 * ukuran byte aset rilis, karena app cuma menulis "v1.0.0" di mana-mana.
 *
 * Tiga bagian, dari tiga sumber yang berbeda dan sengaja tidak disatukan:
 *   versi      app.json — yang dilihat orang di toko
 *   kode build nomor versionCode di manifes native, dinaikkan EAS tiap build
 *   komit      EXPO_PUBLIC_KOMIT, disuntik workflow dari github.sha
 */
import * as Application from 'expo-application';
import konfigApp from '../../app.json';

export const VERSI: string = konfigApp.expo.version;
/** Null di web dan di Expo Go — cuma build native yang punya nomor ini. */
export const KODE_BUILD: string | null = Application.nativeBuildVersion ?? null;
export const KOMIT: string | null = (process.env.EXPO_PUBLIC_KOMIT ?? '').slice(0, 7) || null;

/** "v1.0.0 (19) · 2f22aae" — atau sesingkat yang bisa dipastikan. */
export function capBuild(): string {
  return `v${VERSI}${KODE_BUILD === null ? '' : ` (${KODE_BUILD})`}${KOMIT === null ? '' : ` · ${KOMIT}`}`;
}
