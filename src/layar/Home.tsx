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
import { useCallback, useEffect } from 'react';
import { gayaTema } from '../gaya/tema';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSisaBilah, useTinggiKepala } from '../gaya/jarak';
import { ambilKabarMasuk, ambilRingkas, type KabarMasuk, type Ringkas } from '../data/saya';
import { useMuat, type Hasil } from '../data/muat';
import { useSesi } from './Akun';
import { Ikon, type NamaIkon } from '../komponen/Ikon';
import { Kosong, Lbl, Mikro, PitaBasi, Tombol } from '../komponen/mockup';
import { Ikon as IkonKabar } from '../komponen/Ikon';
import { jamWib } from '../data/tampil';
import { W, H, R, TALANG } from '../gaya/token';
import type { Setelan } from '../data/simpan';
import { KartuPasarMini } from '../komponen/KartuPasarMini';
import { KartuPlus } from '../komponen/KartuPlus';
import { Tekan } from '../komponen/Tekan';
import { setBelumDibaca, useBelumDibaca } from '../data/kotakMasuk';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { JEDA_URUT } from '../gaya/gerak';

export type TujuanHome = 'Profil' | 'Pantauan' | 'PantauanBaru' | 'KabarOtomatis' | 'CekBanyak' | 'Kalender' | 'Belajar' | 'Pengaturan' | 'Sambung';
type Props = { setelan: Setelan; bukaPasar: () => void; buka: (ke: TujuanHome) => void; bukaTab: (t: 'amplus' | 'lainnya' | 'kabar') => void; bukaPasarDi: (simbol: string) => void };

/** Satu sel kisi: lencana di atas, ikon, label — mengikuti referensi pemilik. */
function Sel({ ikon, label, lencana, warnaLencana, emas = false, onPress }: {
  ikon: NamaIkon; label: string; lencana?: string; warnaLencana?: 'emas' | 'putih' | 'merah'; emas?: boolean; onPress: () => void;
}) {
  const lb = warnaLencana === 'merah' ? g.lencanaMerah : warnaLencana === 'putih' ? g.lencanaPutih : g.lencanaEmas;
  const lbTeks = warnaLencana === 'putih' ? W.teksKuat : warnaLencana === 'merah' ? '#fff' : '#1A1508';
  return (
    <Tekan onPress={onPress} accessibilityLabel={label} gayaLuar={{ width: '25%' }} gaya={g.sel}>
      {lencana !== undefined && <View style={[g.lencana, lb]}><Text style={[g.lencanaTeks, { color: lbTeks }]}>{lencana}</Text></View>}
      <Ikon nama={ikon} warna={emas ? W.plus : W.teksKuat} ukuran={26} />
      <Text style={g.selLabel} numberOfLines={1}>{label}</Text>
    </Tekan>
  );
}

/** Urutan masuk isi Home — hanya saat layar lahir (tab dibekukan sesudahnya), bukan tiap pindah tab. */
function Masuk({ i, children }: { i: number; children: React.ReactNode }) {
  /* Di web animasi layout Reanimated dengan easing kustom membuat Home
     merender PUTIH total tanpa galat (harness 20 Sep). Web bukan target
     produk — cuma harness — jadi di sana tanpa animasi masuk. */
  if (Platform.OS === 'web') return <View>{children}</View>;
  return <Animated.View entering={FadeInDown.duration(280).delay(i * JEDA_URUT)}>{children}</Animated.View>;
}

/**
 * KABAR TERAKHIR — jawaban untuk "ada apa hari ini". Dimuat ulang tiap
 * lencana belum-dibaca berubah (`kunci`), jadi kabar yang baru masuk lewat
 * push langsung tampil di sini tanpa polling tambahan.
 */
