/**
 * HALAMAN 7 — KALENDER BERITA.
 *
 * `/api/jadwal-berita` sudah melayani pengunjung anonim sejak lama dan BELUM
 * DIPAKAI permukaan mana pun — tidak di web, tidak di bot. App ini yang
 * pertama menampilkannya.
 *
 * Dikelompokkan per hari WIB, bukan daftar datar: pertanyaan yang orang bawa
 * ke halaman ini adalah "hari ini ada apa", bukan "rilis ke-empat puluh apa".
 */
import { useHeaderHeight } from '@react-navigation/elements';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { ambilJadwal, type Rilis } from '../data/api';
import { jamWib, kunciHariWib, tanggalWib } from '../data/tampil';
import { Kosong, Memuat } from '../komponen/dasar';
import { W, H, J, R, ANGKA, SISA_BILAH } from '../gaya/token';

const HARI = 14;

export function LayarKalender() {
  const tinggiKepala = useHeaderHeight();
  const [rilis, setRilis] = useState<Rilis[]>([]);
  const [keadaan, setKeadaan] = useState<'memuat' | 'ada' | 'gagal'>('memuat');
  const [sebab, setSebab] = useState('');
  const [menyegarkan, setMenyegarkan] = useState(false);

  const muat = useCallback(async (segarkan = false): Promise<void> => {
    const j = await ambilJadwal(HARI, segarkan);
    if (j.ok) { setRilis(j.isi.rilis); setKeadaan('ada'); }
    else { setKeadaan('gagal'); setSebab(j.kalimat); }
  }, []);

  useEffect(() => { void muat(); }, [muat]);

  const bagian = useMemo(() => {
    const peta = new Map<string, Rilis[]>();
    for (const r of [...rilis].sort((a, b) => a.waktu - b.waktu)) {
      const k = kunciHariWib(r.waktu);
      const isi = peta.get(k);
      if (isi === undefined) peta.set(k, [r]); else isi.push(r);
    }
    return [...peta.entries()].map(([, isi]) => ({
      title: isi[0] === undefined ? '' : tanggalWib(isi[0].waktu),
      data: isi,
    }));
  }, [rilis]);

  if (keadaan === 'memuat') return <Memuat teks="Mengambil jadwal berita…" />;
  if (keadaan === 'gagal') return <Kosong judul="Jadwal tidak terbaca" sebab={sebab} aksi={() => { void muat(true); }} />;

  return (
    <SectionList
      style={g.akar}
      contentContainerStyle={{ paddingTop: tinggiKepala, paddingBottom: SISA_BILAH }}
      sections={bagian}
      keyExtractor={(r, i) => `${String(r.waktu)}${r.kode}${String(i)}`}
      stickySectionHeadersEnabled
      refreshControl={
        <RefreshControl
          refreshing={menyegarkan}
          tintColor={W.teksRedup}
          onRefresh={() => { setMenyegarkan(true); void muat(true).finally(() => { setMenyegarkan(false); }); }}
        />
      }
      ListEmptyComponent={
        <Kosong judul="Tidak ada rilis terjadwal" sebab={`Tidak ada agenda berdampak dalam ${String(HARI)} hari ke depan.`} />
      }
      ListFooterComponent={<Text style={g.kaki}>Jam ditulis WIB. Rilis berdampak tinggi biasa menggerakkan emas dan forex paling keras.</Text>}
      renderSectionHeader={({ section }) => <Text style={g.hari}>{section.title}</Text>}
      renderItem={({ item }) => (
        <View style={g.baris}>
          <Text style={g.jam}>{jamWib(item.waktu)}</Text>
          <View style={[g.dampak, { backgroundColor: item.dampak === 'tinggi' ? W.turun : W.tanda }]} />
          <View style={{ flex: 1 }}>
            <Text style={g.acara} numberOfLines={2}>{item.acara}</Text>
            <Text style={g.negara}>{item.kode} · {item.nama}</Text>
          </View>
        </View>
      )}
    />
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  hari: { fontSize: H.label, color: W.teksSamar, letterSpacing: 0.6, textTransform: 'uppercase', backgroundColor: W.latar, paddingHorizontal: J.x3, paddingTop: J.x4, paddingBottom: J.x2 },
  baris: { flexDirection: 'row', alignItems: 'center', gap: J.x3, paddingHorizontal: J.x3, paddingVertical: J.x3, borderBottomWidth: 1, borderBottomColor: W.garisSamar },
  jam: { fontSize: H.kontrol, color: W.teksKuat, fontWeight: '500', width: 44, ...ANGKA },
  dampak: { width: 3, alignSelf: 'stretch', borderRadius: R.bulat },
  acara: { fontSize: H.kontrol, color: W.teks, lineHeight: 17 },
  negara: { fontSize: H.label, color: W.teksSamar, marginTop: 2 },
  kaki: { fontSize: H.label, color: W.teksSamar, padding: J.x4, lineHeight: 15 },
});
