/**
 * HALAMAN 9 — AnalisMarket+.
 *
 * Menjawab "apa isinya" dan berhenti di situ.
 *
 * NOL HARGA, NOL TOMBOL PEMBAYARAN, NOL TAUTAN KELUAR. Aturan
 * toko aplikasi melarang app mengarahkan orang ke pembayaran di luar, dan
 * aturan produk kita melarang app menyebut harga web, menautkannya, atau
 * membandingkannya. Sampai IAP mendarat, pertanyaan "berapa" tidak dijawab
 * setengah — ia tidak dijawab sama sekali.
 *
 * Emas dipakai DI SINI, dan cuma di sini. Itu satu-satunya arti warna itu di
 * seluruh produk.
 */
import { useHeaderHeight } from '@react-navigation/elements';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { FITUR_GRATIS, FITUR_PLUS } from '../data/amplus';
import { Kartu } from '../komponen/dasar';
import { W, H, J, R, SISA_BILAH } from '../gaya/token';

export function LayarAmPlus() {
  const tinggiKepala = useHeaderHeight();
  return (
    <ScrollView style={g.akar} contentContainerStyle={{ paddingTop: tinggiKepala + J.x3, paddingBottom: SISA_BILAH }}>
      <View style={g.hero}>
        <Text style={g.merek}>AnalisMarket+</Text>
        <Text style={g.tagline}>Pasar dipantau otomatis, dan kamu dikabari saat kondisinya terpenuhi.</Text>
      </View>

      <Kartu judul="Yang kamu dapat">
        {FITUR_PLUS.map((f, i) => (
          <View key={f.nama} style={[g.item, i > 0 && g.itemBergaris]}>
            <View style={g.titik} />
            <View style={{ flex: 1 }}>
              <Text style={g.nama}>{f.nama}</Text>
              <Text style={g.ket}>{f.keterangan}</Text>
            </View>
          </View>
        ))}
      </Kartu>

      <Kartu judul="Yang sudah gratis, dan tetap gratis">
        {FITUR_GRATIS.map((f, i) => (
          <View key={f.nama} style={[g.item, i > 0 && g.itemBergaris]}>
            <View style={g.titikSamar} />
            <View style={{ flex: 1 }}>
              <Text style={g.namaGratis}>{f.nama}</Text>
              <Text style={g.ket}>{f.keterangan}</Text>
            </View>
          </View>
        ))}
      </Kartu>

      <Kartu judul="Baca dulu">
        <Text style={g.jujur}>
          Kabar Otomatis dikirim lewat Telegram, dan untuk itu akunmu perlu tersambung ke bot. Berlangganan dari dalam app belum tersedia — halaman ini baru menjelaskan isinya.
        </Text>
      </Kartu>
    </ScrollView>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  hero: { paddingHorizontal: J.x3, paddingBottom: J.x4 },
  merek: { fontSize: H.harga, fontWeight: '700', color: W.plus, letterSpacing: -0.3 },
  tagline: { fontSize: H.kontrol, color: W.teksRedup, marginTop: J.x2, lineHeight: 18 },
  item: { flexDirection: 'row', gap: J.x3, paddingVertical: J.x2, alignItems: 'flex-start' },
  itemBergaris: { borderTopWidth: 1, borderTopColor: W.garisSamar },
  titik: { width: 6, height: 6, borderRadius: R.bulat, backgroundColor: W.plus, marginTop: 6 },
  titikSamar: { width: 6, height: 6, borderRadius: R.bulat, backgroundColor: W.teksSamar, marginTop: 6 },
  nama: { fontSize: H.kontrol, color: W.teksKuat, fontWeight: '500' },
  namaGratis: { fontSize: H.kontrol, color: W.teks },
  ket: { fontSize: 11, color: W.teksRedup, marginTop: 2 },
  jujur: { fontSize: 11, color: W.teksRedup, lineHeight: 18 },
});
