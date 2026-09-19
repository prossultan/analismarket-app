/**
 * HOME — mockup 01.
 *
 * Kepala: kunci merek (di App.tsx). Isi: kartu pasar utama dengan lambang,
 * pita empat angka, daftar "Yang bergerak" yang memanjang sampai lewat di
 * bawah bilah tab — dan itu bukan kebetulan: daftar itulah bahan yang
 * dikaburkan kacanya.
 *
 * Tidak ada kartu Menu di sini. Menu punya rumah di tab Lainnya; mengulangnya
 * di Home berarti dua tempat yang bisa berbeda isi.
 */
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSisaBilah } from '../gaya/jarak';
import { ambilBacaan, ambilPasar, syaratWajib, type Mesin, type Pasar } from '../data/api';
import { angka, ubah } from '../data/tampil';
import { LambangPasar } from '../komponen/LambangPasar';
import { BarisPasar, Blok, Chip, Harga, Lbl, Mikro, Nil, Rangka } from '../komponen/mockup';
import { W, H, TALANG } from '../gaya/token';
import type { Setelan } from '../data/simpan';

type Props = { setelan: Setelan; bukaChart: (p: Pasar) => void; bukaPasar: () => void };

function Angka({ label, nilai, warna }: { label: string; nilai: string; warna?: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Lbl>{label}</Lbl>
      <Nil besar warna={warna} gaya={{ marginTop: 2 }}>{nilai}</Nil>
    </View>
  );
}

