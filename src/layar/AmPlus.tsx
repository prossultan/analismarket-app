/**
 * ANALISMARKET+ — kartu member, bukan brosur (redesain Okt 2026, mockup
 * `polish-2026` usulan 04).
 *
 * Pelanggan cuma bertanya dua hal: masih berapa lama, dan apa yang sedang
 * jalan. Kartu member menjawab yang pertama (sisa hari, tanggal dari
 * `plusBerakhirPada`), daftar "Yang sedang jalan" menjawab yang kedua —
 * dengan angka dari akunnya sendiri, dan tiap baris yang bisa diketuk
 * membuka fiturnya. Baris yang tidak membuka apa pun TIDAK bergambar ›.
 *
 * Akun gratis melihat kartu grafit dan daftar yang terbuka dengan AM+.
 *
 * BUILD PLAY: tidak ada harga, cara bayar, maupun jalan beli di luar app —
 * di cabang mana pun yang bisa tercetak. Dijaga `uji-keputusan.mjs`
 * (`teksTercetak` memindai pohon sintaks berkas ini dengan TOKO_PLAY menyala).
 */
import { useCallback, useEffect, useState } from 'react';
import { gayaTema } from '../gaya/tema';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSisaBilah, useTinggiKepala } from '../gaya/jarak';
import { FITUR_GRATIS, FITUR_PLUS, JUDUL_PLUS, hargaPlus, tanyaPlus, TOKO_PLAY } from '../data/amplus';
import { Blok, Butir, Istilah, Lbl, Menu, Mikro, PitaBasi, Rangka, Tombol } from '../komponen/mockup';
import { ambilKabarOtomatis, ambilRingkas, MAKS_SLOT_CEK_BANYAK, type KabarOtomatis, type Ringkas } from '../data/saya';
import { ambilAkademi } from '../data/akademi';
import { bacaJendela, labelKirim, labelSunyi, tanpaSunyi } from '../data/jamSunyi';
import { useMuat, type Hasil } from '../data/muat';
import { useSesi } from './Akun';
import { Latar } from '../komponen/Latar';
import { Cincin } from '../komponen/Cincin';
import { Ikon } from '../komponen/Ikon';
import { MARK } from '../komponen/Merek';
import { W, R, TALANG } from '../gaya/token';

/* FAQ di `amplus.ts` (`tanyaPlus`), bukan di sini — di berkas data
   jawabannya bisa dijaga uji. */
const TANYA = tanyaPlus(TOKO_PLAY);

type Props = {
  bukaLangganan?: () => void;
  buka?: (ke: 'KabarOtomatis' | 'CekBanyak') => void;
  bukaAkademi?: () => void;
};

