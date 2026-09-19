/**
 * KUNCI MEREK — logo dan nama produk, satu susunan untuk seluruh app.
 *
 * Sampai 19 Sep merek AnalisMarket tidak muncul di satu layar pun: kepala
 * Home cuma bertuliskan "Home". Nama produk yang tidak pernah terlihat
 * membuat app terasa seperti pembaca chart generik, bukan permukaan kedua
 * dari alat yang sudah dipakai orang di Telegram dan web.
 *
 * "Market" berwarna emas — emas sebagai TEKS, bukan bidang terisi. Bidang
 * emas tetap milik AnalisMarket+ sendirian.
 */
import { Image, StyleSheet, Text, View } from 'react-native';
import { W, H, J } from '../gaya/token';

const LOGO = require('../../assets/logo-am.png') as number;

export function Merek({ sub, ukuran = 30 }: { sub?: string; ukuran?: number }) {
  return (
    <View style={g.akar}>
      <Image
        source={LOGO}
        style={{ width: ukuran, height: ukuran, borderRadius: Math.round(ukuran * 0.29) }}
        accessibilityIgnoresInvertColors
      />
      <View style={{ minWidth: 0 }}>
        <Text style={g.nama} numberOfLines={1}>
          Analis<Text style={g.emas}>Market</Text>
        </Text>
        {sub !== undefined && <Text style={g.sub} numberOfLines={1}>{sub}</Text>}
      </View>
    </View>
  );
}

const g = StyleSheet.create({
  akar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nama: { fontSize: 18, fontWeight: '700', color: W.teksKuat, letterSpacing: -0.5 },
  emas: { color: W.plus },
  sub: { fontSize: H.alat, color: W.teksSamar, marginTop: 1 },
});