function KartuKabarTerakhir({ kunci, kosong, onPress }: { kunci: number; kosong: React.ReactElement; onPress: () => void }) {
  const muat = useCallback(async (): Promise<Hasil<KabarMasuk | null>> => {
    const j = await ambilKabarMasuk(null);
    if (!j.ok) return j;
    return { ok: true, isi: j.isi.kabar[0] ?? null };
  }, []);
  const { keadaan } = useMuat(muat, `kabar-terakhir:${String(kunci)}`);
  if (keadaan.fase !== 'ada' || keadaan.isi === null) return kosong;
  const k = keadaan.isi;
  return (
    <Tekan onPress={onPress} accessibilityLabel="Buka kabar" gaya={g.kabarTerakhir} skala={0.97}>
      <View style={g.kabarKepala}>
        <IkonKabar nama={k.jenis === 'sistem' ? 'gir' : k.jenis === 'promo' || k.jenis === 'otomatis' ? 'plus' : 'kabar'} warna={W.plusTeks} ukuran={14} />
        <Text style={g.kabarCap}>Kabar terakhir · {jamWib(Math.floor(new Date(k.dibuat).getTime() / 1000))}</Text>
        {!k.dibaca && <View style={g.kabarTitik} />}
      </View>
      <Text style={g.kabarJudul} numberOfLines={1}>{k.judul}</Text>
      <Text style={g.kabarIsi} numberOfLines={2}>{k.isi}</Text>
    </Tekan>
  );
}

