/**
 * JARAK BAWAH tiap layar bertab — DIHITUNG, bukan konstanta.
 *
 * `SISA_BILAH` yang tetap benar di HP tanpa poni dan menyembunyikan baris
 * terakhir sebanyak tinggi poninya di HP yang punya. Bilah melayang tidak
 * lagi diberi jarak aman otomatis oleh react-navigation, jadi angkanya
 * harus ditanya ke perangkat.
 */
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { ANGKAT_BILAH, TINGGI_BILAH } from './token';

export function useSisaBilah(): number {
  const { bottom } = useSafeAreaInsets();
  return TINGGI_BILAH + ANGKAT_BILAH + bottom + 8;
}

/**
 * TINGGI KEPALA dengan CADANGAN. Di HP pemilik (Android, 20 Sep) `useHeaderHeight()`
 * menjawab 0 di dalam layar tumpukan bertransisi: kartu pertama naik menimpa judul
 * "Profil". Di web angkanya benar, jadi ini cacat pengukuran native, bukan tata
 * letak. Kalau jawabannya 0, dipakai inset atas + 56 (toolbar Android) / 44 (iOS)
 * — angka yang sama dengan yang digambar kepala native.
 */
export function useTinggiKepala(): number {
  const h = useTinggiKepala();
  const { top } = useSafeAreaInsets();
  if (h > 0) return h;
  return top + (Platform.OS === 'ios' ? 44 : 56);
}
