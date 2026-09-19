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
    <ScrollView style={g.akar} contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG }}>
      <Lbl polos gaya={{ fontVariant: ['tabular-nums'] }}>{d.berlaku}</Lbl>
      {d.bagian.map((b, i) => (
        <View key={b.judul}>
          <Text style={g.subjudul}>{i + 1} · {b.judul}</Text>
          <Text style={g.isi}>{b.isi}</Text>
        </View>
      ))}
      <View style={{ flex: 1 }} />
      <View style={g.catatan}>
        <Lbl>Berlaku untuk</Lbl>
        <Text style={g.catatanIsi}>Bot Telegram, situs web, dan app ini — satu dokumen untuk ketiganya. Versi terbaru selalu yang di situs web.</Text>
        <Lbl gaya={{ marginTop: 8 }}>Pertanyaan</Lbl>
        <Text style={g.catatanIsi}>Kirim ke bot Telegram @analismarketbot. App ini tidak memasang tautan keluar.</Text>
      </View>
    </ScrollView>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  subjudul: { marginTop: 14, marginBottom: 5, fontSize: H.status, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.2 },
  isi: { fontSize: H.pasar, lineHeight: 20, color: W.teksRedup, marginBottom: 4 },
  catatan: { marginTop: 14, padding: 10, borderRadius: 14, borderWidth: 1, borderColor: W.garis, backgroundColor: W.kartu },
  catatanIsi: { marginTop: 3, fontSize: H.alat, lineHeight: 15, color: W.teksRedup },
});
