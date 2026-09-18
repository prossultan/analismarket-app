/**
 * HALAMAN 5 — SYARAT.
 *
 * HANYA SYARAT WAJIB. Bonus disaring, dan itu bukan penyederhanaan: kartu bot
 * menghitung "n dari sekian" dari syarat wajib saja, dan permukaan yang ikut
 * menghitung bonus akan mencetak angka yang berbeda untuk keadaan yang sama.
 *
 * Yang GAGAL dulu, baru yang lolos — orang membuka halaman ini untuk mencari
 * apa yang kurang, bukan untuk merayakan yang sudah beres.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { syaratWajib, type Mesin } from '../data/api';
import { W, H, J, R } from '../gaya/token';

export function LayarSyarat({ m }: { m: Mesin }) {
  const wajib = syaratWajib(m);
  const gagal = wajib.filter((s) => !s.lolos);
  const lolos = wajib.filter((s) => s.lolos);

  return (
    <ScrollView style={g.akar} contentContainerStyle={{ padding: J.x3 }}>
      <Text style={g.kepala}>
        {m.mesin} · {lolos.length} dari {wajib.length} syarat wajib lolos
      </Text>

      {gagal.length > 0 && (
        <View style={g.blokGagal}>
          <Text style={g.judulGagal}>Yang belum lolos</Text>
          {gagal.map((s) => (
            <View key={s.kode} style={g.item}>
              <Text style={g.tandaGagal}>✕</Text>
              <View style={{ flex: 1 }}>
                <Text style={g.nama}>{s.nama}</Text>
                {s.kalimat !== '' && <Text style={g.kalimat}>{s.kalimat}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}

      {lolos.length > 0 && (
        <View style={g.blokLolos}>
          <Text style={g.judulLolos}>Sudah lolos</Text>
          {lolos.map((s) => (
            <View key={s.kode} style={g.item}>
              <Text style={g.tandaLolos}>✓</Text>
              <View style={{ flex: 1 }}>
                <Text style={g.nama}>{s.nama}</Text>
                {s.kalimat !== '' && <Text style={g.kalimat}>{s.kalimat}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}

      <Text style={g.kaki}>
        Syarat bonus tidak ditampilkan di sini. Hitungan di kartu bot juga cuma menghitung yang wajib, dan dua permukaan harus menyebut angka yang sama.
      </Text>
    </ScrollView>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  kepala: { fontSize: H.nilai, color: W.teksKuat, fontWeight: '500', marginBottom: J.x3 },
  blokGagal: {
    borderWidth: 1, borderColor: 'rgba(244,63,94,0.25)', backgroundColor: 'rgba(244,63,94,0.08)',
    borderRadius: R.kartu, padding: J.x3, marginBottom: J.x3,
  },
  blokLolos: { borderWidth: 1, borderColor: W.garis, backgroundColor: W.kartu, borderRadius: R.kartu, padding: J.x3 },
  judulGagal: { fontSize: H.label, color: W.turun, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: J.x2 },
  judulLolos: { fontSize: H.label, color: W.teksSamar, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: J.x2 },
  item: { flexDirection: 'row', gap: J.x2, paddingVertical: 6 },
  tandaGagal: { color: W.turun, fontSize: H.kontrol, width: 14 },
  tandaLolos: { color: W.naik, fontSize: H.kontrol, width: 14 },
  nama: { fontSize: H.kontrol, color: W.teksKuat },
  kalimat: { fontSize: 11, color: W.teksRedup, marginTop: 2, lineHeight: 16 },
  kaki: { fontSize: H.label, color: W.teksSamar, paddingVertical: J.x4, lineHeight: 15 },
});
