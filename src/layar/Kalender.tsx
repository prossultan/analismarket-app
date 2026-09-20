/**
 * KALENDER BERITA — mockup 07.
 *
 * Dampak dikodekan BENTUK dan WARNA sekaligus: pita tegak di tepi kiri,
 * merah untuk tinggi, emas untuk sedang. Warna saja hilang bagi yang tidak
 * membedakannya; pita saja tidak cukup cepat dibaca.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { gayaTema } from '../gaya/tema';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSisaBilah, useTinggiKepala } from '../gaya/jarak';
import { ambilJadwal, type Rilis } from '../data/api';
import { jamWib, judulHariWib, kunciHariWib } from '../data/tampil';
import { Chip, Dampak, Hari, Kosong, Lbl, Mikro, Rangka } from '../komponen/mockup';
import { W, H, TALANG } from '../gaya/token';

const HARI = 30;
type Saring = 'semua' | 'tinggi' | 'sedang';

export function LayarKalender() {
  const tinggiKepala = useTinggiKepala();
  const sisaBilah = useSisaBilah();
  const [rilis, setRilis] = useState<Rilis[]>([]);
  const [keadaan, setKeadaan] = useState<'memuat' | 'ada' | 'gagal'>('memuat');
  const [sebab, setSebab] = useState('');
  const [menyegarkan, setMenyegarkan] = useState(false);
  const [saring, setSaring] = useState<Saring>('semua');
  const [kode, setKode] = useState<string | null>(null);

  const muat = useCallback(async (segarkan = false): Promise<void> => {
    const j = await ambilJadwal(HARI, segarkan);
    if (j.ok) { setRilis(j.isi.rilis); setKeadaan('ada'); }
    else { setKeadaan('gagal'); setSebab(j.kalimat); }
  }, []);
  useEffect(() => { void muat(); }, [muat]);

  const kodeAda = useMemo(() => [...new Set(rilis.map((r) => r.kode))].sort(), [rilis]);

  const bagian = useMemo(() => {
    const peta = new Map<string, Rilis[]>();
    const tersaring = rilis
      .filter((r) => saring === 'semua' || r.dampak === saring)
      .filter((r) => kode === null || r.kode === kode)
      .sort((a, b) => a.waktu - b.waktu);
    for (const r of tersaring) {
      const k = kunciHariWib(r.waktu);
      const isi = peta.get(k);
      if (isi === undefined) peta.set(k, [r]); else isi.push(r);
    }
    return [...peta.values()].map((isi) => ({ judul: isi[0] === undefined ? '' : judulHariWib(isi[0].waktu), isi }));
  }, [rilis, saring, kode]);

  const isiPadding = { flexGrow: 1, paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG };

  if (keadaan === 'gagal') {
    return (
      <View style={[g.akar, isiPadding]}>
        <Kosong ikon="kalender" judul="Jadwal tidak terbaca" kalimat={sebab} aksi={() => { setKeadaan('memuat'); void muat(true); }} />
      </View>
    );
  }

  return (
    <ScrollView
      style={g.akar}
      contentContainerStyle={isiPadding}
      refreshControl={<RefreshControl refreshing={menyegarkan} tintColor={W.teksRedup}
        onRefresh={() => { setMenyegarkan(true); void muat(true).finally(() => { setMenyegarkan(false); }); }} />}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={g.chips}>
        <Chip teks="Semua" on={saring === 'semua'} onPress={() => { setSaring('semua'); }} />
        <Chip teks="Tinggi" on={saring === 'tinggi'} onPress={() => { setSaring('tinggi'); }} />
        <Chip teks="Sedang" on={saring === 'sedang'} onPress={() => { setSaring('sedang'); }} />
        {kodeAda.map((k) => <Chip key={k} teks={k} on={kode === k} onPress={() => { setKode(kode === k ? null : k); }} />)}
      </ScrollView>

      {keadaan === 'memuat' && (
        <View style={{ gap: 10, paddingTop: 8 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
              <Rangka lebar={31} tinggi={10} /><Rangka lebar="62%" tinggi={10} />
            </View>
          ))}
        </View>
      )}

      {keadaan === 'ada' && bagian.length === 0 && (
        <Kosong ikon="kalender" judul="Tidak ada rilis" kalimat="Tidak ada berita yang cocok dengan saringan ini dalam 30 hari ke depan." />
      )}

      {bagian.map((b) => (
        <View key={b.judul}>
          <Hari>{b.judul}</Hari>
          {b.isi.map((r, i) => (
            <View key={`${String(r.waktu)}${r.kode}${String(i)}`} style={[g.rilis, i > 0 && g.garis]}>
              <Dampak tinggi={r.dampak === 'tinggi'} />
              <Text style={g.jam}>{jamWib(r.waktu)}</Text>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={g.acara} numberOfLines={2}>{r.acara}</Text>
                <Text style={g.ket} numberOfLines={1}>{r.kode} · dampak {r.dampak}</Text>
              </View>
            </View>
          ))}
        </View>
      ))}

      <View style={{ flex: 1 }} />
      <View style={g.legenda}>
        <Lbl>Cara membacanya</Lbl>
        <View style={g.legendaBaris}><Dampak tinggi /><Text style={g.legendaTeks}><Text style={g.legendaTebal}>Dampak tinggi</Text> — emas dan forex sering melebar beberapa menit sebelum dan sesudahnya. Setup di sekitarnya lebih jarang lolos.</Text></View>
        <View style={g.legendaBaris}><Dampak tinggi={false} /><Text style={g.legendaTeks}><Text style={g.legendaTebal}>Dampak sedang</Text> — jarang menggeser harga sendirian, tapi menumpuk dengan rilis lain di hari yang sama.</Text></View>
        <Text style={g.legendaTeks}>Jam dalam WIB. Kripto tidak libur; emas dan forex tutup Sabtu–Minggu.</Text>
      </View>
      <Mikro>Jadwal dari penyedia kalender ekonomi.</Mikro>
    </ScrollView>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  chips: { flexDirection: 'row', gap: 4, paddingBottom: 4 },
  rilis: { flexDirection: 'row', gap: 8, alignItems: 'stretch', paddingVertical: 6 },
  garis: { borderTopWidth: 1, borderTopColor: W.garisSamar },
  jam: { width: 34, fontSize: H.alat, color: W.teksRedup, paddingTop: 1, fontVariant: ['tabular-nums'] },
  acara: { fontSize: H.nilai, fontWeight: '500', color: W.teksKuat, lineHeight: 15, letterSpacing: -0.1 },
  ket: { fontSize: H.label, color: W.teksSamar, marginTop: 1 },
  legenda: { marginTop: 8, marginBottom: 7, padding: 10, gap: 7, borderRadius: 14, borderWidth: 1, borderColor: W.garis, backgroundColor: W.kartu },
  legendaBaris: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  legendaTeks: { flex: 1, fontSize: H.alat, color: W.teksRedup, lineHeight: 14 },
  legendaTebal: { color: W.teksKuat, fontWeight: '600' },
}));
