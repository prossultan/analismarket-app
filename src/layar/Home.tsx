/**
 * HOME — pusat menu, bukan pasar. Varian A di `opendesign/mockups/home-2026`.
 *
 * Keputusan pemilik 19 Sep: "pasar jangan taruh di home". Harga, kartu
 * pasar, dan daftar "yang bergerak" pindah seluruhnya ke tab Pasar. Yang
 * tinggal di sini: siapa yang masuk, apa yang sudah dipasang, dan pintu ke
 * tiap fitur — supaya orang tidak perlu menebak menunya ada di mana.
 *
 * Satu permintaan jaringan saja (`/api/saya`). Dulu Home menarik pasar DAN
 * bacaan tiap dibuka; sekarang kedua permintaan itu milik tab Pasar.
 */
import { useCallback } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useHeaderHeight } from '@react-navigation/elements';
import { LinearGradient } from 'expo-linear-gradient';
import { useSisaBilah } from '../gaya/jarak';
import { ambilRingkas, type Ringkas } from '../data/saya';
import { useMuat, type Hasil } from '../data/muat';
import { useSesi } from './Akun';
import { Ikon, type NamaIkon } from '../komponen/Ikon';
import { Kosong, Lbl, Mikro, PitaBasi, Tombol } from '../komponen/mockup';
import { W, H, R, TALANG } from '../gaya/token';
import type { Setelan } from '../data/simpan';
import { KartuPasarMini } from '../komponen/KartuPasarMini';
import { KartuPlus } from '../komponen/KartuPlus';

export type TujuanHome = 'Profil' | 'Pantauan' | 'PantauanBaru' | 'KabarOtomatis' | 'Kredit' | 'CekBanyak' | 'Kalender' | 'Belajar' | 'Pengaturan' | 'Sambung';
type Props = { setelan: Setelan; bukaPasar: () => void; buka: (ke: TujuanHome) => void; bukaTab: (t: 'amplus' | 'lainnya') => void; bukaPasarDi: (simbol: string) => void };

/** Satu sel kisi: lencana di atas, ikon, label — mengikuti referensi pemilik. */
function Sel({ ikon, label, lencana, warnaLencana, emas = false, onPress }: {
  ikon: NamaIkon; label: string; lencana?: string; warnaLencana?: 'emas' | 'putih' | 'merah'; emas?: boolean; onPress: () => void;
}) {
  const lb = warnaLencana === 'merah' ? g.lencanaMerah : warnaLencana === 'putih' ? g.lencanaPutih : g.lencanaEmas;
  const lbTeks = warnaLencana === 'putih' ? W.teksKuat : warnaLencana === 'merah' ? '#fff' : '#1A1508';
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}
      style={({ pressed }) => [g.sel, pressed && { opacity: 0.6 }]}>
      {lencana !== undefined && <View style={[g.lencana, lb]}><Text style={[g.lencanaTeks, { color: lbTeks }]}>{lencana}</Text></View>}
      <Ikon nama={ikon} warna={emas ? W.plus : W.teksKuat} ukuran={26} />
      <Text style={g.selLabel} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

