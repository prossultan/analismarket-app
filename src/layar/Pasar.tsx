/**
 * HALAMAN 1 — PASAR.
 *
 * Aturan saring dan urutnya disalin dari `DaftarPasar.tsx` di web, bukan
 * dikarang ulang: dua permukaan yang mengurutkan daftar yang sama dengan cara
 * berbeda membuat orang mengira salah satunya kehilangan pasar.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { ambilPasar, type Pasar } from '../data/api';
import { angka, kategoriTersedia, labelJenis, labelKategori, ubah } from '../data/tampil';
import { Kosong, Memuat } from '../komponen/dasar';
import { W, H, J, R, ANGKA, SENTUH, TINGGI_BARIS } from '../gaya/token';

type Props = { buka: (p: Pasar) => void; terpilih?: string };

export function LayarPasar({ buka, terpilih }: Props) {
  const [daftar, setDaftar] = useState<Pasar[]>([]);
  const [keadaan, setKeadaan] = useState<'memuat' | 'ada' | 'gagal'>('memuat');
  const [sebab, setSebab] = useState('');
  const [cari, setCari] = useState('');
  const [jenis, setJenis] = useState('semua');
  const [kategori, setKategori] = useState('semua');
  const [menyegarkan, setMenyegarkan] = useState(false);

  const muat = useCallback(async (segarkan = false): Promise<void> => {
    const j = await ambilPasar(segarkan);
    if (j.ok) { setDaftar(j.isi.pasar); setKeadaan('ada'); }
    else { setKeadaan('gagal'); setSebab(j.kalimat); }
  }, []);

  useEffect(() => { void muat(); }, [muat]);

  const jenisAda = useMemo(() => ['semua', ...new Set(daftar.map((p) => p.jenis))], [daftar]);
  const kategoriAda = useMemo(() => kategoriTersedia(daftar), [daftar]);

  const terlihat = useMemo(() => {
    const q = cari.trim().toUpperCase();
    const saring = daftar.filter((p) =>
      (jenis === 'semua' || p.jenis === jenis) &&
      (kategori === 'semua' || p.kategori === kategori) &&
      /* Substring, bukan awalan: "doge", "usdt", dan "arb" semuanya harus ketemu. */
      (q === '' || p.simbol.toUpperCase().includes(q) || p.label.toUpperCase().includes(q)));
    /* Volume 24 jam menurun — bukan abjad. Yang ramai dicari lebih sering. */
    return [...saring].sort((a, b) => b.volume24hUsd - a.volume24hUsd);
  }, [daftar, cari, jenis, kategori]);

  if (keadaan === 'memuat') return <Memuat teks="Mengambil daftar pasar…" />;
  if (keadaan === 'gagal') return <Kosong judul="Daftar pasar tidak terbaca" sebab={sebab} aksi={() => { void muat(true); }} />;

  return (
    <View style={g.akar}>
      <TextInput
        style={g.cari}
        value={cari}
        onChangeText={setCari}
        placeholder={`Cari dari ${String(daftar.length)} pasar…`}
        placeholderTextColor={W.teksSamar}
        autoCorrect={false}
        autoCapitalize="characters"
      />

      {jenisAda.length > 2 && (
        <Saringan pilihan={jenisAda} nilai={jenis} pilih={setJenis} label={(k) => (k === 'semua' ? 'semua' : labelJenis(k))} />
      )}
      {kategoriAda.length > 2 && (
        <Saringan pilihan={kategoriAda} nilai={kategori} pilih={setKategori} label={(k) => (k === 'semua' ? 'semua' : labelKategori(k))} />
      )}

      <FlatList
        data={terlihat}
        keyExtractor={(p) => p.simbol}
        initialNumToRender={14}
        windowSize={7}
        refreshControl={
          <RefreshControl
            refreshing={menyegarkan}
            tintColor={W.teksRedup}
            onRefresh={() => {
              setMenyegarkan(true);
              void muat(true).finally(() => { setMenyegarkan(false); });
            }}
          />
        }
        ListEmptyComponent={
          <Kosong
            judul="Tidak ada pasar yang cocok"
            sebab={`Tidak ada yang cocok dengan "${cari}"${kategori === 'semua' ? '' : ` di ${labelKategori(kategori)}`}.`}
          />
        }
        ListFooterComponent={
          terlihat.length === 0 ? null : (
            <Text style={g.kaki}>
              {terlihat.length} dari {daftar.length} pasar · urut volume 24 jam · harga dari satu panggilan bursa
            </Text>
          )
        }
        renderItem={({ item }) => <BarisPasar p={item} aktif={item.simbol === terpilih} tekan={() => { buka(item); }} />}
      />
    </View>
  );
}

