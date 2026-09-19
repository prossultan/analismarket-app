/**
 * PROFIL (mockup 09) dan KABAR (mockup 05) — dua layar yang isinya hidup di
 * `/api/saya/*`, yang 13 dari 15 fungsinya menolak tanpa identitas Telegram.
 *
 * Bentuknya BENTUK mockup — avatar, statistik, kelompok menu; saringan dan
 * daftar — tapi diisi keadaan jujurnya: belum tersambung. Angka karangan di
 * tempat angka sungguhan adalah kebohongan yang terlihat seperti data, jadi
 * yang belum ada dicetak "—", bukan nol, dan setiap jalan buntu menunjuk ke
 * satu pekerjaan yang sama: Sambungkan Telegram.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSisaBilah } from '../gaya/jarak';
import { Blok, Butir, Chip, Kosong, Lbl, Menu, Mikro, Nil, Tombol } from '../komponen/mockup';
import { W, H, R, TALANG } from '../gaya/token';
import type { Setelan } from '../data/simpan';

type Props = { setelan: Setelan; bukaSambung: () => void; bukaPengaturan: () => void; bukaPantauan: () => void };

export function LayarProfil({ setelan, bukaSambung, bukaPengaturan, bukaPantauan }: Props) {
  const tinggiKepala = useHeaderHeight();
  const sisaBilah = useSisaBilah();
  return (
    <ScrollView style={g.akar} contentContainerStyle={{ paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 7 }}>
      <Blok>
        <View style={g.baris}>
          <View style={g.avatar}><Text style={g.avatarHuruf}>?</Text></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={g.nama}>Belum tersambung</Text>
            <Lbl polos>Identitas datang dari bot Telegram</Lbl>
            <View style={{ marginTop: 5, alignSelf: 'flex-start' }}><Chip teks="Gratis" /></View>
          </View>
        </View>
        <View style={g.statistik}>
          <View style={g.sel}><Nil besar>—</Nil><Lbl polos>Analisa dibaca</Lbl></View>
          <View style={g.sel}><Nil besar>—</Nil><Lbl polos>Pantauan aktif</Lbl></View>
          <View style={g.sel}><Nil besar>—</Nil><Lbl polos>Hari beruntun</Lbl></View>
        </View>
        <View style={{ marginTop: 10 }}>
          <Tombol teks="Sambungkan Telegram" onPress={bukaSambung} />
        </View>
      </Blok>

      <Lbl gaya={{ marginTop: 2 }}>Bawaan saat app dibuka</Lbl>
      <Menu>
        <Butir simbol={setelan.pasar} nama="Pasar" ket={setelan.pasar} ketMono onPress={bukaPengaturan} pertama />
        <Butir ikon="kalender" nama="Timeframe" ket={setelan.tf.toLowerCase()} ketMono onPress={bukaPengaturan} />
        <Butir ikon="analisis" nama="Mesin" ket={setelan.mesin === '' ? 'pertama' : setelan.mesin} ketMono onPress={bukaPengaturan} />
      </Menu>

      <Lbl gaya={{ marginTop: 2 }}>Pantauan</Lbl>
      <Menu>
        <Butir ikon="kabar" nama="Pantauan aktif" ket="butuh Telegram" onPress={bukaPantauan} pertama />
        <Butir ikon="kalender" nama="Jam sunyi" ket="butuh Telegram" onPress={bukaSambung} />
      </Menu>

      <Lbl gaya={{ marginTop: 2 }}>Akun</Lbl>
      <Menu>
        <Butir ikon="plus" nama="Kelola langganan" ket="butuh Telegram" onPress={bukaSambung} pertama />
      </Menu>

      <Mikro>Setelan bawaan tersimpan di perangkat ini. Yang lain menunggu sambungan Telegram.</Mikro>
    </ScrollView>
  );
}

/** KABAR — mockup 05, dalam keadaan belum tersambung (mockup 15). */
export function LayarKabar({ bukaSambung }: { bukaSambung: () => void }) {
  const tinggiKepala = useHeaderHeight();
  const sisaBilah = useSisaBilah();
  return (
    <View style={[g.akar, { paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG }]}>
      <View style={g.chips}>
        <Chip teks="Semua" on /><Chip teks="Setup" /><Chip teks="Pantauan" /><Chip teks="Berita" />
      </View>
      <Kosong
        ikon="kabar"
        judul="Belum ada kabar"
        kalimat="Kabar datang dari pantauan yang kamu pasang, dan pantauan hidup di akun Telegram-mu. Sambungkan dulu, dan kabarnya masuk ke sini."
        aksi={bukaSambung}
        labelAksi="Sambungkan Telegram"
        catatan="Gratis sampai 3 pantauan"
      />
    </View>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  baris: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: W.kartuTerang, borderWidth: 1, borderColor: W.garis },
  avatarHuruf: { fontSize: 15, fontWeight: '700', color: W.teksSamar },
  nama: { fontSize: H.pasar, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.2 },
  statistik: { flexDirection: 'row', gap: 6, marginTop: 9 },
  sel: { flex: 1, backgroundColor: W.kartuTerang, borderWidth: 1, borderColor: W.garis, borderRadius: R.besar, padding: 7 },
  chips: { flexDirection: 'row', gap: 4 },
});
