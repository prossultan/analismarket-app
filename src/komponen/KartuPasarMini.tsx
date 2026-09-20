/**
 * KARTU PASAR MINI — bento pemanis di Home (referensi pemilik 19 Sep):
 * logo · nama · ticker · harga · sparkline · persen. Satu kartu besar, tiga
 * kecil. Ia hiasan yang HIDUP, bukan daftar pasar: tidak bisa diurutkan,
 * tidak bisa dicari, dan ketukannya membuka tab Pasar.
 *
 * Data dari `/api/bacaan` (h1, 48 lilin terakhir) lewat antrean yang sama
 * dengan tab Pasar — jadi kalau tab Pasar sudah memuatnya, kartu ini gratis.
 */
import { useCallback, useState } from 'react';
import { gayaTema } from '../gaya/tema';
import { StyleSheet, Text, View } from 'react-native';
import { ambilBacaan } from '../data/api';
import { useMuat, type Hasil } from '../data/muat';
import { angka } from '../data/tampil';
import { LambangPasar } from './LambangPasar';
import { Sparkline } from './Sparkline';
import { Rangka } from './mockup';
import { Tekan } from './Tekan';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MS } from '../gaya/gerak';
import { W, H, R } from '../gaya/token';

type Isi = { harga: number; deret: number[]; ubahPersen: number; desimal: number };

export function KartuPasarMini({ simbol, nama, besar = false, desimal = 2, onPress }: {
  simbol: string; nama: string; besar?: boolean; desimal?: number; onPress: () => void;
}) {
  const muat = useCallback(async (segarkan: boolean): Promise<Hasil<Isi>> => {
    const b = await ambilBacaan(simbol, 'h1', segarkan);
    if (!b.ok) return b;
    const deret = b.isi.lilin.slice(-48).map((l) => l.tutup);
    const awal = deret[0] ?? b.isi.harga;
    return { ok: true, isi: { harga: b.isi.harga, deret, ubahPersen: awal > 0 ? ((b.isi.harga - awal) / awal) * 100 : 0, desimal } };
  }, [simbol, desimal]);
  const { keadaan } = useMuat(muat, simbol);
  const isi = keadaan.fase === 'ada' ? keadaan.isi : null;
  const naik = isi === null ? null : isi.ubahPersen >= 0;
  const warna = naik === null ? W.teksSamar : naik ? W.naik : W.turun;
  const tinggiGaris = 40;

  return (
    <Tekan onPress={onPress} accessibilityLabel={`Buka chart ${simbol}`}
      /* Flex kartu harus di PRESSABLE LUAR: dialah anak baris bento. Saat
          gaya kartu pindah ke kotak dalam, BTC menyusut jadi sepertiga — luarnya
          tidak lagi ikut membagi lebar. */
      gayaLuar={[{ flex: 1, minWidth: 0 }, besar && g.besar]} gaya={[g.kartu, { flex: 1 }]} skala={0.96}>
      <View style={g.kepala}>
        <LambangPasar simbol={simbol} ukuran={20} />
        <Text style={g.nama} numberOfLines={1}>{nama}</Text>
      </View>
      <Text style={g.ticker}>{simbol}</Text>
      {isi === null
        ? <Rangka lebar="60%" tinggi={besar ? 20 : 14} gaya={{ marginTop: 4 }} />
        /* Isi MEMUDAR MASUK menggantikan rangka — tanpa ini harga muncul
           menyentak di frame yang sama rangkanya hilang. 180 ms, cuma opacity. */
        : <Animated.View entering={FadeIn.duration(MS.muncul)}><Text style={[g.harga, besar && g.hargaBesar]} numberOfLines={1}>{angka(isi.harga, isi.desimal)}</Text></Animated.View>}
      {/* Besar: garis mengisi sisa tinggi kolom di sebelahnya. Kecil: tinggi tetap,
          jadi kartu ditentukan isinya — bukan dipaksa sama tinggi lalu saling menimpa. */}
      <View style={[g.garis, besar ? { flex: 1, minHeight: 90 } : { height: tinggiGaris }]}>
        {isi !== null && <Animated.View entering={FadeIn.duration(MS.muncul)} style={StyleSheet.absoluteFill}><SparklineIsi deret={isi.deret} warna={warna} /></Animated.View>}
      </View>
      <View style={g.kaki}>
        {keadaan.fase === 'gagal'
          ? <Text style={[g.ubah, { color: W.teksSamar }]} numberOfLines={1}>tidak terbaca</Text>
          : <Text style={[g.ubah, { color: warna }]}>{isi === null ? '' : `${naik ? '▲' : '▼'} ${Math.abs(isi.ubahPersen).toFixed(2).replace('.', ',')}%`}</Text>}
      </View>
    </Tekan>
  );
}

/** Lebar diukur dari wadahnya — sparkline tidak boleh menebak lebar kartu. */
function SparklineIsi({ deret, warna }: { deret: number[]; warna: string }) {
  const [ukuran, setUkuran] = useState({ lebar: 0, tinggi: 0 });
  return (
    <View style={{ flex: 1 }} onLayout={(e) => { setUkuran({ lebar: e.nativeEvent.layout.width, tinggi: e.nativeEvent.layout.height }); }}>
      {ukuran.lebar > 0 && ukuran.tinggi > 0 && <Sparkline data={deret} lebar={ukuran.lebar} tinggi={ukuran.tinggi} warna={warna} />}
    </View>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  /* flex 1 + minWidth 0: di baris dua kartu, keduanya berbagi lebar dan
     tidak ada yang meluap keluar layar (terlihat di potret: Solana terpotong). */
  kartu: { flex: 1, minWidth: 0, backgroundColor: W.kartu, borderWidth: 1, borderColor: W.garis, borderRadius: R.kartu + 2, padding: 11, overflow: 'hidden' },
  besar: { flex: 1 },
  kepala: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  nama: { fontSize: H.pasar, fontWeight: '700', color: W.teksKuat, flex: 1 },
  ticker: { fontSize: H.alat, color: W.teksSamar, marginTop: 4, fontWeight: '600', letterSpacing: 0.3 },
  harga: { fontSize: H.status, fontWeight: '700', color: W.teksKuat, marginTop: 2, fontVariant: ['tabular-nums'] },
  hargaBesar: { fontSize: 22, letterSpacing: -0.5 },
  garis: { marginTop: 6, marginHorizontal: -11, flexDirection: 'row' },
  kaki: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  ubah: { fontSize: H.nilai, fontWeight: '700', fontVariant: ['tabular-nums'] },
}));
