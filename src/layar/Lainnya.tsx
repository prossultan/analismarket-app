/**
 * HALAMAN 10 — LAINNYA: pengaturan, dokumen, dan keterangan jujur tentang
 * apa yang belum ada.
 *
 * Bagian "belum tersedia" bukan basa-basi. App ini belum punya identitas —
 * `/api/saya/*` masih menuntut akun Telegram — jadi pantauan, kabar otomatis,
 * dan setelan akun memang tidak bisa dibuka. Menyembunyikannya membuat orang
 * mencari-cari menu yang tidak ada.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { Pressable } from 'react-native';
import { Kartu, Baris, Pisah } from '../komponen/dasar';
import { Ikon, type NamaIkon } from '../komponen/Ikon';
import { W, H, J, SENTUH, SISA_BILAH } from '../gaya/token';
import type { Setelan } from '../data/simpan';

type Props = {
  setelan: Setelan;
  bukaDokumen: (k: 'syarat' | 'privasi') => void;
  bukaMenu: (kunci: string) => void;
  versi: string;
};

type Menu = { kunci: string; nama: string; ikon: NamaIkon; ket: string; emas?: boolean };

const MENU: ReadonlyArray<Menu> = [
  { kunci: 'profil', nama: 'Profil & akun', ikon: 'profil', ket: 'keadaan akun' },
  { kunci: 'pengaturan', nama: 'Pengaturan', ikon: 'gir', ket: 'bawaan saat app dibuka' },
  { kunci: 'kalender', nama: 'Kalender berita', ikon: 'kalender', ket: '14 hari ke depan' },
  { kunci: 'belajar', nama: 'Belajar', ikon: 'buku', ket: 'cara baca kartu & 16 istilah' },
  { kunci: 'plus', nama: 'AnalisMarket+', ikon: 'plus', ket: 'apa isinya', emas: true },
];

export function LayarLainnya({ setelan, bukaDokumen, bukaMenu, versi }: Props) {
  const tinggiKepala = useHeaderHeight();
  return (
    <ScrollView style={g.akar} contentContainerStyle={{ paddingTop: tinggiKepala + J.x3, paddingBottom: SISA_BILAH }}>
      <Kartu judul="Menu">
        {MENU.map((m, i) => (
          <Pressable key={m.kunci} onPress={() => { bukaMenu(m.kunci); }} style={[g.menu, i > 0 && g.menuGaris]}>
            <Ikon nama={m.ikon} warna={m.emas === true ? W.plus : W.teksRedup} ukuran={18} />
            <Text style={[g.menuNama, m.emas === true && { color: W.plus }]}>{m.nama}</Text>
            <View style={{ flex: 1 }} />
            <Text style={g.menuKet} numberOfLines={1}>{m.ket}</Text>
          </Pressable>
        ))}
      </Kartu>

      <Kartu judul="Pilihan terakhirmu">
        <Baris kiri="Pasar" kanan={setelan.pasar} />
        <Baris kiri="Timeframe" kanan={setelan.tf.toUpperCase()} />
        <Baris kiri="Mesin" kanan={setelan.mesin === '' ? 'mesin pertama' : setelan.mesin} />
        <Pisah />
        <Text style={g.catatan}>
          Disimpan di HP ini saja. App belum punya akun, jadi tidak ada tempat di server untuk menyimpannya — dan berpura-pura ikut pindah HP akan salah.
        </Text>
      </Kartu>

      <Kartu judul="Dokumen">
        <Pressable onPress={() => { bukaDokumen('syarat'); }} style={g.tautan}>
          <Text style={g.tautanTeks}>Syarat & Ketentuan</Text>
        </Pressable>
        <Pisah />
        <Pressable onPress={() => { bukaDokumen('privasi'); }} style={g.tautan}>
          <Text style={g.tautanTeks}>Kebijakan Privasi</Text>
        </Pressable>
      </Kartu>

      <Kartu judul="Tentang">
        <Text style={g.catatan}>
          analismarket membaca chart pasar dan menampilkan hasil bacaannya. Ini alat baca, bukan alat prediksi, dan bukan nasihat investasi.
        </Text>
        <Pisah />
        <Baris kiri="Versi app" kanan={versi} />
      </Kartu>
    </ScrollView>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  catatan: { fontSize: 11, color: W.teksRedup, lineHeight: 18 },
  menu: { flexDirection: 'row', alignItems: 'center', gap: J.x3, minHeight: SENTUH },
  menuGaris: { borderTopWidth: 1, borderTopColor: W.garisSamar },
  menuNama: { fontSize: H.nilai, color: W.teksKuat },
  menuKet: { fontSize: H.label, color: W.teksSamar, flexShrink: 1 },
  tautan: { minHeight: SENTUH, justifyContent: 'center' },
  tautanTeks: { fontSize: H.nilai, color: W.teksKuat },
});
