/**
 * LAINNYA — mockup 10: tiga kelompok bernama, plus blok umur data.
 *
 * "Ini angka kapan" muncul terus, dan jawabannya sebelumnya tidak ada di
 * mana pun. Blok umur data di bawah menjawabnya untuk seluruh app.
 */
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSisaBilah, useTinggiKepala } from '../gaya/jarak';
import { Blok, Butir, Lbl, Menu, Mikro, Nil } from '../komponen/mockup';
import { Merek } from '../komponen/Merek';
import { useSesi } from './Akun';
import { jamWib } from '../data/tampil';
import { W, TALANG } from '../gaya/token';
import type { Setelan } from '../data/simpan';

export type KunciMenu = 'kalender' | 'belajar' | 'profil' | 'pengaturan' | 'tentang' | 'pantauan' | 'sambung';

type Props = {
  setelan: Setelan;
  bukaDokumen: (k: 'syarat' | 'privasi') => void;
  bukaMenu: (kunci: KunciMenu) => void;
  versi: string;
  /** Detik epoch kapan data terakhir masuk; null = belum ada. */
  umur?: { harga: number | null; lilin: number | null; kalender: number | null };
};

export function LayarLainnya({ setelan, bukaDokumen, bukaMenu, versi, umur }: Props) {
  /* Dulu "belum tersambung" DIKETIK — jadi sesudah orang menyambung, menu
     ini tetap bilang belum. Pemilik melihatnya di HP sebagai "AM+ tidak
     terbawa". Keterangan baris harus ikut sesi. */
  const sesi = useSesi();
  const tinggiKepala = useTinggiKepala();
  const sisaBilah = useSisaBilah();
  const jam = (d: number | null): string => (d === null ? '—' : jamWib(d));
  return (
    <ScrollView style={g.akar} contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 7 }}>
      <Lbl>Baca</Lbl>
      <Menu>
        <Butir ikon="kalender" nama="Kalender berita" ket="30 hari" onPress={() => { bukaMenu('kalender'); }} pertama />
        <Butir ikon="buku" nama="Belajar" ket="16 istilah" onPress={() => { bukaMenu('belajar'); }} />
      </Menu>

      <Lbl gaya={{ marginTop: 2 }}>Akun</Lbl>
      <Menu>
        <Butir ikon="profil" nama="Profil"
          ket={sesi === null ? 'belum tersambung' : sesi.akun.langganan === 'plus' ? 'AM+' : sesi.akun.nama ?? 'tersambung'}
          ketEmas={sesi?.akun.langganan === 'plus'} onPress={() => { bukaMenu('profil'); }} pertama />
        <Butir ikon="kabar" nama="Pantauan" ket={sesi === null ? 'butuh Telegram' : sesi.jenis === 'clerk' ? 'tautkan Telegram' : 'aktif'} onPress={() => { bukaMenu('pantauan'); }} />
        <Butir ikon="gir" nama="Pengaturan" ket={`${setelan.tf.toLowerCase()} · ${setelan.pasar}`} ketMono onPress={() => { bukaMenu('pengaturan'); }} />
      </Menu>

      <Lbl gaya={{ marginTop: 2 }}>Dokumen</Lbl>
      <Menu>
        <Butir ikon="buku" nama="Syarat & Ketentuan" onPress={() => { bukaDokumen('syarat'); }} pertama />
        <Butir ikon="buku" nama="Kebijakan Privasi" onPress={() => { bukaDokumen('privasi'); }} />
        <Butir ikon="lainnya" nama="Tentang AnalisMarket" ket={`v${versi}`} ketMono onPress={() => { bukaMenu('tentang'); }} />
      </Menu>

      <Blok gaya={{ flex: 1, justifyContent: 'center' }}>
        <Merek sub={`v${versi} · Binance & Twelve Data`} />
        <Lbl gaya={{ marginTop: 10 }}>Data terakhir masuk</Lbl>
        <View style={g.umur}>
          <View><Nil>{jam(umur?.harga ?? null)}</Nil><Lbl polos>Harga</Lbl></View>
          <View><Nil>{jam(umur?.lilin ?? null)}</Nil><Lbl polos>Lilin</Lbl></View>
          <View><Nil>{jam(umur?.kalender ?? null)}</Nil><Lbl polos>Kalender</Lbl></View>
        </View>
      </Blok>

      <Mikro>Analisa teknikal otomatis. Bukan nasihat investasi.</Mikro>
    </ScrollView>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  umur: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
});
