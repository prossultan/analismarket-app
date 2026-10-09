/**
 * BELAJAR — mockup 08.
 *
 * Tanpa kartu untuk tiap istilah: pemisah garis rambut sudah cukup, dan
 * kartu bertumpuk membuat daftar bacaan terasa seperti papan kendali.
 */
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSisaBilah, useTinggiKepala } from '../gaya/jarak';
import { ISTILAH } from '../data/istilah';
import { Blok, Chip, Istilah } from '../komponen/mockup';
import { Latar } from '../komponen/Latar';
import { TALANG } from '../gaya/token';

const CARA_BACA: ReadonlyArray<{ nama: string; arti: string }> = [
  { nama: 'Setup · Pantau · Tidak dicetak', arti: 'Setup berarti semua syarat wajib lolos. Pantau berarti sebagian. Tidak dicetak berarti kondisinya belum layak dibaca.' },
  { nama: 'Syarat wajib', arti: 'Hanya syarat wajib yang dihitung. Bonus tidak menaikkan hitungan, dan tidak pernah membuat sesuatu jadi setup.' },
  { nama: 'Angka rencana ditahan', arti: 'Kalau imbalan tidak sepadan dengan risikonya di dalam gerak wajar pasar, Entry, SL, dan TP tidak dicetak. Kartu menyebut sebabnya.' },
  { nama: 'Jarak entry', arti: 'Seberapa jauh harga sekarang dari level entry, diukur dalam ATR. Lewat 3 ATR, entry-nya belum terjangkau.' },
  { nama: 'Porsi biaya', arti: 'Berapa persen dari risiko yang habis oleh spread dan slippage. Di atas separuh, setupnya jarang layak.' },
  { nama: 'Bias timeframe atas', arti: 'Arah yang terbaca di timeframe di atasnya. Setup yang melawan bias atas lebih jarang lolos.' },
];

export function LayarBelajar() {
  const tinggiKepala = useTinggiKepala();
  const sisaBilah = useSisaBilah();
  const [tab, setTab] = useState<'istilah' | 'cara'>('istilah');
  const daftar = tab === 'istilah' ? ISTILAH.map((i) => ({ nama: i.nama, arti: i.arti })) : CARA_BACA;
  return (
    <Latar kuat="redup">
      <ScrollView contentContainerStyle={{ paddingTop: tinggiKepala + 10, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 12 }}>
        <View style={g.chips}>
          <Chip teks="Istilah" on={tab === 'istilah'} onPress={() => { setTab('istilah'); }} />
          <Chip teks="Cara baca kartu" on={tab === 'cara'} onPress={() => { setTab('cara'); }} />
        </View>
        {/* Satu permukaan untuk seluruh daftar, garis rambut di antaranya —
            bukan kartu per istilah (lihat catatan di atas). */}
        <Blok rapat gaya={{ paddingHorizontal: 15 }}>
          {daftar.map((d, i) => <Istilah key={d.nama} judul={d.nama} isi={d.arti} pertama={i === 0} />)}
        </Blok>
      </ScrollView>
    </Latar>
  );
}

const g = StyleSheet.create({
  chips: { flexDirection: 'row', gap: 6 },
});
