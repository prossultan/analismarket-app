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
import { Blok, Chip, Dampak, Hari, Kosong, Lbl, Mikro, Rangka } from '../komponen/mockup';
import { Latar } from '../komponen/Latar';
import { W, H, R, TALANG } from '../gaya/token';

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

  const isiPadding = { flexGrow: 1, paddingTop: tinggiKepala + 10, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 10 };
  /* RILIS BERIKUTNYA — jawaban untuk "kapan yang besar berikutnya", tanpa
     menggulir. Diturunkan dari daftar yang sama, jadi tidak ada angka kedua. */
  const sekarang = Date.now() / 1000;
  const berikut = rilis.filter((r) => r.waktu >= sekarang).sort((a, b) => a.waktu - b.waktu)[0] ?? null;
  const hariLagi = berikut === null ? null : Math.floor((berikut.waktu + 7 * 3600) / 86400) - Math.floor((sekarang + 7 * 3600) / 86400);

  if (keadaan === 'gagal') {
    return (
      <Latar kuat="redup">
        <View style={[{ flex: 1 }, isiPadding]}>
          <Kosong ikon="kalender" judul="Jadwal tidak terbaca" kalimat={sebab} aksi={() => { setKeadaan('memuat'); void muat(true); }} />
        </View>
      </Latar>
    );
  }

  return (
    <Latar kuat="redup">
    <ScrollView
      contentContainerStyle={isiPadding}
      refreshControl={<RefreshControl refreshing={menyegarkan} tintColor={W.teksRedup}
        onRefresh={() => { setMenyegarkan(true); void muat(true).finally(() => { setMenyegarkan(false); }); }} />}
    >
      {berikut !== null && hariLagi !== null && (
        <Blok emas gaya={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={g.hitung}>
            <Text style={g.hitungAngka}>{hariLagi <= 0 ? 'Hari' : String(hariLagi)}</Text>
            <Text style={g.hitungKet}>{hariLagi <= 0 ? 'ini' : hariLagi === 1 ? 'hari lagi · besok' : 'hari lagi'}</Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Lbl warna={W.plusTeks}>Rilis berikutnya</Lbl>
            <Text style={g.hitungNama} numberOfLines={2}>{berikut.nama}</Text>
            <Text style={g.ket}>{judulHariWib(berikut.waktu).toLowerCase()} · {jamWib(berikut.waktu)} WIB · dampak {berikut.dampak}</Text>
          </View>
        </Blok>
      )}
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
          <View style={g.grup}>
            {b.isi.map((r, i) => (
              <View key={`${String(r.waktu)}${r.kode}${String(i)}`} style={[g.rilis, i > 0 && g.garis]}>
                <Dampak tinggi={r.dampak === 'tinggi'} />
                <Text style={g.jam}>{jamWib(r.waktu)}</Text>
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  {/* Nama Indonesia dulu, nama sumber di bawahnya — yang pertama
                      dibaca orang, yang kedua dicari di kalender lain. */}
                  <Text style={g.nama} numberOfLines={2}>{r.nama}</Text>
                  <Text style={g.acara} numberOfLines={2}>{r.acara}</Text>
                  <Text style={[g.ket, r.dampak === 'tinggi' && { color: W.turun }]} numberOfLines={1}>{r.kode} · dampak {r.dampak}</Text>
                </View>
              </View>
            ))}
          </View>
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
    </Latar>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  chips: { flexDirection: 'row', gap: 6, paddingVertical: 2 },
  grup: {
    backgroundColor: W.kacaIsi, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, borderTopColor: W.kacaKilau,
    borderRadius: R.kartu, overflow: 'hidden', paddingHorizontal: 14,
  },
  rilis: { flexDirection: 'row', alignItems: 'stretch', gap: 12, paddingVertical: 12 },
  garis: { borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: W.garisSamar },
  jam: { width: 44, fontSize: 14, fontWeight: '600', color: W.teksKuat, fontVariant: ['tabular-nums'], paddingTop: 1 },
  nama: { fontSize: 13.5, fontWeight: '600', color: W.teksKuat, lineHeight: 18 },
  acara: { fontSize: 11.5, color: W.teksSamar, lineHeight: 16 },
  ket: { fontSize: 11.5, color: W.teksRedup, fontWeight: '600' },
  hitung: { alignItems: 'flex-start', minWidth: 64 },
  hitungAngka: { fontSize: 40, fontWeight: '600', color: W.teksKuat, letterSpacing: -1.5, fontVariant: ['tabular-nums'] },
  hitungKet: { fontSize: 11.5, color: W.teksRedup, marginTop: -2 },
  hitungNama: { fontSize: 15, fontWeight: '600', color: W.teksKuat },
  legenda: {
    gap: 10, padding: 14, borderRadius: R.kartu, marginTop: 12,
    backgroundColor: W.kacaIsi, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi,
  },
  legendaBaris: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  legendaTeks: { flex: 1, fontSize: 12.5, color: W.teksRedup, lineHeight: 18 },
  legendaTebal: { color: W.teksKuat, fontWeight: '600' },
}));
