/**
 * SAMBUTAN — mockup 00 (peluncuran) dan 0b (masuk), ditampilkan SEKALI di
 * pembukaan pertama, lalu diingat di perangkat.
 *
 * Kartu masuknya kaca melayang di atas terminal yang hidup — yang
 * dikaburkan di baliknya bukan latar, melainkan produknya sendiri. Orang
 * melihat alatnya bekerja sebelum diminta masuk; itu alasan temboknya
 * tembus pandang, bukan gelap.
 *
 * Tombol utamanya PUTIH GADING, bukan emas: bidang emas hanya AM+. Telegram
 * di atas Google karena tautan `?masuk=` lewat bot adalah jalur yang
 * benar-benar bekerja hari ini; Google lewat Clerk belum jalan di Expo Go.
 *
 * "Lanjut tanpa masuk" ADA, dan mockup-nya tidak punya itu. Tanpa tautan
 * itu app ini tembok buntu untuk semua orang — 13 dari 15 fungsi akun
 * memang belum bisa dilayani, tapi 4 endpoint anonim bisa. Menyembunyikan
 * jalan keluar demi persis dengan gambar berarti app yang tidak bisa dipakai.
 */
import { useEffect, useState } from 'react';
import { gayaTema, useTema } from '../gaya/tema';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Kaca } from '../komponen/Kaca';
import { Ikon } from '../komponen/Ikon';
import { BarisPasar, PilTf, PitaMesin, Tombol } from '../komponen/mockup';
import { TombolGoogle } from '../komponen/TombolGoogle';
import { FormulirSambung } from '../komponen/FormulirSambung';
import { ChartTertanam } from '../komponen/ChartTertanam';
import { ASAL } from '../data/antrian';
import { W, H, R, TALANG } from '../gaya/token';

const LOGO = require('../../assets/merek-mark.png') as number;
const KUNCI = 'am_sambutan_v1';

export async function sudahDisambut(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(KUNCI)) === '1'; } catch { return false; }
}
async function tandaiDisambut(): Promise<void> {
  try { await AsyncStorage.setItem(KUNCI, '1'); } catch { /* penyimpanan ditolak — sambutan muncul lagi, dan itu tidak apa-apa */ }
}

const UNTUNG = [
  { ikon: 'pasar' as const, judul: 'Entry, SL, TP', ket: 'Lengkap dengan RR bersih sesudah biaya' },
  { ikon: 'kabar' as const, judul: 'Pantauan', ket: 'Dikabari saat syarat setupnya lolos' },
  { ikon: 'kalender' as const, judul: 'Harga langsung', ket: 'Dari bursa, diperbarui tiap lilin tutup' },
  { ikon: 'kalender' as const, judul: 'Kalender berita', ket: '30 hari, dampak tinggi dan sedang' },
];

/**
 * TANPA TAMU. Layar ini tampil selama belum ada sesi, dan hilang sendiri
 * begitu sesi datang (Telegram lewat formulir di bawah, atau Google lewat
 * Clerk) — gerbangnya di App.tsx membaca `useSesi()`, bukan tombol di sini.
 * Tidak ada "lanjut tanpa masuk": keputusan pemilik 19 Sep.
 */
