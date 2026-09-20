/**
 * KARTU AM+ DI HOME — "jualan" (permintaan pemilik 19 Sep), dalam bentuk kartu.
 * Untuk yang belum: harga dari satu sumber (`PAKET_PLUS`), tiga manfaat, tombol
 * ke tab PLUS+. Untuk pelanggan: status dan sisa hari — tanpa menjual ulang.
 * Tidak ada pembayaran di app; tombolnya cuma membuka halaman AM+.
 */
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PAKET_PLUS, rupiah } from '../data/amplus';
import { Ikon } from './Ikon';
import { Tombol } from './mockup';
import { W, H, R } from '../gaya/token';

const SATU = PAKET_PLUS[0] as { kode: string; bulan: number; hargaRp: number };

export function KartuPlus({ plus, sisaHari, onPress }: { plus: boolean; sisaHari?: number; onPress: () => void }) {
  return (
    <View style={g.kartu}>
      <LinearGradient pointerEvents="none" colors={['rgba(201,169,97,0.22)', 'rgba(201,169,97,0.05)', 'rgba(201,169,97,0.12)']} locations={[0, 0.55, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={g.kepala}>
        <Ikon nama="plus" warna={W.plus} ukuran={18} isi={W.plus} />
        <Text style={g.cap}>AnalisMarket+</Text>
      </View>
      {plus ? (
        <>
          <Text style={g.judul}>Aktif · {sisaHari === undefined ? '—' : String(sisaHari)} hari lagi</Text>
          <Text style={g.ket}>Kabar otomatis, cek banyak pasar, dan m5 emas/forex sudah terbuka.</Text>
          <View style={{ marginTop: 10 }}><Tombol teks="Kelola langganan" jenis="kedua" onPress={onPress} /></View>
        </>
      ) : (
        <>
          <Text style={g.judul}>Pantauan otomatis, tanpa membuka app</Text>
          <Text style={g.harga}>{rupiah(SATU.hargaRp)} <Text style={g.per}>/ {String(SATU.bulan * 30)} hari</Text></Text>
          <View style={g.manfaat}>
            {['Kabar ke HP saat syarat setup lolos', 'Cek 12 pasar sekaligus', 'm5 untuk emas & forex'].map((m) => (
              <View key={m} style={g.baris}><Text style={g.centang}>✓</Text><Text style={g.manfaatTeks}>{m}</Text></View>
            ))}
          </View>
          <View style={{ marginTop: 10 }}><Tombol teks="Upgrade ke AnalisMarket+" jenis="emas" onPress={onPress} /></View>
        </>
      )}
    </View>
  );
}

const g = StyleSheet.create({
  kartu: { borderRadius: R.kartu + 2, padding: 14, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(201,169,97,0.42)', backgroundColor: W.kartu },
  kepala: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cap: { fontSize: H.label, letterSpacing: 1.6, textTransform: 'uppercase', color: W.plus, fontWeight: '700' },
  judul: { fontSize: H.status, fontWeight: '700', color: W.teksKuat, marginTop: 8, letterSpacing: -0.2 },
  ket: { fontSize: H.alat, color: W.teksRedup, marginTop: 4, lineHeight: 15 },
  harga: { fontSize: 20, fontWeight: '700', color: '#E3CE97', marginTop: 4, letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  per: { fontSize: H.alat, fontWeight: '400', color: W.teksRedup },
  manfaat: { marginTop: 8, gap: 5 },
  baris: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  centang: { color: W.plus, fontSize: 11, marginTop: 1 },
  manfaatTeks: { fontSize: H.nilai, color: W.teks, flex: 1 },
});
