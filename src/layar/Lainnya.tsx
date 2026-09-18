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
import { Pressable } from 'react-native';
import { Kartu, Baris, Pisah } from '../komponen/dasar';
import { W, H, J } from '../gaya/token';
import type { Setelan } from '../data/simpan';

type Props = {
  setelan: Setelan;
  bukaDokumen: (k: 'syarat' | 'privasi') => void;
  bukaBelajar: () => void;
  versi: string;
};

const BELUM: ReadonlyArray<{ nama: string; sebab: string }> = [
  { nama: 'Pantauan', sebab: 'butuh akun yang tersambung' },
  { nama: 'Kabar Otomatis', sebab: 'butuh akun yang tersambung' },
  { nama: 'Setelan modal & risiko', sebab: 'tersimpan di akun, bukan di HP' },
  { nama: 'Berlangganan dari app', sebab: 'menyusul' },
];

export function LayarLainnya({ setelan, bukaDokumen, bukaBelajar, versi }: Props) {
  return (
    <ScrollView style={g.akar} contentContainerStyle={{ paddingVertical: J.x3 }}>
      {/* Belajar pindah ke sini dari tab: isinya berharga, tapi ia dibaca
          sekali-dua kali, bukan tiap hari — dan satu dari lima tab adalah
          tempat yang mahal untuk sesuatu yang dibaca sekali. */}
      <Kartu judul="Belajar">
        <Pressable onPress={bukaBelajar} style={g.tautan}>
          <Text style={g.tautanTeks}>Cara baca kartu & istilah di chart</Text>
        </Pressable>
        <Text style={[g.catatan, { marginTop: J.x1 }]}>
          Tiga keadaan kartu, bar biaya, jarak entry, dan 16 istilah — dijelaskan menurut apa yang mesin ini maksud.
        </Text>
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

      <Kartu judul="Belum tersedia di app">
        {BELUM.map((b, i) => (
          <View key={b.nama} style={[g.belum, i > 0 && g.belumGaris]}>
            <Text style={g.belumNama}>{b.nama}</Text>
            <Text style={g.belumSebab}>{b.sebab}</Text>
          </View>
        ))}
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
  belum: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, gap: J.x3 },
  belumGaris: { borderTopWidth: 1, borderTopColor: W.garisSamar },
  belumNama: { fontSize: H.kontrol, color: W.teksRedup },
  belumSebab: { fontSize: H.label, color: W.teksSamar, flexShrink: 1, textAlign: 'right' },
  tautan: { paddingVertical: J.x1 },
  tautanTeks: { fontSize: H.kontrol, color: W.teksKuat },
});
