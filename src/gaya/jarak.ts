/**
 * JARAK BAWAH tiap layar bertab — DIHITUNG, bukan konstanta.
 *
 * `SISA_BILAH` yang tetap benar di HP tanpa poni dan menyembunyikan baris
 * terakhir sebanyak tinggi poninya di HP yang punya. Bilah melayang tidak
 * lagi diberi jarak aman otomatis oleh react-navigation, jadi angkanya
 * harus ditanya ke perangkat.
 */
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TINGGI_BILAH } from './token';

export function useSisaBilah(): number {
  const { bottom } = useSafeAreaInsets();
  return TINGGI_BILAH + bottom + 8;
}
