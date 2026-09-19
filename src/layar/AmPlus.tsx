/**
 * ANALISMARKET+ — mockup 06.
 *
 * SATU-SATUNYA layar dengan bidang emas TERISI. Di tempat lain emas cuma
 * garis, teks, dan penanda — aturan yang lahir saat emas dijadikan ciri
 * khas seluruh app: kalau tab aktif dan tombol masuk ikut emas, AM+ berhenti
 * jadi satu-satunya bidang emas dan seluruh alasan memilih emas runtuh.
 *
 * Tombol belinya MATI, dan kartunya mengatakan kenapa. Tombol mati tanpa
 * kalimat terbaca sebagai bug.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSisaBilah } from '../gaya/jarak';
import { FITUR_GRATIS, FITUR_PLUS } from '../data/amplus';
import { Blok, Istilah, Lbl, Mikro, Tombol } from '../komponen/mockup';
import { W, H, J, R, TALANG } from '../gaya/token';

const TANYA: ReadonlyArray<{ t: string; j: string }> = [
  { t: 'Bisa berhenti kapan saja?', j: 'Bisa. Langganan ditagih bulanan dan berhenti di akhir periode berjalan.' },
  { t: 'Apa bedanya dengan bot Telegram?', j: 'Sama mesinnya, sama angkanya. AM+ menambah pantauan otomatis dan cek banyak pasar.' },
  { t: 'Apakah ini memprediksi harga?', j: 'Tidak. Ini alat baca chart. Ia menilai kondisi sekarang, bukan meramal yang berikutnya.' },
  { t: 'Lewat mana kabarnya dikirim?', j: 'Lewat Telegram, ke akun yang tersambung. App ini menampilkan salinannya di tab Kabar.' },
  { t: 'Pantauan gratis tetap ada?', j: 'Ada. Tiga pantauan pertama gratis; AM+ membuka sisanya dan kabar otomatisnya.' },
];

export function LayarAmPlus({ bukaLangganan }: { bukaLangganan?: () => void }) {
  const tinggiKepala = useHeaderHeight();
  const sisaBilah = useSisaBilah();
  return (
    <ScrollView style={g.akar} contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 7 }}>
      {/* Kartu emas bergradasi — satu-satunya di seluruh app. */}
      <View style={g.kartu}>
        <LinearGradient
          colors={['rgba(201,169,97,0.20)', 'rgba(201,169,97,0.05)', 'rgba(201,169,97,0.11)']}
          locations={[0, 0.58, 1]}
          start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={g.cap}>AnalisMarket+</Text>
        <Text style={g.judul}>Pantauan otomatis, tanpa membuka app</Text>
        <Text style={g.harga}>Rp 99.000 <Text style={g.perBulan}>/ bulan</Text></Text>
        <View style={g.daftar}>
          {FITUR_PLUS.map((f) => (
            <View key={f.nama} style={g.butir}>
              <Text style={g.centang}>✓</Text>
              <Text style={g.butirTeks}>{f.nama}</Text>
            </View>
          ))}
        </View>
        <Tombol teks={bukaLangganan === undefined ? 'Berlangganan lewat web' : 'Lihat cara berlangganan'} jenis="emas" mati={bukaLangganan === undefined} onPress={bukaLangganan} />
        <Mikro tengah>Pembelian belum tersedia di dalam app.</Mikro>
      </View>

      <Blok>
        <Lbl>Yang tetap gratis</Lbl>
        <View style={[g.daftar, { marginTop: 6 }]}>
          {FITUR_GRATIS.map((f) => (
            <View key={f.nama} style={g.butir}>
              <Text style={g.centang}>✓</Text>
              <Text style={[g.butirTeks, { color: W.teksRedup }]}>{f.nama}</Text>
            </View>
          ))}
        </View>
      </Blok>

      <Blok gaya={{ flex: 1 }}>
        <Lbl>Pertanyaan yang sering masuk</Lbl>
        <View style={{ marginTop: 4 }}>
          {TANYA.map((q, i) => <Istilah key={q.t} judul={q.t} isi={q.j} pertama={i === 0} />)}
        </View>
      </Blok>
    </ScrollView>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  kartu: {
    borderRadius: R.kartu, padding: 12, overflow: 'hidden', gap: 0,
    borderWidth: 1, borderColor: 'rgba(201,169,97,0.38)', backgroundColor: 'rgba(201,169,97,0.07)',
  },
  /* Gradasi 158deg dari mockup, ditiru dengan dua bidang miring lembut —
     RN tidak punya linear-gradient tanpa paket tambahan. */
  cap: { fontSize: H.label, letterSpacing: 1.4, textTransform: 'uppercase', color: W.plus, fontWeight: '600' },
  judul: { marginTop: 6, fontSize: 14, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.2 },
  harga: { fontSize: 19, fontWeight: '700', color: '#E3CE97', marginTop: 7, letterSpacing: -0.3, fontVariant: ['tabular-nums'] },
  perBulan: { fontSize: H.alat, color: W.teksRedup, fontWeight: '400' },
  daftar: { marginTop: 9, gap: 5 },
  butir: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  centang: { color: W.plus, fontSize: 9, marginTop: 2 },
  butirTeks: { flex: 1, fontSize: H.alat, color: W.teks, lineHeight: 14 },
});
