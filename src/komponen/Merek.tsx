/**
 * KUNCI MEREK — logo dan nama produk, satu susunan untuk seluruh app.
 * Bentuknya varian A di `opendesign/mockups/kepala-2026`.
 *
 * Yang membuat kepala lama terasa jadul, dan yang diganti:
 *  - mark 64px diperbesar ke 90px di layar 3× → buram. Sekarang 256px.
 *  - ikon app masih ikon bawaan template Expo (chevron biru). Sekarang
 *    dari logo-512 web — satu mark di ikon, splash, kepala, dan Tentang.
 *  - sub cuma tanggal. Sekarang tanggal + titik hijau "hidup": kepala yang
 *    menyatakan keadaan, bukan cuma nama.
 *
 * "Market" berwarna emas — emas sebagai TEKS. Bidang emas tetap milik AM+.
 */
import { Image, StyleSheet, Text, View } from 'react-native';
import { gayaTema } from '../gaya/tema';
import { W, H } from '../gaya/token';

export const MARK = require('../../assets/merek-mark.png') as number;

export function Merek({ sub, hidup = true, ukuran = 36 }: { sub?: string; hidup?: boolean; ukuran?: number }) {
  return (
    <View style={g.akar}>
      <View style={[g.markBingkai, { width: ukuran, height: ukuran, borderRadius: ukuran / 2 }]}>
        <Image source={MARK} style={{ width: ukuran, height: ukuran, borderRadius: ukuran / 2 }} accessibilityIgnoresInvertColors />
      </View>
      <View style={{ minWidth: 0 }}>
        <Text style={g.nama} numberOfLines={1}>
          Analis<Text style={g.emas}>Market</Text>
        </Text>
        {sub !== undefined && (
          <View style={g.subBaris}>
            {hidup && <View style={g.titik} />}
            <Text style={g.sub} numberOfLines={1}>{sub}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  akar: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  /* cincin rambut + bayangan: mark bulat terasa "duduk" di kaca, bukan ditempel */
  markBingkai: {
    borderWidth: StyleSheet.hairlineWidth, borderColor: W.tinta(0.16),
    shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 7, shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  nama: { fontSize: 20, fontWeight: '700', color: W.teksKuat, letterSpacing: -0.6, lineHeight: 22 },
  emas: { color: W.plusTeks },
  subBaris: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  titik: { width: 5, height: 5, borderRadius: 3, backgroundColor: W.naik, shadowColor: W.naik, shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
  sub: { fontSize: H.alat, color: W.teksSamar },
}));
