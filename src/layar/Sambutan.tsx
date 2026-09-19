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
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Kaca } from '../komponen/Kaca';
import { Ikon } from '../komponen/Ikon';
import { BarisPasar, PilTf, PitaMesin, Tombol } from '../komponen/mockup';
import { W, H, R, TALANG } from '../gaya/token';

const LOGO = require('../../assets/logo-am.png') as number;
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

export function LayarSambutan({ selesai }: { selesai: () => void }) {
  const { top, bottom } = useSafeAreaInsets();
  const [tahap, setTahap] = useState<'luncur' | 'masuk'>('luncur');

  /* Peluncuran: 1,4 detik, lalu ke layar masuk. Bukan menunggu ketukan —
     layar peluncuran yang menuntut ketukan cuma menunda. */
  useEffect(() => {
    const t = setTimeout(() => { setTahap('masuk'); }, 1400);
    return () => { clearTimeout(t); };
  }, []);

  const lanjut = (): void => { void tandaiDisambut(); selesai(); };

  if (tahap === 'luncur') {
    return (
      <View style={[g.akar, g.tengah]}>
        <Image source={LOGO} style={g.logoBesar} accessibilityIgnoresInvertColors />
        <Text style={g.nama}>Analis<Text style={{ color: W.plus }}>Market</Text></Text>
        <Text style={g.tagline}>Analisa teknikal otomatis untuk 131 pasar.{'\n'}Angka mentah, dan kamu yang memutuskan.</Text>
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
        <View style={g.chartPalsu}>
          {[46, 40, 48, 38, 42, 36, 30, 34, 26, 22, 24, 18, 14, 16, 10].map((h, i) => (
            <View key={i} style={[g.lilin, { height: h + 24, backgroundColor: i % 3 === 2 ? W.turun : W.naik, marginTop: 60 - h }]} />
          ))}
        </View>
        <BarisPasar simbol="XAU/USD" label="Emas spot" harga="4.351,04" ubah="+0,62%" ubahWarna={W.naik} pertama />
        <BarisPasar simbol="ETHUSDT" label="Kripto" harga="2.408,44" ubah="−1,04%" ubahWarna={W.turun} />
        <BarisPasar simbol="SOLUSDT" label="Kripto" harga="138,27" ubah="+3,11%" ubahWarna={W.naik} />
      </View>

      <View style={[g.tembok, { paddingBottom: bottom + 16 }]}>
        <Kaca tebal tepi="atas" gaya={g.kartu}>
          <View style={g.merek}>
            <Image source={LOGO} style={g.logoKecil} accessibilityIgnoresInvertColors />
            <Text style={g.merekNama}>Analis<Text style={{ color: W.plus }}>Market</Text></Text>
          </View>
          <Text style={g.judul}>Masuk untuk membaca{'\n'}analisa lengkapnya</Text>
          <Text style={g.ajak}>131 pasar · 5 mesin dibaca sekaligus · 7 timeframe. Semuanya angka mentah, dan kamu yang memutuskan.</Text>
          <View style={g.untung}>
            {UNTUNG.map((u) => (
              <View key={u.judul} style={g.untungSel}>
                <Ikon nama={u.ikon} warna={W.plus} ukuran={14} />
                <Text style={g.untungJudul}>{u.judul}</Text>
                <Text style={g.untungKet}>{u.ket}</Text>
              </View>
            ))}
          </View>
          {/* Bukan tautan: app ini tidak memasang tautan keluar. Nama botnya
              ditampilkan, dan langkahnya dijelaskan di layar Sambungkan. */}
          <Tombol teks="Sambungkan Telegram · @analismarketbot" mati
            ikon={<Ikon nama="kabar" warna="rgba(232,231,229,0.45)" ukuran={14} />} />
          <View style={{ marginTop: 7 }}>
            <Tombol teks="Masuk dengan Google — belum tersedia" jenis="kedua" mati />
          </View>
          <Text style={g.syarat}>Gratis, tanpa formulir. Dengan masuk kamu menyetujui Syarat & Ketentuan dan Kebijakan Privasi.</Text>
          <Pressable onPress={lanjut} hitSlop={10} style={g.lewati} accessibilityRole="button">
            <Text style={g.lewatiTeks}>Lanjut tanpa masuk ›</Text>
          </Pressable>
        </Kaca>
      </View>
    </View>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  tengah: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 26, gap: 14 },
  logoBesar: { width: 76, height: 76, borderRadius: 21 },
  nama: { fontSize: 21, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.6 },
  tagline: { fontSize: H.nilai, color: W.teksSamar, lineHeight: 17, textAlign: 'center' },
  kaki: { position: 'absolute', fontSize: 8.5, color: W.teksSamar, letterSpacing: 1.2 },

  balik: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, paddingHorizontal: TALANG, gap: 7, opacity: 0.8 },
  chartPalsu: { height: 150, flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 12, borderRadius: R.besar, borderWidth: 1, borderColor: W.garis, backgroundColor: W.chart, overflow: 'hidden' },
  lilin: { width: 7, borderRadius: 1 },

  tembok: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: TALANG, backgroundColor: 'rgba(12,11,9,0.45)' },
  kartu: { borderRadius: 22, paddingHorizontal: 15, paddingTop: 17, paddingBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)' },
  merek: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 13 },
  logoKecil: { width: 21, height: 21, borderRadius: 6 },
  merekNama: { fontSize: H.pasar, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.2 },
  judul: { fontSize: 17, fontWeight: '600', color: W.teksKuat, textAlign: 'center', lineHeight: 21, letterSpacing: -0.5 },
  ajak: { marginTop: 7, fontSize: H.alat, color: W.teksRedup, lineHeight: 15, textAlign: 'center' },
  untung: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 13 },
  untungSel: { width: '48%', flexGrow: 1, borderRadius: 10, padding: 8, borderWidth: 1, borderColor: W.garisSamar, backgroundColor: 'rgba(255,255,255,0.035)' },
  untungJudul: { marginTop: 5, fontSize: H.alat, fontWeight: '600', color: W.teksKuat },
  untungKet: { marginTop: 1, fontSize: H.label, color: W.teksSamar, lineHeight: 12 },
  syarat: { marginTop: 11, fontSize: 8.5, color: W.teksSamar, textAlign: 'center', lineHeight: 13 },
  lewati: { alignSelf: 'center', marginTop: 8, minHeight: 32, justifyContent: 'center' },
  lewatiTeks: { fontSize: H.alat, color: W.teksRedup },
});
