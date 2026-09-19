/**
 * JUDUL KEPALA DUA BARIS — pola yang dipakai SETIAP layar di mockup `kaca`:
 * judul 15px tebal, di bawahnya sub 10px redup ("30 hari ke depan",
 * "AnalisMarket+", "6 aktif · 3 jatah gratis"). Satu komponen supaya tiap
 * layar tidak menyusun sendiri dan menyimpang.
 */
import { StyleSheet, Text, View } from 'react-native';
import { W, H } from '../gaya/token';

export function JudulKepala({ judul, sub }: { judul: string; sub?: string }) {
  return (
    <View style={g.akar}>
      <Text style={g.judul} numberOfLines={1}>{judul}</Text>
      {sub !== undefined && sub !== '' && <Text style={g.sub} numberOfLines={1}>{sub}</Text>}
    </View>
  );
}

const g = StyleSheet.create({
  akar: { justifyContent: 'center' },
  judul: { color: W.teksKuat, fontSize: H.status, fontWeight: '700', letterSpacing: -0.2 },
  sub: { color: W.teksSamar, fontSize: H.alat, marginTop: 1 },
});