export function LayarHome({ setelan, bukaChart, bukaPasar }: Props) {
  const tinggiKepala = useHeaderHeight();
  const sisaBilah = useSisaBilah();
  const [pasar, setPasar] = useState<Pasar | null>(null);
  const [teratas, setTeratas] = useState<ReadonlyArray<Pasar>>([]);
  const [jumlahPasar, setJumlahPasar] = useState(0);
  const [mesin, setMesin] = useState<Mesin | null>(null);
  const [ringkas, setRingkas] = useState<{ setup: number; pantau: number; mesin: number } | null>(null);
  const [harga, setHarga] = useState<number | null>(null);
  const [siap, setSiap] = useState(false);
  const [menyegarkan, setMenyegarkan] = useState(false);

  const muat = useCallback(async (segarkan = false): Promise<void> => {
    const j = await ambilPasar(segarkan);
    if (!j.ok) { setSiap(true); return; }
    const p = j.isi.pasar.find((x) => x.simbol === setelan.pasar) ?? j.isi.pasar[0] ?? null;
    setPasar(p);
    setJumlahPasar(j.isi.pasar.length);
    setTeratas([...j.isi.pasar].filter((x) => x.simbol !== p?.simbol)
      .sort((a, b) => (b.volume24hUsd ?? 0) - (a.volume24hUsd ?? 0)).slice(0, 12));
    if (p === null) { setSiap(true); return; }
    const punya = p.timeframes.map((t) => t.toLowerCase());
    const tf = punya.includes(setelan.tf) ? setelan.tf : (punya[0] ?? 'h1');
    const b = await ambilBacaan(p.simbol, tf, segarkan);
    if (b.ok) {
      setHarga(b.isi.harga);
      setMesin(b.isi.mesin.find((m) => m.mesin === setelan.mesin) ?? b.isi.mesin[0] ?? null);
      setRingkas({
        setup: b.isi.mesin.filter((m) => m.status.toUpperCase() === 'SETUP').length,
        pantau: b.isi.mesin.filter((m) => m.status.toUpperCase() === 'PANTAU').length,
        mesin: b.isi.mesin.length,
      });
    }
    setSiap(true);
  }, [setelan]);
  useEffect(() => { void muat(); }, [muat]);

  const wajib = mesin === null ? [] : syaratWajib(mesin);
  const lolos = wajib.filter((c) => c.lolos).length;
  const u = pasar?.ubah24hPersen ?? null;
  const warnaUbah = u === null ? W.teksSamar : u > 0 ? W.naik : u < 0 ? W.turun : W.teksSamar;

  return (
    <ScrollView
      style={g.akar}
      contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 7 }}
      refreshControl={<RefreshControl refreshing={menyegarkan} tintColor={W.teksRedup}
        onRefresh={() => { setMenyegarkan(true); void muat(true).finally(() => { setMenyegarkan(false); }); }} />}
    >
      {/* Kartu pasar utama. Rangka saat belum siap — bentuk isi yang akan datang. */}
      {!siap || pasar === null ? (
        <Blok>
          <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}><Rangka lebar={24} tinggi={24} gaya={{ borderRadius: 12 }} /><Rangka lebar={90} tinggi={11} /></View>
          <Rangka lebar="52%" tinggi={19} gaya={{ marginTop: 9 }} />
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}><Rangka lebar={56} tinggi={22} gaya={{ borderRadius: 11 }} /><Rangka lebar={64} tinggi={22} gaya={{ borderRadius: 11 }} /></View>
        </Blok>
      ) : (
        <Pressable onPress={() => { bukaChart(pasar); }} accessibilityRole="button" accessibilityLabel={`Buka chart ${pasar.simbol}`}>
          <Blok>
            <View style={g.baris}>
              <LambangPasar simbol={pasar.simbol} ukuran={22} />
              <View style={{ minWidth: 0, flex: 1 }}>
                <Text style={g.simbol} numberOfLines={1}>{pasar.simbol}</Text>
                <Lbl polos>{pasar.label}</Lbl>
              </View>
              <Chip teks={setelan.tf.toLowerCase()} mono />
            </View>
            <View style={[g.baris, { marginTop: 7, alignItems: 'baseline' }]}>
              <Harga>{angka(harga ?? pasar.harga, pasar.desimal)}</Harga>
              <Text style={[g.ubah, { color: warnaUbah }]}>{ubah(u)}</Text>
            </View>
            <View style={[g.baris, { marginTop: 8 }]}>
              {ringkas !== null && <Chip teks={`${String(ringkas.setup)} setup`} on={ringkas.setup > 0} />}
              {ringkas !== null && <Chip teks={`${String(ringkas.pantau)} pantau`} />}
              {mesin !== null && <Lbl polos>{mesin.mesin} {lolos}/{wajib.length}</Lbl>}
            </View>
          </Blok>
        </Pressable>
      )}

      {/* Pita empat angka: "ada yang perlu dilihat atau tidak". */}
      <Blok rapat gaya={{ paddingHorizontal: 10 }}>
        <View style={g.baris}>
          <Angka label="Setup" nilai={ringkas === null ? '—' : String(ringkas.setup)} warna={ringkas !== null && ringkas.setup > 0 ? W.naik : undefined} />
          <Angka label="Pantau" nilai={ringkas === null ? '—' : String(ringkas.pantau)} />
          <Angka label="Mesin" nilai={ringkas === null ? '—' : String(ringkas.mesin)} />
          <Angka label="Pasar" nilai={jumlahPasar === 0 ? '—' : String(jumlahPasar)} />
        </View>
      </Blok>

      {/* Yang bergerak — urut volume 24 jam. flex:1 supaya ia mengisi sisa
          tinggi layar; ruang kosong di app data bukan kelegaan. */}
      <Blok gaya={{ flex: 1 }}>
        <View style={[g.baris, { justifyContent: 'space-between' }]}>
          <Lbl>Yang bergerak</Lbl>
          <Pressable onPress={bukaPasar} hitSlop={8}><Lbl polos>vol 24 jam ›</Lbl></Pressable>
        </View>
        <View style={{ marginTop: 2 }}>
          {teratas.length === 0 && [0, 1, 2, 3].map((i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 9 }}>
              <Rangka lebar={22} tinggi={22} gaya={{ borderRadius: 11 }} /><Rangka lebar="40%" tinggi={10} />
              <View style={{ flex: 1 }} /><Rangka lebar={56} tinggi={10} />
            </View>
          ))}
          {teratas.map((x, i) => {
            const v = x.ubah24hPersen;
            return (
              <BarisPasar key={x.simbol} simbol={x.simbol} label={x.label}
                harga={angka(x.harga, x.desimal)} ubah={ubah(v)}
                ubahWarna={v === null ? W.teksSamar : v > 0 ? W.naik : v < 0 ? W.turun : W.teksSamar}
                pertama={i === 0} onPress={() => { bukaChart(x); }} />
            );
          })}
        </View>
      </Blok>

      <Mikro>Alat baca chart, bukan alat prediksi. Bukan ajakan melakukan transaksi.</Mikro>
    </ScrollView>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  baris: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  simbol: { fontSize: H.nilai, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.1 },
  ubah: { fontSize: H.nilai, fontVariant: ['tabular-nums'] },
});