export function LayarHome({ setelan, bukaPasar, buka, bukaTab, bukaPasarDi }: Props) {
  const tinggiKepala = useTinggiKepala();
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
  const belum = useBelumDibaca();
  useEffect(() => { if (r !== null && r.kabarBelumDibaca !== undefined) setBelumDibaca(r.kabarBelumDibaca); }, [r]);
  const nama = sesi?.akun.nama ?? null;
  const google = sesi?.jenis === 'clerk';
  const angka = (n: number | undefined): string => (n === undefined ? '—' : n.toLocaleString('id-ID'));

  return (
    <ScrollView
      style={g.akar}
      contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 8 }}
      refreshControl={<RefreshControl refreshing={menyegarkan} tintColor={W.teksRedup} onRefresh={segarkan} />}
    >
      {basi !== null && <PitaBasi kalimat={basi} />}

      {/* Kartu akun — ringkas: siapa, status, dua angka. Emas hanya untuk AM+. */}
      <Masuk i={0}><View style={[g.akun, plus ? g.akunPlus : g.akunGratis]}>
        {plus && <LinearGradient pointerEvents="none" colors={['rgba(201,169,97,0.18)', 'rgba(201,169,97,0.04)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={g.akunNama} numberOfLines={1}>{nama === null ? 'Selamat datang' : `Halo, ${nama.split(' ')[0] ?? nama}`}</Text>
          <Text style={g.akunKet} numberOfLines={1}>
            {plus ? `AnalisMarket+ · ${angka(r?.sisaHariPlus)} hari lagi` : 'Paket gratis'} · {google ? 'Google' : 'Telegram'}
          </Text>
        </View>
        <View style={g.angka}><Text style={g.angkaBesar}>{r === null ? '—' : `${String(r.pantauanAktif)}/${String(r.maksPantauan)}`}</Text><Text style={g.angkaLabel}>pantauan</Text></View>
        {/* Akun gratis: "Gratis", bukan "— hari AM+" (garis terbaca sebagai angka yang gagal dimuat). */}
        <View style={g.angka}><Text style={g.angkaBesar}>{plus ? angka(r?.sisaHariPlus) : 'Gratis'}</Text><Text style={g.angkaLabel}>{plus ? 'hari AM+' : 'paket'}</Text></View>
      </View></Masuk>
      {/* Kabar ke HP lewat push; ajakannya ke saklar notifikasi, bukan ke Telegram. */}
      {!setelan.pushNyala && <Tombol teks="Nyalakan notifikasi — kabar pantauan datang ke HP ini" jenis="kedua" onPress={() => { buka('Pengaturan'); }} />}

      {/* Kisi menu — SEMUA pintu di satu tempat, ikon di atas label. */}
      <Masuk i={1}><View style={g.kisi}>
        <Sel ikon="pasar" label="Chart" onPress={bukaPasar} />
        <Sel ikon="kabar" label="Pantauan" lencana={r === null ? undefined : `${String(r.pantauanAktif)} aktif`} warnaLencana="putih" onPress={() => { buka('Pantauan'); }} />
        <Sel ikon="tambah" label="Pantauan baru" onPress={() => { buka('PantauanBaru'); }} />
        <Sel ikon="kalender" label="Kabar otomatis" lencana="AM+" emas={plus} onPress={() => { buka('KabarOtomatis'); }} />
        <Sel ikon="kabar" label="Kabar" lencana={belum > 0 ? `${String(belum)} baru` : undefined} warnaLencana="merah" onPress={() => { bukaTab('kabar'); }} />
        <Sel ikon="kisi" label="Cek banyak" lencana="AM+" emas={plus} onPress={() => { buka('CekBanyak'); }} />
        <Sel ikon="kalender" label="Kalender" onPress={() => { buka('Kalender'); }} />
        <Sel ikon="buku" label="Belajar" onPress={() => { buka('Belajar'); }} />
        <Sel ikon="profil" label="Profil" onPress={() => { buka('Profil'); }} />
        <Sel ikon="gir" label="Pengaturan" onPress={() => { buka('Pengaturan'); }} />
        <Sel ikon="plus" label="AnalisMarket+" emas onPress={() => { bukaTab('amplus'); }} />
        <Sel ikon="turunkan" label="Lainnya" onPress={() => { bukaTab('lainnya'); }} />
      </View></Masuk>

      {/* PEMANIS — bento sparkline (referensi pemilik): satu besar, tiga kecil.
          BTC besar; XAU/USD, ETH, SOL kecil. Hiasan yang hidup, bukan daftar. */}
      <Masuk i={2}><View style={g.bento}>
        <KartuPasarMini simbol="BTCUSDT" nama="Bitcoin" besar onPress={() => { bukaPasarDi('BTCUSDT'); }} />
        <View style={g.bentoKanan}>
          <KartuPasarMini simbol="XAU/USD" nama="Emas" onPress={() => { bukaPasarDi('XAU/USD'); }} />
          <View style={g.bentoBawah}>
            <KartuPasarMini simbol="ETHUSDT" nama="ETH" onPress={() => { bukaPasarDi('ETHUSDT'); }} />
            <KartuPasarMini simbol="SOLUSDT" nama="SOL" onPress={() => { bukaPasarDi('SOLUSDT'); }} />
          </View>
        </View>
      </View></Masuk>

      {/* PELANGGAN: kabar terakhir, bukan kartu AM+ kedua. Kartu sapaan sudah
          menyebut "AnalisMarket+ · 23 hari lagi"; mengulangnya di bawah cuma
          menghabiskan satu layar (audit 20 Sep). Yang belum berlangganan
          tetap melihat kartu jualan. */}
      <Masuk i={3}>{plus && sesi !== null
        ? <KartuKabarTerakhir kunci={belum} kosong={<KartuPlus plus sisaHari={r?.sisaHariPlus} onPress={() => { bukaTab('amplus'); }} />} onPress={() => { bukaTab('kabar'); }} />
        : <KartuPlus plus={plus} sisaHari={r?.sisaHariPlus} onPress={() => { bukaTab('amplus'); }} />}</Masuk>

      <Mikro>Alat baca chart, bukan alat prediksi. Bukan ajakan melakukan transaksi.</Mikro>
    </ScrollView>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  kabarTerakhir: { backgroundColor: W.kartu, borderWidth: 1, borderColor: W.garis, borderRadius: R.kartu + 2, padding: 14, gap: 4 },
  kabarKepala: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kabarCap: { color: W.plusTeks, fontSize: H.label, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', flex: 1 },
  kabarTitik: { width: 8, height: 8, borderRadius: 4, backgroundColor: W.plus },
  kabarJudul: { color: W.teksKuat, fontSize: H.nama, fontWeight: '700', marginTop: 4 },
  kabarIsi: { color: W.teks, fontSize: H.nilai, lineHeight: 19 },
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
  sel: { alignItems: 'center', paddingTop: 12, paddingBottom: 10, gap: 7 },
  selLabel: { fontSize: 11, color: W.teks },
  lencana: { position: 'absolute', top: -2, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  lencanaEmas: { backgroundColor: W.plus }, lencanaPutih: { backgroundColor: W.tinta(0.12) }, lencanaMerah: { backgroundColor: W.turun },
  lencanaTeks: { fontSize: 9, fontWeight: '700' },
  bento: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  bentoKanan: { flex: 1.2, gap: 8 },
  bentoBawah: { flexDirection: 'row', gap: 8 },
}));
