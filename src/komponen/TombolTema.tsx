/**
 * TOMBOL TEMA di kepala tiap layar — satu ketukan membalik gelap ↔ terang.
 *
 * Ikonnya menunjukkan TUJUAN, bukan keadaan: di tema gelap tampil matahari
 * ("ketuk untuk terang"), di tema terang tampil bulan. Menampilkan keadaan
 * membuat orang menekan ikon yang sama dengan yang sedang berlaku dan
 * mengira tidak terjadi apa-apa.
 */
import { StyleSheet } from 'react-native';
import { Ikon } from './Ikon';
import { Tekan } from './Tekan';
import { gantiTema, useTema } from '../gaya/tema';
import { W, SENTUH } from '../gaya/token';

export function TombolTema() {
  const tema = useTema();
  const keTerang = tema === 'gelap';
  return (
    <Tekan onPress={() => { gantiTema(keTerang ? 'terang' : 'gelap'); }} hitSlop={8}
      accessibilityLabel={keTerang ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'} gaya={g.tombol}>
      <Ikon nama={keTerang ? 'matahari' : 'bulan'} warna={W.teksRedup} ukuran={20} />
    </Tekan>
  );
}

const g = StyleSheet.create({
  tombol: { width: SENTUH - 6, height: SENTUH - 6, alignItems: 'center', justifyContent: 'center', borderRadius: 999 },
});
