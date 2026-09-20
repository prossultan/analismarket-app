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
import { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSisaBilah, useTinggiKepala } from '../gaya/jarak';
import { FITUR_GRATIS, FITUR_PLUS, PAKET_PLUS, rupiah } from '../data/amplus';
import { Blok, Istilah, Lbl, Mikro, PitaBasi, Rangka, Tombol } from '../komponen/mockup';
import { ambilRingkas, type Ringkas } from '../data/saya';
import { useMuat, type Hasil } from '../data/muat';
import { useSesi } from './Akun';
import { W, H, J, R, TALANG } from '../gaya/token';

const TANYA: ReadonlyArray<{ t: string; j: string }> = [
  { t: 'Bisa berhenti kapan saja?', j: 'Bisa. Langganan ditagih bulanan dan berhenti di akhir periode berjalan.' },
  { t: 'Apa bedanya dengan bot Telegram?', j: 'Sama mesinnya, sama angkanya. AM+ menambah pantauan otomatis dan cek banyak pasar.' },
  { t: 'Apakah ini memprediksi harga?', j: 'Tidak. Ini alat baca chart. Ia menilai kondisi sekarang, bukan meramal yang berikutnya.' },
  { t: 'Lewat mana kabarnya dikirim?', j: 'Lewat Telegram, ke akun yang tersambung. App ini menampilkan salinannya di tab Kabar.' },
  { t: 'Pantauan gratis tetap ada?', j: 'Ada. Tiga pantauan pertama gratis; AM+ membuka sisanya dan kabar otomatisnya.' },
];

/* Paket bawaan = yang dipakai saat harga disebut tanpa konteks paket,
   sama seperti `PAKET_BAWAAN` di bot. */
const SATU_BULAN = PAKET_PLUS[0] as { kode: string; bulan: number; hargaRp: number };

export function LayarAmPlus({ bukaLangganan }: { bukaLangganan?: () => void }) {
  const tinggiKepala = useTinggiKepala();
  const sisaBilah = useSisaBilah();
  /* SUMBER YANG SAMA DENGAN HOME. Dulu layar ini statis — selalu mengajak
     berlangganan, juga kepada pelanggan yang di Home dua ketukan sebelumnya
     baru saja dibilang "AM+ aktif". Dua permukaan yang berbeda pendapat
     lebih buruk daripada satu yang salah: orang tidak tahu mana yang benar. */
  const sesi = useSesi();
  const muat = useCallback(async (): Promise<Hasil<Ringkas | null>> => {
    if (sesi === null) return { ok: true, isi: null };
    return ambilRingkas();
  }, [sesi]);
  const { keadaan } = useMuat(muat, sesi === null ? 'kosong' : `ada:${sesi.jenis ?? 'mini'}`);
  const r = keadaan.fase === 'ada' ? keadaan.isi : null;
  const sebab = keadaan.fase === 'gagal' ? keadaan.kalimat : keadaan.fase === 'ada' ? keadaan.basi : null;
  const menunggu = sesi !== null && keadaan.fase === 'memuat';
  const plus = r?.langganan === 'plus';
  const sampai = plus && r !== null
    ? new Date(Date.now() + r.sisaHariPlus * 86_400_000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  return (
    <ScrollView style={g.akar} contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 7 }}>
      {sebab !== null && <PitaBasi kalimat={sebab} />}
      {/* Kartu emas bergradasi — satu-satunya di seluruh app. */}
      <View style={g.kartu}>
        <LinearGradient
          colors={['rgba(201,169,97,0.20)', 'rgba(201,169,97,0.05)', 'rgba(201,169,97,0.11)']}
          locations={[0, 0.58, 1]}
          start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={g.cap}>AnalisMarket+</Text>
        {menunggu ? (
          <>
            <Rangka lebar="70%" tinggi={14} gaya={{ marginTop: 8 }} />
            <Rangka lebar="45%" tinggi={19} gaya={{ marginTop: 9 }} />
          </>
        ) : plus ? (
          <>
            <Text style={g.judul}>Aktif · {String(r?.sisaHariPlus ?? 0)} hari lagi</Text>
            <Text style={g.harga}>{sampai ?? '—'} <Text style={g.perBulan}>berlaku sampai</Text></Text>
          </>
        ) : (
          <>
            <Text style={g.judul}>Pantauan otomatis, tanpa membuka app</Text>
            <Text style={g.harga}>{rupiah(SATU_BULAN.hargaRp)} <Text style={g.perBulan}>/ {String(SATU_BULAN.bulan * 30)} hari</Text></Text>
          </>
        )}
        <View style={g.daftar}>
          {FITUR_PLUS.map((f) => (
            <View key={f.nama} style={g.butir}>
              <Text style={g.centang}>✓</Text>
              <Text style={g.butirTeks}>{f.nama}{plus ? ' — terbuka' : ''}</Text>
            </View>
          ))}
        </View>
        <Tombol
          teks={bukaLangganan === undefined ? 'Berlangganan lewat web' : plus ? 'Kelola langganan' : 'Lihat cara berlangganan'}
          jenis={plus ? 'kedua' : 'emas'} mati={bukaLangganan === undefined || menunggu} onPress={bukaLangganan} />
        <Mikro tengah>{plus ? 'Berhenti sebelum tanggal berakhir berarti tetap aktif sampai habis.' : 'Pembelian belum tersedia di dalam app.'}</Mikro>
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
