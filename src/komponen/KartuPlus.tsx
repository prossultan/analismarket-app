/**
 * KARTU AM+ DI HOME — "jualan" (permintaan pemilik 19 Sep), dalam bentuk kartu.
 * Untuk yang belum: harga dari satu sumber (`PAKET_PLUS`), tiga manfaat, tombol
 * ke tab PLUS+. Untuk pelanggan: status dan sisa hari — tanpa menjual ulang.
 * Tidak ada pembayaran di app; tombolnya cuma membuka halaman AM+.
 */
import { StyleSheet, Text, View } from 'react-native';
import { gayaTema } from '../gaya/tema';
import { LinearGradient } from 'expo-linear-gradient';
import { JUDUL_PLUS, MANFAAT_KARTU_PLUS, hargaPlus, TOKO_PLAY } from '../data/amplus';
import { Ikon } from './Ikon';
import { Tombol } from './mockup';
import { W, H, R } from '../gaya/token';


export function KartuPlus({ plus, sisaHari, onPress }: { plus: boolean; sisaHari?: number; onPress: () => void }) {
  const h = hargaPlus();
  return (
    <View style={g.kartu}>
      <LinearGradient pointerEvents="none" colors={['rgba(229,173,81,0.22)', 'rgba(229,173,81,0.05)', 'rgba(229,173,81,0.12)']} locations={[0, 0.55, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
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
          <Text style={g.judul}>{JUDUL_PLUS}</Text>
          {h !== null && <Text style={g.harga}>{h.harga} <Text style={g.per}>/ {h.hari} hari</Text></Text>}
          <View style={g.manfaat}>
            {/* Dari `FITUR_PLUS`, bukan diketik: kartu ini sempat menjual "Kabar
                ke HP saat syarat setup lolos" sebagai manfaat AM+, padahal push
                untuk pantauan biasa gratis. */}
            {MANFAAT_KARTU_PLUS.map((m) => (
              <View key={m} style={g.baris}><Text style={g.centang}>✓</Text><Text style={g.manfaatTeks}>{m}</Text></View>
            ))}
          </View>
          <View style={{ marginTop: 10 }}><Tombol teks={TOKO_PLAY ? 'Lihat isi AnalisMarket+' : 'Upgrade ke AnalisMarket+'} jenis="emas" onPress={onPress} /></View>
        </>
      )}
    </View>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  kartu: { borderRadius: R.kartu, padding: 16, overflow: 'hidden', borderWidth: 1, borderColor: W.amberTepi, borderTopColor: 'rgba(240,191,107,0.62)', backgroundColor: W.kartu },
  kepala: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  cap: { fontSize: H.label, letterSpacing: 1.6, textTransform: 'uppercase', color: W.plusTeks, fontWeight: '700' },
  judul: { fontSize: H.status, fontWeight: '700', color: W.teksKuat, marginTop: 8, letterSpacing: -0.2 },
  ket: { fontSize: 12.5, color: W.teksRedup, marginTop: 4, lineHeight: 18 },
  harga: { fontSize: 24, fontWeight: '700', color: W.plusTerang, marginTop: 6, letterSpacing: -0.5, fontVariant: ['tabular-nums'] },
  per: { fontSize: H.alat, fontWeight: '400', color: W.teksRedup },
  manfaat: { marginTop: 8, gap: 5 },
  baris: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  centang: { color: W.plusTeks, fontSize: 11, marginTop: 1 },
  manfaatTeks: { fontSize: 13, color: W.teks, flex: 1, lineHeight: 19 },
}));
