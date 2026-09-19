/** Syarat & Ketentuan / Kebijakan Privasi — teks penuh, tanpa ringkasan. */
import { useHeaderHeight } from '@react-navigation/elements';
import { useSisaBilah } from '../gaya/jarak';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { ambilDokumen } from '../data/dokumen';
import { W, H, J } from '../gaya/token';

export function LayarDokumen({ kunci }: { kunci: 'syarat' | 'privasi' }) {
  const tinggiKepala = useHeaderHeight();
  const sisaBilah = useSisaBilah();
  const d = ambilDokumen(kunci);
  return (
    <ScrollView style={g.akar} contentContainerStyle={{ paddingTop: tinggiKepala + J.x3, paddingBottom: sisaBilah, paddingHorizontal: J.x3 }}>
      <Text style={g.judul}>{d.judul}</Text>
      <Text style={g.berlaku}>{d.berlaku}</Text>
      {d.bagian.map((b) => (
        <Text key={b.judul} style={g.isi}>
          <Text style={g.subjudul}>{b.judul} </Text>
          {b.isi}
        </Text>
      ))}
    </ScrollView>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  judul: { fontSize: H.nama, fontWeight: '700', color: W.teksKuat },
  berlaku: { fontSize: H.label, color: W.teksSamar, marginTop: 2, marginBottom: J.x4 },
  subjudul: { color: W.teksKuat, fontWeight: '500' },
  isi: { fontSize: 11, color: W.teksRedup, lineHeight: 19, marginBottom: J.x3 },
});
