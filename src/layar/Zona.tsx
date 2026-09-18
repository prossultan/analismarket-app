/**
 * HALAMAN 6 — ZONA & LEVEL.
 *
 * Zona adalah wilayah (punya atas dan bawah), level adalah satu harga. Dua
 * daftar terpisah karena keduanya dibaca berbeda, dan menggabungkannya
 * memaksa salah satunya berbohong soal bentuknya.
 *
 * Level yang di luar jangkauan tetap DITAMPILKAN dan ditandai — dibuang diam-
 * diam berarti orang mengira mesin tidak melihatnya.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Mesin } from '../data/api';
import { angka } from '../data/tampil';
import { Kartu, Pil } from '../komponen/dasar';
import { W, H, J, ANGKA } from '../gaya/token';

export function LayarZona({ m, desimal }: { m: Mesin; desimal: number }) {
  return (
    <ScrollView style={g.akar} contentContainerStyle={{ paddingVertical: J.x3 }}>
      <Kartu judul={`Zona (${String(m.zona.length)})`}>
        {m.zona.length === 0 ? (
          <Text style={g.kosong}>Mesin ini tidak menggambar zona di timeframe ini.</Text>
        ) : (
          m.zona.map((z, i) => (
            <View key={`${z.teks}${String(i)}`} style={g.baris}>
              <Text style={g.teks}>{z.teks}</Text>
              <Text style={g.peran}>{z.peran}</Text>
              <Text style={g.rentang}>
                {angka(z.bawah, desimal)} – {angka(z.atas, desimal)}
              </Text>
            </View>
          ))
        )}
      </Kartu>

      <Kartu judul={`Level yang diawasi (${String(m.level.length)})`}>
        {m.level.length === 0 ? (
          <Text style={g.kosong}>Tidak ada level yang diawasi.</Text>
        ) : (
          m.level.map((l, i) => (
            <View key={`${String(l.harga)}${String(i)}`} style={g.baris}>
              <Text style={g.harga}>{angka(l.harga, desimal)}</Text>
              <Text style={g.peran} numberOfLines={1}>{l.peran}</Text>
              {l.diLuarJangkauan && <Pil teks="di luar jangkauan" />}
            </View>
          ))
        )}
      </Kartu>
    </ScrollView>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  baris: { flexDirection: 'row', alignItems: 'center', gap: J.x2, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: W.garisSamar },
  teks: { fontSize: H.kontrol, color: W.teksKuat, fontWeight: '500', width: 56, ...ANGKA },
  harga: { fontSize: H.kontrol, color: W.teksKuat, fontWeight: '500', width: 96, ...ANGKA },
  peran: { fontSize: 11, color: W.teksRedup, flex: 1 },
  rentang: { fontSize: 11, color: W.teks, ...ANGKA },
  kosong: { fontSize: 11, color: W.teksRedup },
});