/**
 * Baris saringan.
 *
 * `ScrollView`, BUKAN `FlatList`. Versi pertama memakai FlatList horizontal
 * ber-`flexGrow: 0`, dan tinggi barisnya diturunkan dari pengukuran
 * virtualisasi — huruf berekor ("g" di "emas & forex", "p" di "kripto")
 * terpangkas di bawah. Terlihat di tangkapan layar HP, tidak terlihat sama
 * sekali dari kode.
 *
 * Dua hal yang membuat tingginya sekarang pasti, dan keduanya perlu:
 *   - `lineHeight` eksplisit, jadi kotak teksnya tidak ditebak platform
 *   - `minHeight` yang dihitung dari padding + lineHeight, bukan angka bulat
 *     yang kebetulan cukup di satu HP
 *
 * Jumlah chip-nya paling banyak sembilan, jadi virtualisasi memang tidak
 * pernah dibutuhkan — ia cuma membawa cara gagal yang baru.
 */
function Saringan({ pilihan, nilai, pilih, label }: {
  pilihan: string[]; nilai: string; pilih: (k: string) => void; label: (k: string) => string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={g.saringBaris}
      contentContainerStyle={g.saringIsi}
    >
      {pilihan.map((item) => {
        const on = item === nilai;
        return (
          <Pressable key={item} onPress={() => { pilih(item); }} style={[g.chip, on && g.chipOn]}>
            {/* Terpilih memakai PUTIH, bukan emas. Emas cuma untuk AM+. */}
            <Text numberOfLines={1} style={[g.chipTeks, on && g.chipTeksOn]}>{label(item)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/**
 * Baris pasar — bentuk `.baris-pasar-m` di web mobile.
 *
 * Grid lima kolom, tinggi minimum 52, padding 14, garis kiri 2px yang menyala
 * putih saat aktif. Kolom volume TIDAK ada di web, dan tidak ada di sini:
 * daftarnya memang sudah diurut volume, jadi mencetak angkanya lagi di tiap
 * baris menambah kolom tanpa menambah keputusan.
 */
function BarisPasar({ p, aktif, tekan }: { p: Pasar; aktif: boolean; tekan: () => void }) {
  const u = p.ubah24hPersen;
  const warna = u === null ? W.teksSamar : u > 0 ? W.naik : u < 0 ? W.turun : W.teksSamar;
  return (
    <Pressable onPress={tekan} style={({ pressed }) => [g.baris, aktif && g.barisAktif, pressed && g.barisTekan]}>
      <Text style={g.nm} numberOfLines={1}>{p.simbol}</Text>
      <Text style={g.tag} numberOfLines={1}>{p.label}</Text>
      <View style={{ flex: 1 }} />
      {/* null = tidak diketahui (emas & forex tidak berharga di endpoint ini) */}
      <Text style={g.harga}>{angka(p.harga, p.desimal)}</Text>
      <Text style={[g.ubahTeks, { color: warna }]}>{ubah(u)}</Text>
    </Pressable>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  cari: {
    marginHorizontal: 14, marginTop: J.x3, marginBottom: J.x2, paddingHorizontal: J.x3, height: SENTUH,
    backgroundColor: W.kartu, borderRadius: R.besar, borderWidth: 1, borderColor: W.garis,
    color: W.teksKuat, fontSize: 16,
  },
  /* 6 + 6 padding + 16 lineHeight + 2 garis = 30. Diturunkan dari isinya,
     bukan angka yang kebetulan cukup di satu HP. */
  saringBaris: { flexGrow: 0, flexShrink: 0, marginBottom: J.x2 },
  saringIsi: { paddingHorizontal: 14, gap: 6, alignItems: 'center' },
  chip: {
    paddingVertical: 6, paddingHorizontal: J.x3, borderRadius: R.sedang,
    borderWidth: 1, borderColor: W.garis, backgroundColor: W.kartu,
    minHeight: 30, justifyContent: 'center',
  },
  chipOn: { backgroundColor: W.teksKuat, borderColor: W.teksKuat },
  chipTeks: { fontSize: H.kontrol, lineHeight: 16, color: W.teksRedup },
  chipTeksOn: { color: W.latar, fontWeight: '500' },
  /* 52px dan padding 14 — angka `.baris-pasar-m`, bukan angka baru. */
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
  kaki: { fontSize: H.label, color: W.teksSamar, textAlign: 'center', padding: J.x4 },
});
