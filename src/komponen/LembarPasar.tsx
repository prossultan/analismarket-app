/**
 * LEMBAR PASAR — mockup 03: daftar pasar sebagai lembar KACA di atas chart.
 *
 * Pasar bukan halaman. Memilih pasar dan membacanya adalah satu gerakan;
 * lembar ini naik di atas chart yang sama, dan chart di baliknya tetap
 * terlihat lewat kacanya — pasar tidak pernah jadi halaman kosong yang
 * melempar balik.
 *
 * Urutan: yang terpilih dipatok di atas supaya tidak hilang saat disaring,
 * lalu volume 24 jam menurun. Aturan `DaftarPasar.tsx` di web.
 */
import { useMemo, useState } from 'react';
import { gayaTema } from '../gaya/tema';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Lembar } from './Lembar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSisaBilah } from '../gaya/jarak';
import type { Pasar } from '../data/api';
import { angka, kategoriTersedia, labelJenis, labelKategori, ubah, volumeRingkas } from '../data/tampil';
import { BarisPasar, Chip, Lbl, Tarik } from './mockup';
import { Ikon } from './Ikon';
import { W, H, J, R, SENTUH, TALANG } from '../gaya/token';

/** Perubahan 24 jam DENGAN tanda persen — angka "−0,40" tanpa satuan terbaca sebagai harga. */
const persen = (u: number | null): string => { const t = ubah(u); return t === '—' ? t : `${t}%`; };

/** Chip saringan berhuruf kapital di depan, seperti mockup — labelnya datang dari data dalam huruf kecil. */
const kapital = (t: string): string => t.charAt(0).toUpperCase() + t.slice(1);

type Props = {
  daftar: Pasar[];
  terpilih: string;
  pilih: (p: Pasar) => void;
  tutup: () => void;
  /** Dipasang selalu; ini yang membuka/menutup — supaya animasi keluarnya sempat jalan. */
  terbuka: boolean;
};

