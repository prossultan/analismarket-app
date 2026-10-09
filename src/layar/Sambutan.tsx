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
import { LinearGradient } from 'expo-linear-gradient';
import { Ikon } from '../komponen/Ikon';
import { PilTf, PitaMesin, Tombol, type SelMesin } from '../komponen/mockup';
import { ambilBacaan, syaratWajib } from '../data/api';
import { TombolGoogle } from '../komponen/TombolGoogle';
import { FormulirSambung } from '../komponen/FormulirSambung';
import { ChartTertanam } from '../komponen/ChartTertanam';
import { ASAL } from '../data/antrian';
import { kalimatCakupan } from '../data/tampil';
import { W, H, R, TALANG } from '../gaya/token';

const LOGO = require('../../assets/merek-mark.png') as number;
const KUNCI = 'am_sambutan_v1';

export async function sudahDisambut(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(KUNCI)) === '1'; } catch { return false; }
}
export async function tandaiDisambut(): Promise<void> {
  try { await AsyncStorage.setItem(KUNCI, '1'); } catch { /* penyimpanan ditolak — sambutan muncul lagi, dan itu tidak apa-apa */ }
}

const UNTUNG = [
  { ikon: 'target' as const, judul: 'Entry, SL, TP', ket: 'Lengkap dengan RR bersih sesudah biaya' },
  { ikon: 'kabar' as const, judul: 'Pantauan', ket: 'Dikabari saat syarat setupnya lolos' },
  { ikon: 'tren' as const, judul: 'Harga langsung', ket: 'Dari bursa, diperbarui tiap lilin tutup' },
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
  /* PITA MESIN = BACAAN ASLI BTCUSDT h1 (anonim, endpoint publik), bukan
     angka karangan. Sebelum redesain Okt 2026 pita ini dan tiga baris harga
     di bawah chart DIKETIK ("4.351,04", "pantau 7/8") — tampil di depan
     setiap orang yang belum masuk, dan tidak pernah benar. Gagal memuat =
     pitanya tidak digambar; chart asli di bawahnya tetap jalan. */
  const [pita, setPita] = useState<SelMesin[]>([]);
  const [sebabPita, setSebabPita] = useState<string | null>(null);
  useEffect(() => {
    let hidup = true;
    void ambilBacaan('BTCUSDT', 'h1').then((b) => {
      if (!hidup) return;
      /* Gagal = kalimatnya dicetak di tempat pita: di layar masuk, jaringan
         yang putus juga berarti masuk tidak akan berhasil — orangnya perlu tahu. */
      if (!b.ok) { setSebabPita(b.kalimat); return; }
      setSebabPita(null);
      setPita(b.isi.mesin.map((m) => {
        const w = syaratWajib(m); const st = m.status.toUpperCase();
        return {
          kode: m.mesin.length > 6 ? `${m.mesin.slice(0, 4)}…` : m.mesin,
          kata: st === 'SETUP' ? 'setup' : st === 'PANTAU' ? 'pantau' : '',
          angka: `${String(w.filter((c) => c.lolos).length)}/${String(w.length)}`,
          titik: st === 'SETUP' ? 'hijau' : 'polos',
        };
      }));
    });
    return () => { hidup = false; };
  }, []);

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
        {/* Tanpa angka pasar: layar ini tampil SEBELUM masuk dan tidak memuat
            /api/pasar, jadi angka di sini cuma bisa diketik — dan yang
            diketik ("131") sudah basi saat daftar hidupnya 155 (3 Okt). */}
        <Text style={g.tagline}>{kalimatCakupan(null)}{'\n'}Angka mentah, dan kamu yang memutuskan.</Text>
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
        {pita.length > 0 && <PitaMesin aktif="snr" pilih={() => undefined} daftar={pita} />}
        {sebabPita !== null && <Text style={g.sebabPita}>{sebabPita}</Text>}
        <View style={g.chartBalik}>
          <ChartTertanam url={`${ASAL}/chart-embed?pair=BTCUSDT&tf=h1&mesin=snr&alat=volume,zona,level${terang ? '&tema=terang' : ''}`} asal={ASAL}
            suntik="true;" latar={W.chart} onMuat={() => undefined} onPesan={() => undefined} />
        </View>
      </View>

      <View style={[g.tembok, { paddingBottom: bottom + 16 }]}>
        <Kaca tebal tepi="atas" gaya={g.kartu}>
          <LinearGradient pointerEvents="none" colors={['rgba(229,173,81,0.12)', 'rgba(229,173,81,0.02)', 'rgba(229,173,81,0.06)']} locations={[0, 0.5, 1]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={g.merek}>
            <Image source={LOGO} style={g.logoKecil} accessibilityIgnoresInvertColors />
            <Text style={g.merekNama}>Analis<Text style={{ color: W.plusTeks }}>Market</Text></Text>
          </View>
          <Text style={g.judul}>Masuk untuk membaca{'\n'}analisa lengkapnya</Text>
          <Text style={g.ajak}>Kripto, emas, dan forex · 5 mesin dibaca sekaligus. Semuanya angka mentah, dan kamu yang memutuskan.</Text>
          {tahap !== 'telegram' && <View style={g.untung}>
            {UNTUNG.map((u) => (
              <View key={u.judul} style={g.untungSel}>
                <View style={g.untungIkon}><Ikon nama={u.ikon} warna={W.plus} ukuran={15} /></View>
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
                ikon={<Ikon nama="kirim" warna={W.utamaTeks} ukuran={16} />} />
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
  logoBesar: { width: 104, height: 104, borderRadius: 52 },
  nama: { fontSize: 28, fontWeight: '700', color: W.teksKuat, letterSpacing: -0.9 },
  tagline: { fontSize: H.nilai, color: W.teksSamar, lineHeight: 19, textAlign: 'center' },
  kaki: { position: 'absolute', fontSize: 9.5, color: W.teksSamar, letterSpacing: 1.4 },

  balik: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, paddingHorizontal: TALANG, gap: 8, opacity: 0.85 },
  chartBalik: { height: 330, position: 'relative', borderRadius: R.kartu, borderWidth: 1, borderColor: W.garis, backgroundColor: W.chart, overflow: 'hidden' },

  tembok: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 12, backgroundColor: 'rgba(8,7,6,0.40)' },
  kartu: { borderRadius: 30, paddingHorizontal: 18, paddingTop: 20, paddingBottom: 14, overflow: 'hidden', borderWidth: 1, borderColor: W.amberTepi },
  merek: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 14 },
  logoKecil: { width: 28, height: 28, borderRadius: 14 },
  merekNama: { fontSize: 17, fontWeight: '700', color: W.teksKuat, letterSpacing: -0.4 },
  judul: { fontSize: 24, fontWeight: '600', color: W.teksKuat, lineHeight: 29, letterSpacing: -0.7 },
  ajak: { marginTop: 8, fontSize: 13, color: W.teksRedup, lineHeight: 19 },
  untung: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  untungSel: { width: '48.5%', minHeight: 70, borderRadius: 14, padding: 10, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, backgroundColor: W.kacaIsi },
  untungIkon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: W.amberLatar },
  untungJudul: { marginTop: 6, fontSize: 12.5, fontWeight: '600', color: W.teksKuat },
  untungKet: { marginTop: 2, fontSize: 10.5, color: W.teksSamar, lineHeight: 14, minHeight: 28 },
  syarat: { marginTop: 12, fontSize: 11, color: W.teksSamar, textAlign: 'center', lineHeight: 16 },
  lewati: { alignSelf: 'center', marginTop: 8, minHeight: 36, justifyContent: 'center' },
  lewatiTeks: { fontSize: 13, color: W.teksRedup },
  sebabPita: { fontSize: 12, color: W.teksSamar, paddingVertical: 6 },
}));
