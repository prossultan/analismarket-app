/**
 * HOME — redesain kaca obsidian (Okt 2026, mockup `opendesign/mockups/polish-2026`).
 *
 * Urutan, dari yang paling sering dicari:
 *   kepala        avatar (→ Menu) · sapaan · status AM+ · lonceng kabar
 *   kartu utama   pasar/tf/mesin TERAKHIR DIBUKA dengan bacaan asli
 *   lanjut belajar video Akademi terakhir (dari kemajuan di perangkat ini)
 *   enam pintu    yang tidak dobel dengan tab — dengan angka hidup
 *   pasar favorit tiga kartu sparkline, digulir mendatar
 *   kabar / AM+   kabar terakhir untuk pelanggan, kartu AM+ untuk yang belum
 *
 * Keputusan pemilik yang tetap berlaku: tidak ada DAFTAR pasar di Home
 * (19 Sep). Kartu utama bukan daftar — ia satu pasar yang orangnya sendiri
 * pilih, dan satu ketukan kembali ke sana.
 *
 * Kisi 12 ikon lama dipangkas ke 6: Chart, Kabar, AnalisMarket+, dan Lainnya
 * sudah jadi tab (dobel), Profil dan Pengaturan pindah ke Menu dari avatar.
 */
import { ISTILAH } from '../data/istilah';
import { useCallback, useEffect } from 'react';
import { gayaTema } from '../gaya/tema';
import { Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSisaBilah } from '../gaya/jarak';
import { ambilKabarMasuk, ambilRingkas, type KabarMasuk, type Ringkas } from '../data/saya';
import { useMuat, type Hasil } from '../data/muat';
import { useKemajuan, urlSampul } from '../data/akademi';
import { useSesi } from './Akun';
import { Ikon, type NamaIkon } from '../komponen/Ikon';
import { Kosong, Mikro, PitaBasi, Tombol } from '../komponen/mockup';
import { jamWib } from '../data/tampil';
import { W, R, TALANG } from '../gaya/token';
import type { Setelan } from '../data/simpan';
import { Latar } from '../komponen/Latar';
import { KartuUtama } from '../komponen/KartuUtama';
import { KartuPasarMini } from '../komponen/KartuPasarMini';
import { KartuPlus } from '../komponen/KartuPlus';
import { AvatarKepala } from '../komponen/AvatarKepala';
import { Tekan } from '../komponen/Tekan';
import { setBelumDibaca, useBelumDibaca } from '../data/kotakMasuk';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { JEDA_URUT } from '../gaya/gerak';

export type TujuanHome = 'Profil' | 'Pantauan' | 'PantauanBaru' | 'KabarOtomatis' | 'CekBanyak' | 'Kalender' | 'Belajar' | 'Pengaturan' | 'Sambung' | 'Menu';
type Props = {
  setelan: Setelan; bukaPasar: () => void; bukaBacaan: () => void; buka: (ke: TujuanHome) => void;
  bukaTab: (t: 'amplus' | 'kabar' | 'akademi') => void; bukaPelajaran: (id: string) => void; bukaPasarDi: (simbol: string) => void;
};

/** "Jumat, 9 Okt" — tanggal hari ini, dalam bahasa produk. */
function tanggalPendek(): string {
  const t = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Urutan masuk isi Home — hanya saat layar lahir (tab dibekukan sesudahnya), bukan tiap pindah tab. */
function Masuk({ i, children }: { i: number; children: React.ReactNode }) {
  /* Di web animasi layout Reanimated dengan easing kustom membuat Home
     merender PUTIH total tanpa galat (harness 20 Sep). Web bukan target
     produk — cuma harness — jadi di sana tanpa animasi masuk. */
  if (Platform.OS === 'web') return <View>{children}</View>;
  return <Animated.View entering={FadeInDown.duration(280).delay(i * JEDA_URUT)}>{children}</Animated.View>;
}

/** Satu pintu: ikon dalam kotak amber, nama, dan angka yang HIDUP (bukan hiasan). */
function Pintu({ ikon, judul, ket, am = false, onPress }: { ikon: NamaIkon; judul: string; ket: string; am?: boolean; onPress: () => void }) {
  return (
    <Tekan onPress={onPress} accessibilityLabel={judul} gayaLuar={{ flex: 1 }} gaya={g.pintu}>
      {am && <Text style={g.pintuAm}>AM+</Text>}
      <View style={g.pintuIkon}><Ikon nama={ikon} warna={W.plus} ukuran={18} /></View>
      <View style={{ flex: 1 }} />
      <Text style={g.pintuJudul} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.86}>{judul}</Text>
      <Text style={g.pintuKet} numberOfLines={1}>{ket}</Text>
    </Tekan>
  );
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
        <Ikon nama={k.jenis === 'sistem' ? 'gir' : k.jenis === 'promo' || k.jenis === 'otomatis' ? 'plus' : 'kabar'} warna={W.plusTeks} ukuran={14} />
        <Text style={g.kabarCap}>Kabar terakhir · {jamWib(Math.floor(new Date(k.dibuat).getTime() / 1000))}</Text>
        {!k.dibaca && <View style={g.kabarTitik} />}
      </View>
      <Text style={g.kabarJudul} numberOfLines={1}>{k.judul}</Text>
      <Text style={g.kabarIsi} numberOfLines={2}>{k.isi}</Text>
    </Tekan>
  );
}

