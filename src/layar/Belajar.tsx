/**
 * HALAMAN 8 — BELAJAR.
 *
 * Dua bagian: cara membaca kartu, lalu kamus istilah. Urutan itu disengaja —
 * orang baru butuh tahu arti "Setup" dan "Pantau" sebelum butuh tahu apa itu
 * order block.
 *
 * Isinya diangkut dari web apa adanya. Yang dijelaskan adalah apa yang MESIN
 * INI maksud, bukan definisi buku teks.
 */
import { useHeaderHeight } from '@react-navigation/elements';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ISTILAH } from '../data/istilah';
import { Kartu, Pisah } from '../komponen/dasar';
import { W, H, J, SISA_BILAH } from '../gaya/token';

const KEADAAN: ReadonlyArray<{ nama: string; arti: string }> = [
  { nama: 'Setup', arti: 'Semua syarat wajib lolos, angka rencana dicetak.' },
  { nama: 'Pantau', arti: 'Ada syarat yang belum lolos, angka ditahan sampai lolos.' },
  { nama: 'Tidak dicetak', arti: 'Mesin membaca levelnya, tapi rencananya ditahan — sebabnya disebut di bacaan.' },
];

export function LayarBelajar() {
  const tinggiKepala = useHeaderHeight();
  return (
    <ScrollView style={g.akar} contentContainerStyle={{ paddingTop: tinggiKepala + J.x3, paddingBottom: SISA_BILAH }}>
      <Kartu judul="Tiga keadaan kartu">
        {KEADAAN.map((k, i) => (
          <View key={k.nama}>
            {i > 0 && <Pisah />}
            <Text style={g.nama}>{k.nama}</Text>
            <Text style={g.arti}>{k.arti}</Text>
          </View>
        ))}
      </Kartu>

      <Kartu judul="Bar biaya">
        <Text style={g.arti}>
          Ongkos masuk-keluar dibagi jarak stop loss. Di bawah 50% wajar; di atasnya mencolok; di atas 100% ongkosnya melebihi seluruh risiko dan angka rencana ditahan.
        </Text>
      </Kartu>

      <Kartu judul="Jarak entry">
        <Text style={g.arti}>
          Jarak harga sekarang ke entry dinyatakan dalam ATR. Rencana entry hanya dicetak sampai 2 ATR — lebih jauh dari itu, harga hampir tidak pernah sampai sebelum bacaannya kedaluwarsa.
        </Text>
      </Kartu>

      <Text style={g.judulBagian}>Istilah di chart</Text>
      <Text style={g.catatan}>
        Yang dijelaskan adalah apa yang mesin bot maksud dengan tiap kata — bukan definisi umum.
      </Text>

      {ISTILAH.map((it) => (
        <Kartu key={it.kode}>
          <View style={g.kepalaIstilah}>
            <Text style={g.kode}>{it.kode}</Text>
            <Text style={g.mesin}>{it.mesin}</Text>
          </View>
          <Text style={g.namaIstilah}>{it.nama}</Text>
          <Text style={[g.arti, { marginTop: J.x2 }]}>{it.arti}</Text>
        </Kartu>
      ))}
    </ScrollView>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  nama: { fontSize: H.nilai, color: W.teksKuat, fontWeight: '500' },
  arti: { fontSize: 11, color: W.teksRedup, lineHeight: 18, marginTop: 3 },
  judulBagian: { fontSize: H.nama, color: W.teksKuat, fontWeight: '700', paddingHorizontal: J.x3, paddingTop: J.x3 },
  catatan: { fontSize: 11, color: W.teksSamar, paddingHorizontal: J.x3, paddingBottom: J.x3, paddingTop: J.x1, lineHeight: 16 },
  kepalaIstilah: { flexDirection: 'row', alignItems: 'center', gap: J.x2 },
  kode: { fontSize: H.kontrol, color: W.teksKuat, fontWeight: '700' },
  mesin: { fontSize: H.label, color: W.teksSamar, letterSpacing: 0.6, textTransform: 'uppercase' },
  namaIstilah: { fontSize: 11, color: W.teks, marginTop: 2 },
});
