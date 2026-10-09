/**
 * DOKUMEN — mockup 11 dan 30: Syarat & Ketentuan / Kebijakan Privasi.
 *
 * Teks panjang keluar dari tangga angka dan masuk ke tangga baca: 10px
 * dengan tinggi baris 1,6. Pasalnya diberi nomor karena dokumen hukum memang
 * dirujuk per nomor — di sini penomoran adalah informasi, bukan hiasan.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { gayaTema } from '../gaya/tema';
import { useSisaBilah, useTinggiKepala } from '../gaya/jarak';
import { ambilDokumen } from '../data/dokumen';
import { Blok, Lbl } from '../komponen/mockup';
import { Latar } from '../komponen/Latar';
import { Ikon } from '../komponen/Ikon';
import { W, R, TALANG, ANGKA } from '../gaya/token';

export function LayarDokumen({ kunci }: { kunci: 'syarat' | 'privasi' }) {
  const tinggiKepala = useTinggiKepala();
  const sisaBilah = useSisaBilah();
  const d = ambilDokumen(kunci);
  return (
    <Latar kuat="redup">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 10, paddingBottom: sisaBilah, paddingHorizontal: TALANG }}>
        <View style={g.berlaku}>
          <Ikon nama="dokumen" warna={W.plusTeks} ukuran={14} />
          <Text style={g.berlakuTeks}>{d.berlaku}</Text>
        </View>
        {d.bagian.map((b, i) => (
          <View key={b.judul} style={g.bagian}>
            <View style={g.subBaris}>
              <View style={g.no}><Text style={g.noTeks}>{i + 1}</Text></View>
              <Text style={g.subjudul}>{b.judul}</Text>
            </View>
            <Text style={g.isi}>{b.isi}</Text>
          </View>
        ))}
        <View style={{ flex: 1 }} />
        <Blok gaya={{ marginTop: 20 }}>
          <Lbl>Berlaku untuk</Lbl>
          <Text style={g.catatanIsi}>Bot Telegram, situs web, dan app ini — satu dokumen untuk ketiganya. Versi terbaru selalu yang di situs web.</Text>
          <Lbl gaya={{ marginTop: 12 }}>Pertanyaan</Lbl>
          <Text style={g.catatanIsi}>Kirim ke bot Telegram @analismarketbot. App ini tidak memasang tautan keluar.</Text>
        </Blok>
      </ScrollView>
    </Latar>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  berlaku: {
    flexDirection: 'row', alignItems: 'center', gap: 7, alignSelf: 'flex-start', paddingHorizontal: 11, paddingVertical: 6,
    borderRadius: R.bulat, backgroundColor: W.amberLatar, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.amberTepi,
  },
  berlakuTeks: { fontSize: 12, color: W.plusTeks, fontWeight: '600', ...ANGKA },
  bagian: { marginTop: 20 },
  subBaris: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  no: {
    width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: W.isiSamarKuat, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi,
  },
  noTeks: { fontSize: 11.5, fontWeight: '700', color: W.teksRedup, ...ANGKA },
  subjudul: { flex: 1, fontSize: 15, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.2 },
  isi: { fontSize: 14, lineHeight: 22, color: W.teksRedup },
  catatanIsi: { marginTop: 4, fontSize: 12.5, lineHeight: 18, color: W.teksRedup },
}));
