/**
 * DOKUMEN — mockup 11 dan 30: Syarat & Ketentuan / Kebijakan Privasi.
 *
 * Teks panjang keluar dari tangga angka dan masuk ke tangga baca: 10px
 * dengan tinggi baris 1,6. Pasalnya diberi nomor karena dokumen hukum memang
 * dirujuk per nomor — di sini penomoran adalah informasi, bukan hiasan.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSisaBilah } from '../gaya/jarak';
import { ambilDokumen } from '../data/dokumen';
import { Lbl } from '../komponen/mockup';
import { W, H, TALANG } from '../gaya/token';

export function LayarDokumen({ kunci }: { kunci: 'syarat' | 'privasi' }) {
  const tinggiKepala = useHeaderHeight();
  const sisaBilah = useSisaBilah();
  const d = ambilDokumen(kunci);
  return (
    <ScrollView style={g.akar} contentContainerStyle={{ paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG }}>
      <Lbl polos gaya={{ fontVariant: ['tabular-nums'] }}>{d.berlaku}</Lbl>
      {d.bagian.map((b, i) => (
        <View key={b.judul}>
          <Text style={g.subjudul}>{i + 1} · {b.judul}</Text>
          <Text style={g.isi}>{b.isi}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  subjudul: { marginTop: 10, marginBottom: 4, fontSize: H.nilai, fontWeight: '600', color: W.teksKuat },
  isi: { fontSize: H.alat, lineHeight: 16, color: W.teksRedup, marginBottom: 6 },
});