export function LembarPasar({ daftar, terpilih, pilih, tutup, terbuka }: Props) {
  const { height: tinggiLayar } = useWindowDimensions();
  const { top } = useSafeAreaInsets();
  const sisaBilah = useSisaBilah();
  const [cari, setCari] = useState('');
  const [jenis, setJenis] = useState('semua');
  const [kategori, setKategori] = useState('semua');

  const jenisAda = useMemo(() => ['semua', ...new Set(daftar.map((p) => p.jenis))], [daftar]);
  const kategoriAda = useMemo(() => kategoriTersedia(daftar), [daftar]);
  const jumlahJenis = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of daftar) m.set(p.jenis, (m.get(p.jenis) ?? 0) + 1);
    return m;
  }, [daftar]);

  const terlihat = useMemo(() => {
    const q = cari.trim().toUpperCase();
    const saring = daftar.filter((p) =>
      (jenis === 'semua' || p.jenis === jenis) &&
      (kategori === 'semua' || p.kategori === kategori) &&
      (q === '' || p.simbol.toUpperCase().includes(q) || p.label.toUpperCase().includes(q)));
    return [...saring].sort((a, b) => {
      if (a.simbol === terpilih) return -1;
      if (b.simbol === terpilih) return 1;
      return b.volume24hUsd - a.volume24hUsd;
    });
  }, [daftar, cari, jenis, kategori, terpilih]);

  return (
    /* Tirai tipis: chart di baliknya masih terlihat — itu tujuannya. Tinggi
       lembar dihitung dari layar supaya daftarnya tetap punya batas gulir. */
    <Lembar terbuka={terbuka} onTutup={tutup} tirai="tipis" labelTutup="Tutup daftar pasar"
      gaya={{ height: tinggiLayar - (top + 96) - (sisaBilah - 8) }}
      gayaLuar={{ paddingBottom: sisaBilah - 8 }}
      kepala={<Pressable onPress={tutup}><Tarik kata="tarik turun untuk menutup" turun /></Pressable>}>

          {/* Cari — mockup 28. */}
          <View style={g.cari}>
            <Ikon nama="cari" warna={W.teksSamar} ukuran={17} />
            <TextInput
              value={cari}
              onChangeText={setCari}
              placeholder={`Cari dari ${String(daftar.length)} pasar…`}
              placeholderTextColor={W.teksSamar}
              style={g.cariIsi}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="search"
              accessibilityLabel="Cari pasar"
            />
            {cari !== '' && <Chip teks="Batal" onPress={() => { setCari(''); }} />}
          </View>

          <View style={g.chips}>
            {jenisAda.map((j) => (
              <Chip key={j} teks={j === 'semua' ? 'Semua' : `${kapital(labelJenis(j))} ${String(jumlahJenis.get(j) ?? 0)}`} on={jenis === j}
                onPress={() => { setJenis(j); setKategori('semua'); }} />
            ))}
            {jenis !== 'semua' && kategoriAda.length > 1 && kategoriAda.map((k) => (
              <Chip key={`k-${k}`} teks={kapital(labelKategori(k))} on={kategori === k} onPress={() => { setKategori(k); }} />
            ))}
          </View>

          {cari !== '' && (
            <Lbl gaya={{ paddingHorizontal: TALANG, paddingTop: 6 }}>{String(terlihat.length)} pasar cocok</Lbl>
          )}

          <FlatList
            data={terlihat}
            keyExtractor={(p) => p.simbol}
            /* 131 baris: render 14 dulu, sisanya per gulir. Tanpa ini lembar
               terbuka dengan jeda terasa di HP — semua baris dirakit sekaligus. */
            initialNumToRender={14}
            maxToRenderPerBatch={12}
            windowSize={7}
            removeClippedSubviews
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: TALANG, paddingBottom: J.x4 }}
            renderItem={({ item, index }) => {
              const u = item.ubah24hPersen;
              const warna = u === null ? W.teksSamar : u > 0 ? W.naik : u < 0 ? W.turun : W.teksSamar;
              /* HARGA KOSONG ≠ PASAR TUTUP. `/api/pasar` SELALU mengirim
                 `harga: null` untuk emas & forex, dan sejak bot 6d7a4d5 juga
                 untuk kripto saat bursa tidak menjawab dalam 5 detik. Dulu
                 baris ini menulis "· tutup" dan meredup — XAU/USD tercetak
                 tutup di Jumat sore saat pasarnya buka. Yang tidak diketahui
                 dicetak "—"; buka/tutup tidak ada di data ini. */
              const tanpaHarga = item.harga === null;
              return (
                <BarisPasar
                  simbol={item.simbol}
                  label={item.volume24hUsd > 0 ? `${item.label} · vol ${volumeRingkas(item.volume24hUsd)}` : item.label}
                  harga={tanpaHarga ? '—' : angka(item.harga, item.desimal)}
                  ubah={tanpaHarga ? '—' : persen(u)}
                  ubahWarna={warna}
                  pertama={index === 0}
                  terpilih={item.simbol === terpilih}
                  lencana={item.simbol === terpilih ? 'dibuka' : undefined}
                  onPress={() => { pilih(item); tutup(); }}
                />
              );
            }}
            ListEmptyComponent={
              <View style={g.kosong}>
                <Text style={g.kosongJudul}>Tidak ketemu</Text>
                <Text style={g.kosongKet}>
                  {String(daftar.length)} pasar yang ada semuanya sudah dibaca bot. Pasar di luar daftar
                  itu belum punya model biaya, dan tanpa model biaya RR bersihnya tidak bisa dihitung jujur.
                </Text>
              </View>
            }
          />
    </Lembar>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  cari: {
    flexDirection: 'row', alignItems: 'center', gap: 9, marginHorizontal: TALANG,
    minHeight: SENTUH, paddingHorizontal: 13, borderRadius: R.besar,
    backgroundColor: W.isiSamar, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, borderTopColor: W.kacaKilau,
  },
  cariIsi: { flex: 1, color: W.teksKuat, fontSize: 14, paddingVertical: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: TALANG, paddingVertical: 10 },
  kosong: { paddingVertical: 26, paddingHorizontal: J.x3, gap: 5 },
  kosongJudul: { fontSize: H.pasar, fontWeight: '600', color: W.teksKuat },
  kosongKet: { fontSize: H.alat, color: W.teksRedup, lineHeight: 14 },
}));