export function LayarSambutan() {
  const { top, bottom } = useSafeAreaInsets();
  const [tahap, setTahap] = useState<'luncur' | 'masuk' | 'telegram'>('luncur');
  const terang = useTema() === 'terang';
  /* Peluncuran yang bertahan lebih dari 1,5 detik (jaringan pelan, Clerk
     lambat) dapat indikator — layar diam tanpa tanda terbaca sebagai app
     yang macet (audit 20 Sep: 4,6 detik tanpa satu pun gerakan). */
  const [lama, setLama] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setLama(true); }, 1500); return () => { clearTimeout(t); }; }, []);

  /* Peluncuran: 1,4 detik, lalu ke layar masuk. Bukan menunggu ketukan —
     layar peluncuran yang menuntut ketukan cuma menunda. */
  useEffect(() => {
    /* Peluncuran cuma sekali seumur pemasangan; sesudahnya langsung layar masuk. */
    let t: ReturnType<typeof setTimeout> | null = null;
    void sudahDisambut().then((sudah) => {
      if (sudah) { setTahap('masuk'); return; }
      t = setTimeout(() => { void tandaiDisambut(); setTahap('masuk'); }, 1400);
    });
    return () => { if (t !== null) clearTimeout(t); };
  }, []);

  if (tahap === 'luncur') {
    return (
      <View style={[g.akar, g.tengah]}>
        <Image source={LOGO} style={g.logoBesar} accessibilityIgnoresInvertColors />
        <Text style={g.nama}>Analis<Text style={{ color: W.plusTeks }}>Market</Text></Text>
        <Text style={g.tagline}>Analisa teknikal otomatis untuk 131 pasar.{'\n'}Angka mentah, dan kamu yang memutuskan.</Text>
        {lama && <ActivityIndicator color={W.teksSamar} style={{ marginTop: 22 }} />}
        <Text style={[g.kaki, { bottom: bottom + 24 }]}>BUKAN NASIHAT INVESTASI</Text>
      </View>
    );
  }

  return (
    <View style={g.akar}>
      {/* Yang hidup di balik kaca: bukan latar, tapi produknya sendiri. */}
      <View style={[g.balik, { paddingTop: top + 34 }]} pointerEvents="none">
        <PilTf daftar={['m5', 'm15', 'm30', 'h1', 'h4', 'd1']} aktif="h1" pilih={() => undefined} />
        <PitaMesin aktif="snr" pilih={() => undefined} daftar={[
          { kode: 'snr', kata: 'pantau', angka: '7/8', titik: 'putih' }, { kode: 'smc', kata: '', angka: '7/10', titik: 'polos' },
          { kode: 'ema200', kata: 'setup', angka: '4/6', titik: 'hijau' }, { kode: 'ichi…', kata: '', angka: '5/8', titik: 'polos' },
          { kode: 'fibo…', kata: '', angka: '4/9', titik: 'polos' },
        ]} />
        <View style={g.chartBalik}>
          <ChartTertanam url={`${ASAL}/chart-embed?pair=BTCUSDT&tf=h1&alat=volume,zona${terang ? '&tema=terang' : ''}`} asal={ASAL}
            suntik="true;" latar={W.chart} onMuat={() => undefined} onPesan={() => undefined} />
        </View>
        <BarisPasar simbol="XAU/USD" label="Emas spot" harga="4.351,04" ubah="+0,62%" ubahWarna={W.naik} pertama />
        <BarisPasar simbol="ETHUSDT" label="Kripto" harga="2.408,44" ubah="−1,04%" ubahWarna={W.turun} />
        <BarisPasar simbol="SOLUSDT" label="Kripto" harga="138,27" ubah="+3,11%" ubahWarna={W.naik} />
      </View>

      <View style={[g.tembok, { paddingBottom: bottom + 16 }]}>
        <Kaca tebal tepi="atas" gaya={g.kartu}>
          <View style={g.merek}>
            <Image source={LOGO} style={g.logoKecil} accessibilityIgnoresInvertColors />
            <Text style={g.merekNama}>Analis<Text style={{ color: W.plusTeks }}>Market</Text></Text>
          </View>
          <Text style={g.judul}>Masuk untuk membaca{'\n'}analisa lengkapnya</Text>
          <Text style={g.ajak}>131 pasar · 5 mesin dibaca sekaligus · 7 timeframe. Semuanya angka mentah, dan kamu yang memutuskan.</Text>
          {tahap !== 'telegram' && <View style={g.untung}>
            {UNTUNG.map((u) => (
              <View key={u.judul} style={g.untungSel}>
                <Ikon nama={u.ikon} warna={W.plus} ukuran={14} />
                <Text style={g.untungJudul}>{u.judul}</Text>
                <Text style={g.untungKet}>{u.ket}</Text>
              </View>
            ))}
          </View>}
          {/* Bukan tautan: app ini tidak memasang tautan keluar. Nama botnya
              ditampilkan, dan langkahnya dijelaskan di layar Sambungkan. */}
          <View style={{ height: 12 }} />
          {tahap === 'telegram' ? (
            <View style={{ marginTop: 2, gap: 7 }}>
              <FormulirSambung ringkas />
              <Pressable onPress={() => { setTahap('masuk'); }} hitSlop={10} style={g.lewati} accessibilityRole="button">
                <Text style={g.lewatiTeks}>‹ Kembali</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Tombol teks="Sambungkan Telegram" onPress={() => { setTahap('telegram'); }}
                ikon={<Ikon nama="kabar" warna="#1A1508" ukuran={14} />} />
              <View style={{ marginTop: 7 }}>
                <TombolGoogle />
              </View>
              <Text style={g.syarat}>Gratis, tanpa formulir. Dengan masuk kamu menyetujui Syarat & Ketentuan dan Kebijakan Privasi.</Text>
            </>
          )}
        </Kaca>
      </View>
    </View>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  tengah: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26, gap: 14 },
  logoBesar: { width: 104, height: 104, borderRadius: 28 },
  nama: { fontSize: 28, fontWeight: '700', color: W.teksKuat, letterSpacing: -0.9 },
  tagline: { fontSize: H.nilai, color: W.teksSamar, lineHeight: 17, textAlign: 'center' },
  kaki: { position: 'absolute', fontSize: 8.5, color: W.teksSamar, letterSpacing: 1.2 },

  balik: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, paddingHorizontal: TALANG, gap: 7, opacity: 0.8 },
  chartBalik: { height: 300, position: 'relative', borderRadius: R.besar, borderWidth: 1, borderColor: W.garis, backgroundColor: W.chart, overflow: 'hidden' },

  tembok: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: TALANG, backgroundColor: 'rgba(12,11,9,0.45)' },
  kartu: { borderRadius: 22, paddingHorizontal: 15, paddingTop: 17, paddingBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: W.tinta(0.16) },
  merek: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 13 },
  logoKecil: { width: 28, height: 28, borderRadius: 8 },
  merekNama: { fontSize: 17, fontWeight: '700', color: W.teksKuat, letterSpacing: -0.4 },
  judul: { fontSize: 17, fontWeight: '600', color: W.teksKuat, textAlign: 'center', lineHeight: 21, letterSpacing: -0.5 },
  ajak: { marginTop: 7, fontSize: H.alat, color: W.teksRedup, lineHeight: 15, textAlign: 'center' },
  untung: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 13 },
  untungSel: { width: '48.5%', minHeight: 64, borderRadius: 10, padding: 8, borderWidth: 1, borderColor: W.garisSamar, backgroundColor: W.tinta(0.035) },
  untungJudul: { marginTop: 5, fontSize: H.alat, fontWeight: '600', color: W.teksKuat },
  untungKet: { marginTop: 1, fontSize: H.label, color: W.teksSamar, lineHeight: 12, minHeight: 24 },
  syarat: { marginTop: 11, fontSize: 8.5, color: W.teksSamar, textAlign: 'center', lineHeight: 13 },
  lewati: { alignSelf: 'center', marginTop: 8, minHeight: 32, justifyContent: 'center' },
  lewatiTeks: { fontSize: H.alat, color: W.teksRedup },
}));
