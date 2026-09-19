/**
 * PROFIL — dan KABAR, dua layar yang jujur tentang apa yang belum ada.
 *
 * Keduanya ada di bilah bawah web mobile, jadi orang yang pindah dari web
 * akan mencarinya. Membiarkan namanya hilang membuat ia mengira app-nya
 * rusak; membuatnya kosong membuat ia mengira fiturnya rusak. Jadi keduanya
 * ada, dan keduanya menyebutkan sebabnya dengan angka.
 *
 * Yang menghalangi bukan pekerjaan tampilan: `/api/saya/*` punya 15 fungsi
 * dan 13 di antaranya menolak tanpa identitas Telegram. Layar ini akan berisi
 * data sungguhan pada hari identitas itu lepas — tidak sebelum itu.
 */
import { useHeaderHeight } from '@react-navigation/elements';
import { useSisaBilah } from '../gaya/jarak';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ikon } from '../komponen/Ikon';
import { Kartu, Pisah } from '../komponen/dasar';
import { W, H, J, R, TALANG } from '../gaya/token';

function Terkunci({ ikon, judul, kalimat, isi }: {
  ikon: 'profil' | 'kabar'; judul: string; kalimat: string; isi: ReadonlyArray<string>;
}) {
  const tinggiKepala = useHeaderHeight();
  const sisaBilah = useSisaBilah();
  return (
    <ScrollView style={g.akar} contentContainerStyle={{ paddingTop: tinggiKepala + J.x3, paddingBottom: sisaBilah }}>
      <View style={g.kepala}>
        <View style={g.lingkaran}>
          <Ikon nama={ikon} warna={W.teksRedup} ukuran={22} />
        </View>
        <Text style={g.judul}>{judul}</Text>
        <Text style={g.kalimat}>{kalimat}</Text>
      </View>

      <Kartu judul="Yang akan ada di sini">
        {isi.map((t, i) => (
          <View key={t}>
            {i > 0 && <Pisah />}
            <Text style={g.butir}>{t}</Text>
          </View>
        ))}
      </Kartu>

      <Kartu judul="Kenapa belum">
        <Text style={g.sebab}>
          App belum punya cara mengenali kamu. Endpoint akun di bot masih menuntut identitas Telegram, dan app ini sengaja tidak memasang Telegram maupun layar masuk sampai jalur itu dilepas.
        </Text>
        <Pisah />
        <Text style={g.sebab}>
          Sampai itu selesai, semua yang ada di app berjalan tanpa akun — dan itu juga berarti tidak ada satu pun data pribadi yang dikirim dari HP ini.
        </Text>
      </Kartu>
    </ScrollView>
  );
}

export function LayarProfil() {
  const tinggiKepala = useHeaderHeight();
  return (
    <Terkunci
      ikon="profil"
      judul="Profil"
      kalimat="Belum ada akun yang tersambung di app."
      isi={[
        'Keadaan langganan dan sisa hari AnalisMarket+',
        'Poin dan riwayat pemakaiannya',
        'Setelan modal, risiko, dan plafon leverage',
        'Timeframe bawaan yang ikut ke semua perangkat',
      ]}
    />
  );
}

export function LayarKabar() {
  return (
    <Terkunci
      ikon="kabar"
      judul="Kabar"
      kalimat="Pemberitahuan dikirim ke akun, dan app belum punya satu pun."
      isi={[
        'Pantauan yang kamu pasang, dan mana yang sudah berbunyi',
        'Kabar Otomatis: pasar yang dipantau tanpa diminta',
        'Jam sunyi dan irama kabar',
        'Rangkuman pagi: semalam apa saja yang bunyi',
      ]}
    />
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  kepala: { alignItems: 'center', paddingHorizontal: TALANG, paddingBottom: J.x4 },
  lingkaran: {
    width: 52, height: 52, borderRadius: R.bulat, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: W.garis, backgroundColor: W.kartu, marginBottom: J.x3,
  },
  judul: { fontSize: H.status, fontWeight: '700', color: W.teksKuat },
  kalimat: { fontSize: H.nilai, color: W.teksRedup, marginTop: J.x1, textAlign: 'center', lineHeight: 17 },
  butir: { fontSize: H.nilai, color: W.teks, paddingVertical: 6, lineHeight: 17 },
  sebab: { fontSize: 11, color: W.teksRedup, lineHeight: 18 },
});