export function LayarHome({ setelan, bukaPasar, bukaBacaan, buka, bukaTab, bukaPelajaran, bukaPasarDi }: Props) {
  const { top } = useSafeAreaInsets();
  const sisaBilah = useSisaBilah();
  const sesi = useSesi();

  const muat = useCallback(async (): Promise<Hasil<Ringkas | null>> => {
    if (sesi === null) return { ok: true, isi: null };
    return ambilRingkas();
  }, [sesi]);
  const { keadaan, segarkan, menyegarkan, ulangi } = useMuat(muat, sesi === null ? 'kosong' : `ada:${sesi.jenis ?? 'mini'}`);

  /* SEMUA KAIT DI ATAS early return. Dijaga `skrip/periksa-kait.mjs`. */
  const r = keadaan.fase === 'ada' ? keadaan.isi : null;
  const basi = keadaan.fase === 'ada' ? keadaan.basi : null;
  const plus = r?.langganan === 'plus';
  const belum = useBelumDibaca();
  const kemajuan = useKemajuan();
  useEffect(() => { if (r !== null && r.kabarBelumDibaca !== undefined) setBelumDibaca(r.kabarBelumDibaca); }, [r]);

  const nama = sesi?.akun.nama ?? null;
  const namaDepan = nama === null || nama.trim() === '' ? null : (nama.trim().split(' ')[0] ?? nama);

  const kepala = (
    <View style={g.kepala}>
      <AvatarKepala ukuran={42} label="Menu" onPress={() => { buka('Menu'); }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={g.tanggal}>{tanggalPendek()}</Text>
        {/* Nama tampilan Telegram boleh kosong, dan itu sah — sapaannya tidak menggantung. */}
        <Text style={g.sapa} numberOfLines={1}>{namaDepan === null ? 'Selamat datang' : `Halo, ${namaDepan}`}</Text>
      </View>
      {r !== null && (plus
        ? <View style={g.lencanaAm}><Text style={g.lencanaAmTeks}>AM+ · {r.sisaHariPlus} hari</Text></View>
        : <View style={g.lencanaGratis}><Text style={g.lencanaGratisTeks}>Gratis</Text></View>)}
      <Tekan onPress={() => { bukaTab('kabar'); }} accessibilityLabel={belum > 0 ? `Kabar, ${String(belum)} belum dibaca` : 'Kabar'} gaya={g.lonceng}>
        <Ikon nama="kabar" warna={W.teksKuat} ukuran={20} />
        {belum > 0 && <View style={g.lencanaLonceng}><Text style={g.lencanaLoncengTeks}>{belum > 99 ? '99+' : String(belum)}</Text></View>}
      </Tekan>
    </View>
  );

  if (keadaan.fase === 'gagal') {
    return (
      <Latar>
        <View style={{ flex: 1, paddingTop: top + 8, paddingBottom: sisaBilah, paddingHorizontal: TALANG }}>
          {kepala}
          <Kosong ikon="rumah" judul="Akun tidak terbaca" kalimat={keadaan.kalimat} aksi={ulangi} />
        </View>
      </Latar>
    );
  }

  const terakhir = kemajuan.terakhir;
  const posisi = terakhir === null ? 0 : kemajuan.posisi[terakhir.id] ?? 0;
  const durasi = terakhir?.menit === null || terakhir === null ? 0 : (terakhir.menit ?? 0) * 60;
  const sampul = urlSampul(terakhir?.sampul ?? undefined);

  return (
    <Latar>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: top + 8, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 12 }}
        refreshControl={<RefreshControl refreshing={menyegarkan} tintColor={W.teksRedup} onRefresh={segarkan} />}
      >
        {kepala}
        {basi !== null && <PitaBasi kalimat={basi} />}

        <Masuk i={0}>
          <KartuUtama pasar={setelan.pasar} tf={setelan.tf} mesin={setelan.mesin} bukaPasar={bukaPasar} bukaBacaan={bukaBacaan} />
        </Masuk>

        <Masuk i={1}>
          <Tekan onPress={() => { if (terakhir !== null) bukaPelajaran(terakhir.id); else bukaTab('akademi'); }} skala={0.97}
            accessibilityLabel={terakhir === null ? 'Buka Akademi' : `Lanjutkan ${terakhir.judul}`} gaya={g.lanjut}>
            <View style={g.thumb}>
              {sampul !== null
                ? <Image source={{ uri: sampul }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                : <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}><Ikon nama="akademi" warna={W.plus} ukuran={24} /></View>}
              <View style={g.thumbPutar}><Ikon nama="putar" warna="#fff" isi="#fff" ukuran={18} /></View>
            </View>
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <Text style={g.alis}>{terakhir === null ? 'AKADEMI · BELAJAR DARI NOL' : `AKADEMI · BAB ${String(terakhir.bab)} · VIDEO ${String(terakhir.no).padStart(2, '0')}`}</Text>
              <Text style={g.lanjutJudul} numberOfLines={1}>{terakhir === null ? 'Mulai dari video 01' : terakhir.judul}</Text>
              {terakhir !== null && durasi > 0 && (
                <View style={g.bar}><View style={[g.barIsi, { width: `${String(Math.min(100, (posisi / durasi) * 100))}%` as `${number}%` }]} /></View>
              )}
              <Text style={g.lanjutKet}>{terakhir === null ? '6 bab · video tayang bertahap' : kemajuan.selesai.length > 0 ? `${String(kemajuan.selesai.length)} video selesai di perangkat ini` : 'Lanjutkan dari detik terakhir'}</Text>
            </View>
            <Text style={g.panah}>›</Text>
          </Tekan>
        </Masuk>

        {/* Kabar ke HP lewat push; ajakannya ke saklar notifikasi, bukan ke Telegram. */}
        {!setelan.pushNyala && <Tombol teks="Nyalakan notifikasi — kabar pantauan datang ke HP ini" jenis="kedua" onPress={() => { buka('Pengaturan'); }} />}

        <Masuk i={2}>
          <View style={{ gap: 10 }}>
            <View style={g.barisPintu}>
              <Pintu ikon="mata" judul="Pantauan" ket={r === null ? '—' : `${String(r.pantauanAktif)} dari ${String(r.maksPantauan)} aktif`} onPress={() => { buka('Pantauan'); }} />
              <Pintu ikon="tambah" judul="Pantau baru" ket="pasar × tf" onPress={() => { buka('PantauanBaru'); }} />
              <Pintu ikon="kilat" judul="Kabar otomatis" ket="rangkuman pagi" am onPress={() => { buka('KabarOtomatis'); }} />
            </View>
            <View style={g.barisPintu}>
              <Pintu ikon="kisi" judul="Cek banyak" ket="sampai 12 pasar" am onPress={() => { buka('CekBanyak'); }} />
              <Pintu ikon="kalender" judul="Kalender" ket="30 hari ke depan" onPress={() => { buka('Kalender'); }} />
              <Pintu ikon="buku" judul="Istilah" ket={`${String(ISTILAH.length)} istilah`} onPress={() => { buka('Belajar'); }} />
            </View>
          </View>
        </Masuk>

        <Masuk i={3}>
          <View style={g.seksi}><Text style={g.seksiJudul}>Pasar favorit</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }} style={{ marginHorizontal: -TALANG }}>
            <View style={{ width: TALANG - 10 }} />
            <KartuPasarMini simbol="XAU/USD" nama="Emas" lebar={150} onPress={() => { bukaPasarDi('XAU/USD'); }} />
            <KartuPasarMini simbol="ETHUSDT" nama="ETH" lebar={150} onPress={() => { bukaPasarDi('ETHUSDT'); }} />
            <KartuPasarMini simbol="SOLUSDT" nama="SOL" lebar={150} onPress={() => { bukaPasarDi('SOLUSDT'); }} />
            <KartuPasarMini simbol="BTCUSDT" nama="Bitcoin" lebar={150} onPress={() => { bukaPasarDi('BTCUSDT'); }} />
            <View style={{ width: TALANG - 10 }} />
          </ScrollView>
        </Masuk>

        {/* PELANGGAN: kabar terakhir, bukan kartu AM+ kedua — status AM+ sudah
            di kepala. Yang belum berlangganan tetap melihat kartu AM+. */}
        <Masuk i={4}>{plus && sesi !== null
          ? <KartuKabarTerakhir kunci={belum} kosong={<KartuPlus plus sisaHari={r?.sisaHariPlus} onPress={() => { bukaTab('amplus'); }} />} onPress={() => { bukaTab('kabar'); }} />
          : <KartuPlus plus={plus} sisaHari={r?.sisaHariPlus} onPress={() => { bukaTab('amplus'); }} />}</Masuk>

        <Mikro>Alat baca chart, bukan alat prediksi. Bukan ajakan melakukan transaksi.</Mikro>
      </ScrollView>
    </Latar>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  kepala: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingBottom: 2 },
  tanggal: { fontSize: 12, color: W.teksRedup },
  sapa: { fontSize: 19, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.4, marginTop: 1 },
  lencanaAm: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: W.amberTepi, backgroundColor: W.amberLatar },
  lencanaAmTeks: { fontSize: 11.5, fontWeight: '700', color: W.plusTeks },
  lencanaGratis: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, backgroundColor: W.isiSamar },
  lencanaGratisTeks: { fontSize: 11.5, fontWeight: '600', color: W.teksRedup },
  lonceng: {
    width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center',
    backgroundColor: W.kacaIsi, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, borderTopColor: W.kacaKilau,
  },
  lencanaLonceng: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: W.plus, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: W.latar },
  lencanaLoncengTeks: { fontSize: 10, fontWeight: '800', color: W.utamaTeks },

  lanjut: {
    flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 20, padding: 10, paddingRight: 12,
    backgroundColor: W.kacaIsi, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, borderTopColor: W.kacaKilau,
  },
  thumb: { width: 104, height: 58, borderRadius: 11, overflow: 'hidden', backgroundColor: W.latar900, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.tinta(0.1) },
  thumbPutar: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  alis: { fontSize: 9.5, letterSpacing: 1.4, color: W.plusTeks, fontWeight: '700' },
  lanjutJudul: { fontSize: 13.5, fontWeight: '600', color: W.teksKuat },
  lanjutKet: { fontSize: 11, color: W.teksSamar },
  bar: { height: 4, borderRadius: 2, backgroundColor: W.tinta(0.1), overflow: 'hidden', marginTop: 2 },
  barIsi: { height: 4, borderRadius: 2, backgroundColor: W.plus },
  panah: { fontSize: 20, color: W.teksSamar, marginTop: -2 },

  barisPintu: { flexDirection: 'row', gap: 8 },
  pintu: {
    height: 88, borderRadius: 18, padding: 10, paddingTop: 12,
    backgroundColor: W.kacaIsi, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, borderTopColor: W.kacaKilau,
  },
  pintuIkon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: W.amberLatar, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: 'rgba(229,173,81,0.22)' },
  pintuAm: { position: 'absolute', top: 10, right: 10, fontSize: 9, fontWeight: '800', color: W.plusTeks, letterSpacing: 0.4 },
  pintuJudul: { fontSize: 12.5, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.2 },
  pintuKet: { fontSize: 10.5, color: W.teksSamar, marginTop: 1 },

  seksi: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, marginTop: 2 },
  seksiJudul: { fontSize: 15, fontWeight: '600', color: W.teksKuat },

  kabarTerakhir: {
    borderRadius: R.kartu, padding: 14, gap: 4,
    backgroundColor: W.kacaIsi, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, borderTopColor: W.kacaKilau,
  },
  kabarKepala: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kabarCap: { color: W.plusTeks, fontSize: 10, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', flex: 1 },
  kabarTitik: { width: 8, height: 8, borderRadius: 4, backgroundColor: W.plus },
  kabarJudul: { color: W.teksKuat, fontSize: 14, fontWeight: '600', marginTop: 4 },
  kabarIsi: { color: W.teks, fontSize: 12.5, lineHeight: 18 },
}));