export function LayarHome({ setelan, bukaPasar, buka, bukaTab, bukaPasarDi }: Props) {
  const tinggiKepala = useHeaderHeight();
  const sisaBilah = useSisaBilah();
  const sesi = useSesi();

  const muat = useCallback(async (): Promise<Hasil<Ringkas | null>> => {
    if (sesi === null) return { ok: true, isi: null };
    return ambilRingkas();
  }, [sesi]);
  const { keadaan, segarkan, menyegarkan, ulangi } = useMuat(muat, sesi === null ? 'kosong' : `ada:${sesi.jenis ?? 'mini'}`);

  if (keadaan.fase === 'gagal') {
    return (
      <View style={[g.akar, { paddingTop: tinggiKepala, paddingBottom: sisaBilah, paddingHorizontal: TALANG, justifyContent: 'center' }]}>
        <Kosong ikon="rumah" judul="Akun tidak terbaca" kalimat={keadaan.kalimat} aksi={ulangi} />
      </View>
    );
  }
  const r = keadaan.fase === 'ada' ? keadaan.isi : null;
  const basi = keadaan.fase === 'ada' ? keadaan.basi : null;
  const plus = r?.langganan === 'plus';
  const nama = sesi?.akun.nama ?? null;
  const google = sesi?.jenis === 'clerk';
  const perluTelegram = r !== null && !r.telegramTersambung;
  const angka = (n: number | undefined): string => (n === undefined ? '—' : n.toLocaleString('id-ID'));

  return (
    <ScrollView
      style={g.akar}
      contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 8 }}
      refreshControl={<RefreshControl refreshing={menyegarkan} tintColor={W.teksRedup} onRefresh={segarkan} />}
    >
      {basi !== null && <PitaBasi kalimat={basi} />}

      {/* Kartu akun — ringkas: siapa, status, dua angka. Emas hanya untuk AM+. */}
      <View style={[g.akun, plus ? g.akunPlus : g.akunGratis]}>
        {plus && <LinearGradient pointerEvents="none" colors={['rgba(201,169,97,0.18)', 'rgba(201,169,97,0.04)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={g.akunNama} numberOfLines={1}>{nama === null ? 'Halo' : `Halo, ${nama.split(' ')[0] ?? nama}`}</Text>
          <Text style={g.akunKet} numberOfLines={1}>
            {plus ? `AnalisMarket+ · ${angka(r?.sisaHariPlus)} hari lagi` : 'Paket gratis'} · {google ? 'Google' : 'Telegram'}
          </Text>
        </View>
        <View style={g.angka}><Text style={g.angkaBesar}>{angka(r?.poin)}</Text><Text style={g.angkaLabel}>poin</Text></View>
        <View style={g.angka}><Text style={g.angkaBesar}>{r === null ? '—' : `${String(r.pantauanAktif)}/${String(r.maksPantauan)}`}</Text><Text style={g.angkaLabel}>pantauan</Text></View>
      </View>
      {perluTelegram && <Tombol teks="Tautkan Telegram — pantauan & kredit ada di bot" jenis="kedua" onPress={() => { buka('Sambung'); }} />}

      {/* Kisi menu — SEMUA pintu di satu tempat, ikon di atas label. */}
      <View style={g.kisi}>
        <Sel ikon="pasar" label="Chart" onPress={bukaPasar} />
        <Sel ikon="kabar" label="Pantauan" lencana={r === null ? undefined : `${String(r.pantauanAktif)} aktif`} warnaLencana="putih" onPress={() => { buka('Pantauan'); }} />
        <Sel ikon="tambah" label="Pantauan baru" onPress={() => { buka('PantauanBaru'); }} />
        <Sel ikon="kalender" label="Kabar otomatis" lencana="AM+" emas={plus} onPress={() => { buka('KabarOtomatis'); }} />
        <Sel ikon="analisis" label="Kredit" onPress={() => { buka('Kredit'); }} />
        <Sel ikon="kisi" label="Cek banyak" lencana="AM+" emas={plus} onPress={() => { buka('CekBanyak'); }} />
        <Sel ikon="kalender" label="Kalender" onPress={() => { buka('Kalender'); }} />
        <Sel ikon="buku" label="Belajar" onPress={() => { buka('Belajar'); }} />
        <Sel ikon="profil" label="Profil" onPress={() => { buka('Profil'); }} />
        <Sel ikon="gir" label="Pengaturan" onPress={() => { buka('Pengaturan'); }} />
        <Sel ikon="plus" label="AnalisMarket+" emas onPress={() => { bukaTab('amplus'); }} />
        <Sel ikon="turunkan" label="Lainnya" onPress={() => { bukaTab('lainnya'); }} />
      </View>

      {/* PEMANIS — bento sparkline (referensi pemilik): satu besar, tiga kecil.
          BTC besar; XAU/USD, ETH, SOL kecil. Hiasan yang hidup, bukan daftar. */}
      <View style={g.bento}>
        <KartuPasarMini simbol="BTCUSDT" nama="Bitcoin" besar onPress={() => { bukaPasarDi('BTCUSDT'); }} />
        <View style={g.bentoKanan}>
          <KartuPasarMini simbol="XAU/USD" nama="Emas" onPress={() => { bukaPasarDi('XAU/USD'); }} />
          <View style={g.bentoBawah}>
            <KartuPasarMini simbol="ETHUSDT" nama="ETH" onPress={() => { bukaPasarDi('ETHUSDT'); }} />
            <KartuPasarMini simbol="SOLUSDT" nama="SOL" onPress={() => { bukaPasarDi('SOLUSDT'); }} />
          </View>
        </View>
      </View>

      <KartuPlus plus={plus} sisaHari={r?.sisaHariPlus} onPress={() => { bukaTab('amplus'); }} />

      <Mikro>Alat baca chart, bukan alat prediksi. Bukan ajakan melakukan transaksi.</Mikro>
    </ScrollView>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  akun: { borderRadius: R.kartu + 2, paddingVertical: 12, paddingHorizontal: 13, overflow: 'hidden', borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  akunPlus: { borderColor: 'rgba(201,169,97,0.38)', backgroundColor: W.kartu },
  akunGratis: { borderColor: W.garis, backgroundColor: W.kartu },
  akunNama: { fontSize: H.status, fontWeight: '700', color: W.teksKuat, letterSpacing: -0.3 },
  akunKet: { fontSize: H.alat, color: W.teksRedup, marginTop: 2 },
  angka: { alignItems: 'flex-end' },
  angkaBesar: { fontSize: 16, fontWeight: '600', color: W.teksKuat, fontVariant: ['tabular-nums'] },
  angkaLabel: { fontSize: H.label, color: W.teksSamar },
  kisi: { backgroundColor: W.kartu, borderWidth: 1, borderColor: W.garis, borderRadius: 20, paddingTop: 14, paddingBottom: 8, paddingHorizontal: 4, flexDirection: 'row', flexWrap: 'wrap' },
  sel: { width: '25%', alignItems: 'center', paddingTop: 12, paddingBottom: 10, gap: 7 },
  selLabel: { fontSize: 11, color: W.teks },
  lencana: { position: 'absolute', top: -2, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  lencanaEmas: { backgroundColor: W.plus }, lencanaPutih: { backgroundColor: 'rgba(255,255,255,0.12)' }, lencanaMerah: { backgroundColor: W.turun },
  lencanaTeks: { fontSize: 9, fontWeight: '700' },
  bento: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  bentoKanan: { flex: 1.2, gap: 8 },
  bentoBawah: { flexDirection: 'row', gap: 8 },
});
