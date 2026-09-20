/**
 * BELAJAR — mockup 08.
 *
 * Tanpa kartu untuk tiap istilah: pemisah garis rambut sudah cukup, dan
 * kartu bertumpuk membuat daftar bacaan terasa seperti papan kendali.
 */
import { useState } from 'react';
import { gayaTema } from '../gaya/tema';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSisaBilah, useTinggiKepala } from '../gaya/jarak';
import { ISTILAH } from '../data/istilah';
import { Chip, Istilah } from '../komponen/mockup';
import { W, TALANG } from '../gaya/token';

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
    <ScrollView style={g.akar} contentContainerStyle={{ paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG }}>
      <View style={g.chips}>
        <Chip teks="Istilah" on={tab === 'istilah'} onPress={() => { setTab('istilah'); }} />
        <Chip teks="Cara baca kartu" on={tab === 'cara'} onPress={() => { setTab('cara'); }} />
      </View>
      <View style={{ marginTop: 6 }}>
        {daftar.map((d, i) => <Istilah key={d.nama} judul={d.nama} isi={d.arti} pertama={i === 0} />)}
      </View>
    </ScrollView>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  chips: { flexDirection: 'row', gap: 4 },
}));
