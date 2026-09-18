/**
 * LEMBAR PASAR — dibuka dari nama pasar di kepala, dan dari tab Pasar.
 *
 * Bentuk ini yang membuat web mobile terasa satu layar: memilih pasar TIDAK
 * memindahkan orang ke halaman lain lalu memulangkannya. Ia menutupi layar,
 * dipilih, lalu hilang — dan yang di belakangnya tidak pernah berubah tempat.
 *
 * Versi app pertama membuatnya jadi tab tujuan, dan itu cacat UX yang paling
 * terasa: tiap ganti pasar berarti dua perpindahan layar untuk satu keputusan.
 */
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Pasar } from '../data/api';
import { angka, kategoriTersedia, labelJenis, labelKategori, ubah } from '../data/tampil';
import { W, H, J, R, ANGKA, SENTUH, TINGGI_BARIS } from '../gaya/token';

type Props = {
  daftar: Pasar[];
  terpilih: string;
  pilih: (p: Pasar) => void;
  tutup: () => void;
};

export function LembarPasar({ daftar, terpilih, pilih, tutup }: Props) {
  const [cari, setCari] = useState('');
  const [jenis, setJenis] = useState('semua');
  const [kategori, setKategori] = useState('semua');

  const jenisAda = useMemo(() => ['semua', ...new Set(daftar.map((p) => p.jenis))], [daftar]);
  const kategoriAda = useMemo(() => kategoriTersedia(daftar), [daftar]);

  const terlihat = useMemo(() => {
    const q = cari.trim().toUpperCase();
    const saring = daftar.filter((p) =>
      (jenis === 'semua' || p.jenis === jenis) &&
      (kategori === 'semua' || p.kategori === kategori) &&
      (q === '' || p.simbol.toUpperCase().includes(q) || p.label.toUpperCase().includes(q)));
    /* Yang terpilih dipatok di atas supaya ia tidak hilang saat disaring,
       lalu volume 24 jam menurun. Aturan `DaftarPasar.tsx` di web. */
    return [...saring].sort((a, b) => {
      if (a.simbol === terpilih) return -1;
      if (b.simbol === terpilih) return 1;
      return b.volume24hUsd - a.volume24hUsd;
    });
  }, [daftar, cari, jenis, kategori, terpilih]);

  return (
    <Modal visible animationType="slide" onRequestClose={tutup} statusBarTranslucent>
      <SafeAreaView style={g.akar} edges={['top', 'bottom']}>
        <View style={g.kepala}>
          <Text style={g.judul}>Pasar</Text>
          <View style={{ flex: 1 }} />
          <Pressable onPress={tutup} style={g.tutup}>
            <Text style={g.tutupTeks}>tutup</Text>
          </Pressable>
        </View>

        <TextInput
          style={g.cari}
          value={cari}
          onChangeText={setCari}
          placeholder={`Cari dari ${String(daftar.length)} pasar…`}
          placeholderTextColor={W.teksSamar}
          autoCorrect={false}
          autoCapitalize="characters"
          autoFocus
        />

        {jenisAda.length > 2 && <Saring pilihan={jenisAda} nilai={jenis} pilih={setJenis} label={(k) => (k === 'semua' ? 'semua' : labelJenis(k))} />}
        {kategoriAda.length > 2 && <Saring pilihan={kategoriAda} nilai={kategori} pilih={setKategori} label={(k) => (k === 'semua' ? 'semua' : labelKategori(k))} />}

        <FlatList
          data={terlihat}
          keyExtractor={(p) => p.simbol}
          initialNumToRender={14}
          windowSize={7}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={g.kosong}>
              Tidak ada pasar yang cocok dengan &quot;{cari}&quot;{kategori === 'semua' ? '' : ` di ${labelKategori(kategori)}`}.
            </Text>
          }
          ListFooterComponent={
            terlihat.length === 0 ? null : (
              <Text style={g.kaki}>{terlihat.length} dari {daftar.length} pasar · urut volume 24 jam</Text>
            )
          }
          renderItem={({ item }) => {
            const u = item.ubah24hPersen;
            const warna = u === null ? W.teksSamar : u > 0 ? W.naik : u < 0 ? W.turun : W.teksSamar;
            const aktif = item.simbol === terpilih;
            return (
              <Pressable
                onPress={() => { pilih(item); tutup(); }}
                style={({ pressed }) => [g.baris, aktif && g.barisAktif, pressed && g.barisTekan]}
              >
                <Text style={g.nm} numberOfLines={1}>{item.simbol}</Text>
                <Text style={g.tag} numberOfLines={1}>{item.label}</Text>
                <View style={{ flex: 1 }} />
                <Text style={g.harga}>{angka(item.harga, item.desimal)}</Text>
                <Text style={[g.ubahTeks, { color: warna }]}>{ubah(u)}</Text>
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

function Saring({ pilihan, nilai, pilih, label }: {
  pilihan: string[]; nilai: string; pilih: (k: string) => void; label: (k: string) => string;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={g.saringBaris} contentContainerStyle={g.saringIsi}>
      {pilihan.map((item) => {
        const on = item === nilai;
        return (
          <Pressable key={item} onPress={() => { pilih(item); }} style={[g.chip, on && g.chipOn]}>
            <Text numberOfLines={1} style={[g.chipTeks, on && g.chipTeksOn]}>{label(item)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  kepala: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, minHeight: SENTUH },
  judul: { fontSize: H.status, fontWeight: '700', color: W.teksKuat },
  tutup: { minHeight: SENTUH, paddingHorizontal: J.x2, justifyContent: 'center' },
  tutupTeks: { fontSize: H.nilai, color: W.teksRedup },
  cari: {
    marginHorizontal: 14, marginBottom: J.x2, paddingHorizontal: J.x3, height: SENTUH,
    backgroundColor: W.latar900, borderRadius: R.sedang, borderWidth: 1, borderColor: W.garis,
    color: W.teksKuat, fontSize: 16,
  },
  saringBaris: { flexGrow: 0, flexShrink: 0, marginBottom: J.x2 },
  saringIsi: { paddingHorizontal: 14, gap: 6, alignItems: 'center' },
  chip: {
    paddingVertical: 6, paddingHorizontal: J.x3, borderRadius: R.sedang,
    borderWidth: 1, borderColor: W.garis, backgroundColor: W.kartu,
    minHeight: 30, justifyContent: 'center',
  },
  chipOn: { backgroundColor: W.teksKuat, borderColor: W.teksKuat },
  chipTeks: { fontSize: H.nilai, lineHeight: 16, color: W.teksRedup },
  chipTeksOn: { color: W.latar, fontWeight: '500' },
  baris: {
    flexDirection: 'row', alignItems: 'center', minHeight: TINGGI_BARIS,
    paddingHorizontal: 14, gap: J.x2,
    borderBottomWidth: 1, borderBottomColor: W.kartu,
    borderLeftWidth: 2, borderLeftColor: 'transparent',
  },
  barisAktif: { backgroundColor: W.kartu, borderLeftColor: W.teksKuat },
  barisTekan: { backgroundColor: W.kartu },
  nm: { fontSize: H.pasar, fontWeight: '500', color: W.teksKuat },
  tag: { fontSize: H.label, color: W.teksRedup, flexShrink: 1 },
  harga: { fontSize: H.pasar, color: W.teksKuat, ...ANGKA },
  ubahTeks: { fontSize: H.label, minWidth: 44, textAlign: 'right', ...ANGKA },
  kosong: { fontSize: H.nilai, color: W.teksRedup, padding: J.x5, textAlign: 'center' },
  kaki: { fontSize: H.label, color: W.teksSamar, textAlign: 'center', padding: J.x4 },
});