export function LayarAmPlus({ bukaLangganan, buka, bukaAkademi }: Props) {
  const h = hargaPlus();
  const tinggiKepala = useTinggiKepala();
  const sisaBilah = useSisaBilah();
  /* SUMBER YANG SAMA DENGAN HOME — dua permukaan yang berbeda pendapat
     lebih buruk daripada satu yang salah. */
  const sesi = useSesi();
  const muat = useCallback(async (): Promise<Hasil<Ringkas | null>> => {
    if (sesi === null) return { ok: true, isi: null };
    return ambilRingkas();
  }, [sesi]);
  const { keadaan } = useMuat(muat, sesi === null ? 'kosong' : `ada:${sesi.jenis ?? 'mini'}`);
  const r = keadaan.fase === 'ada' ? keadaan.isi : null;
  const sebab = keadaan.fase === 'gagal' ? keadaan.kalimat : keadaan.fase === 'ada' ? keadaan.basi : null;
  const menunggu = sesi !== null && keadaan.fase === 'memuat';
  const plus = r?.langganan === 'plus';

  /* "YANG SEDANG JALAN" — dua bacaan pelengkap, hanya untuk pelanggan.
     Gagal = kalimat sebabnya di barisnya sendiri, bukan "—" diam-diam. */
  const [ko, setKo] = useState<KabarOtomatis | null>(null);
  const [sebabKo, setSebabKo] = useState<string | null>(null);
  const [tayang23, setTayang23] = useState<number | null>(null);
  useEffect(() => {
    if (!plus) return undefined;
    let hidup = true;
    void ambilKabarOtomatis().then((j) => {
      if (!hidup) return;
      if (j.ok) { setKo(j.isi); setSebabKo(null); } else setSebabKo(j.kalimat);
    });
    void ambilAkademi().then((a) => {
      if (!hidup) return;
      if (a.ok) setTayang23(a.isi.bab.filter((b) => b.n === 2 || b.n === 3).reduce((n, b) => n + b.video.filter((v) => v.tersedia).length, 0));
      else setSebabKo((s) => s ?? a.kalimat);
    });
    return () => { hidup = false; };
  }, [plus]);
  const jendela = ko === null ? null : bacaJendela(ko.jam);

  /* Tanggal dari CAP WAKTU server, bukan `sekarang + sisaHari` (audit 20 Sep). */
  const sampai = plus && r !== null && r.plusBerakhirPada !== null
    ? new Date(r.plusBerakhirPada * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const sampaiPendek = plus && r !== null && r.plusBerakhirPada !== null
    ? new Date(r.plusBerakhirPada * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
    : null;

  return (
    <Latar>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 10, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 10 }}>
        {sebab !== null && <PitaBasi kalimat={sebab} />}

        {menunggu ? (
          <View style={[g.kartu, g.kartuGrafit, { gap: 12 }]}><Rangka lebar="40%" tinggi={10} /><Rangka lebar="30%" tinggi={40} /><Rangka lebar="55%" tinggi={12} /></View>
        ) : plus ? (
          <View style={g.kartu}>
            <LinearGradient pointerEvents="none" colors={['#3B2A14', '#1D150C', '#2A1E0F']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <LinearGradient pointerEvents="none" colors={['rgba(240,191,107,0.32)', 'rgba(240,191,107,0)']} start={{ x: 1, y: 0 }} end={{ x: 0.35, y: 0.7 }} style={StyleSheet.absoluteFill} />
            <LinearGradient pointerEvents="none" colors={['rgba(255,226,170,0)', 'rgba(255,226,170,0.13)', 'rgba(255,226,170,0)']} locations={[0.3, 0.45, 0.6]} start={{ x: 0, y: 0.2 }} end={{ x: 1, y: 0.8 }} style={StyleSheet.absoluteFill} />
            <View style={g.kmAtas}>
              <Image source={MARK} style={g.kmLogo} accessibilityIgnoresInvertColors />
              <Text style={g.kmCap}>ANALISMARKET+</Text>
              <View style={{ flex: 1 }} />
              <View style={g.kmAktif}><View style={g.kmTitik} /><Text style={g.kmAktifTeks}>Aktif</Text></View>
            </View>
            <View style={g.kmTengah}>
              <Text style={g.kmAngka}>{String(r?.sisaHariPlus ?? 0)}<Text style={g.kmAngkaKet}>  hari tersisa</Text></Text>
              <View style={{ flex: 1 }} />
              <Cincin persen={Math.min(100, ((r?.sisaHariPlus ?? 0) / 30) * 100)} ukuran={64} tebal={5} warna="#F0BF6B">
                <Text style={g.kmCincinTeks}>{sampaiPendek ?? '—'}</Text>
              </Cincin>
            </View>
            <View style={g.kmBawah}>
              <View style={{ flex: 1 }}>
                <Text style={g.kmKecil}>Berlaku sampai</Text>
                <Text style={g.kmTanggal}>{sampai ?? '—'}</Text>
              </View>
              <View style={g.kmPlatform}>
                <Ikon nama="pasar" warna="#F0D9A8" ukuran={14} />
                <Ikon nama="kirim" warna="#F0D9A8" ukuran={14} />
                <Text style={g.kmKecil}>satu akun</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[g.kartu, g.kartuGrafit]}>
            <LinearGradient pointerEvents="none" colors={['#26231F', '#151310', '#1F1C18']} locations={[0, 0.5, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <View style={g.kmAtas}>
              <Image source={MARK} style={g.kmLogo} accessibilityIgnoresInvertColors />
              <Text style={[g.kmCap, { color: W.teksRedup }]}>PAKET GRATIS</Text>
            </View>
            <Text style={g.gratisJudul}>{JUDUL_PLUS}</Text>
            {h !== null && <Text style={g.harga}>{h.harga} <Text style={g.perBulan}>/ {h.hari} hari</Text></Text>}
          </View>
        )}

        {/* BUILD PLAY: yang belum berlangganan tidak diberi tombol menuju cara
            membeli. Pelanggan tetap punya tombol status. */}
        {(plus || !TOKO_PLAY) && (
          <Tombol
            teks={plus ? 'Kelola langganan' : bukaLangganan === undefined ? 'Berlangganan lewat web' : 'Lihat cara berlangganan'}
            jenis={plus ? 'kedua' : 'emas'} mati={bukaLangganan === undefined || menunggu} onPress={bukaLangganan} />
        )}
        {/* BUILD PLAY: cukup tanggalnya — "tanpa potong otomatis" menyebut
            model pembayaran, dan build Play tidak menyebut pembayaran sama sekali. */}
        <Mikro tengah>{plus
          ? (TOKO_PLAY ? 'Berakhir sendiri di tanggalnya.' : 'Berakhir sendiri di tanggalnya. Tidak ada potong otomatis.')
          : TOKO_PLAY ? 'AnalisMarket+ belum aktif di akun ini.' : 'Pembelian belum tersedia di dalam app.'}</Mikro>

        {plus ? (
          <>
            <Lbl gaya={{ marginTop: 6 }}>Yang sedang jalan</Lbl>
            {sebabKo !== null && <PitaBasi kalimat={sebabKo} />}
            <Menu>
              <Butir ikon="kilat" nama="Kabar otomatis" pertama
                sub={ko === null ? '—' : `${String(ko.dipilih.length)} pasangan${jendela === null ? '' : ` · kirim ${labelKirim(jendela)}`}`}
                onPress={buka === undefined ? undefined : () => { buka('KabarOtomatis'); }} />
              <Butir ikon="kisi" nama="Cek banyak" sub={`Sampai ${String(MAKS_SLOT_CEK_BANYAK)} pasar sekali tekan`} onPress={buka === undefined ? undefined : () => { buka('CekBanyak'); }} />
              <Butir ikon="bulan" nama="Jam sunyi"
                sub={jendela === null ? '—' : tanpaSunyi(jendela) ? 'tidak ada' : `diam ${labelSunyi(jendela)}`}
                onPress={buka === undefined ? undefined : () => { buka('KabarOtomatis'); }} />
              <Butir ikon="akademi" nama="Akademi Bab 2–3"
                sub={tayang23 === null ? 'terbuka' : tayang23 > 0 ? `terbuka · ${String(tayang23)} tayang` : 'terbuka · segera tayang'}
                onPress={bukaAkademi} />
              <Butir ikon="jam" nama="m1 & m5 emas/forex" sub="20 analisa sehari" />
              <Butir ikon="dua" nama="Multi-chart 2 atau 4" sub="Di Terminal web" />
              <Butir ikon="tren" nama="Antrean prioritas" sub="Kartumu duluan" />
            </Menu>
          </>
        ) : (
          <>
            <Lbl gaya={{ marginTop: 6 }}>Terbuka dengan AnalisMarket+</Lbl>
            <Menu>
              {FITUR_PLUS.map((f, i) => (
                <View key={f.nama} style={[g.fitur, i > 0 && g.garisAtas]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={g.fiturNama}>{f.nama}</Text>
                    <Text style={g.fiturKet}>{f.keterangan}</Text>
                  </View>
                  <View style={g.gembok}><Ikon nama="gembok" warna={W.teksSamar} ukuran={14} /></View>
                </View>
              ))}
              <View style={[g.fitur, g.garisAtas]}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={g.fiturNama}>Akademi Bab 2–3</Text>
                  <Text style={g.fiturKet}>struktur pasar dan indikator</Text>
                </View>
                <View style={g.gembok}><Ikon nama="gembok" warna={W.teksSamar} ukuran={14} /></View>
              </View>
            </Menu>
          </>
        )}

        <Blok>
          <Lbl>Yang tetap gratis</Lbl>
          <View style={{ marginTop: 8, gap: 8 }}>
            {FITUR_GRATIS.map((f) => (
              <View key={f.nama} style={g.butir}>
                <Ikon nama="centang" warna={W.naik} ukuran={15} />
                <Text style={g.butirTeks}>{f.nama}</Text>
              </View>
            ))}
          </View>
        </Blok>

        <Blok gaya={{ flex: 1 }}>
          <Lbl>Pertanyaan yang sering masuk</Lbl>
          <View style={{ marginTop: 4 }}>
            {TANYA.map((q, i) => <Istilah key={q.t} judul={q.t} isi={q.j} pertama={i === 0} />)}
          </View>
        </Blok>
      </ScrollView>
    </Latar>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  kartu: {
    borderRadius: 24, padding: 18, overflow: 'hidden', minHeight: 196,
    borderWidth: 1, borderColor: 'rgba(240,191,107,0.42)', borderTopColor: 'rgba(255,236,206,0.40)',
  },
  kartuGrafit: { borderColor: W.tinta(0.16), borderTopColor: W.tinta(0.22), minHeight: 0 },
  kmAtas: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  kmLogo: { width: 26, height: 26, borderRadius: 13 },
  kmCap: { fontSize: 10.5, letterSpacing: 2.2, color: '#F3D69C', fontWeight: '600' },
  kmAktif: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.25)', borderWidth: 1, borderColor: 'rgba(240,191,107,0.35)' },
  kmTitik: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  kmAktifTeks: { fontSize: 11, fontWeight: '700', color: '#F7E7C6' },
  kmTengah: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  kmAngka: { fontSize: 58, fontWeight: '600', color: '#FFF6E6', letterSpacing: -2, fontVariant: ['tabular-nums'] },
  kmAngkaKet: { fontSize: 14, fontWeight: '500', color: '#E9D3A6', letterSpacing: 0 },
  kmCincinTeks: { fontSize: 11, fontWeight: '700', color: '#F7E7C6', textAlign: 'center' },
  kmBawah: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 16 },
  kmKecil: { fontSize: 10.5, color: '#D9C29A' },
  kmTanggal: { fontSize: 14, fontWeight: '600', color: '#FFF6E6', marginTop: 2 },
  kmPlatform: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gratisJudul: { fontSize: 19, fontWeight: '600', color: W.teksKuat, lineHeight: 25, letterSpacing: -0.3, marginTop: 14 },
  harga: { fontSize: 24, fontWeight: '700', color: W.plusTerang, marginTop: 10, letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  perBulan: { fontSize: 12.5, color: W.teksRedup, fontWeight: '400' },
  fitur: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  garisAtas: { borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: W.garisSamar },
  fiturNama: { fontSize: 13.5, fontWeight: '600', color: W.teksKuat },
  fiturKet: { fontSize: 11.5, color: W.teksSamar, lineHeight: 16 },
  gembok: { width: 28, height: 28, borderRadius: R.sedang - 1, alignItems: 'center', justifyContent: 'center', backgroundColor: W.tinta(0.07) },
  butir: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  butirTeks: { flex: 1, fontSize: 13, color: W.teks, lineHeight: 18 },
}));
