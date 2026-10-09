/**
 * MENU — dulu tab "Lainnya". Sejak redesain Okt 2026 Lainnya bukan tab lagi
 * (slotnya milik Akademi); isinya dibuka dari AVATAR di kepala Home — pola
 * app 2026: "orangnya" di kiri atas, semua yang menyangkut akun di baliknya.
 *
 * Isinya tetap tiga kelompok bernama, plus blok umur data: "ini angka kapan"
 * muncul terus, dan jawabannya sebelumnya tidak ada di mana pun.
 */
import { ISTILAH } from '../data/istilah';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { gayaTema } from '../gaya/tema';
import { useSisaBilah, useTinggiKepala } from '../gaya/jarak';
import { Blok, Butir, Lbl, Menu, Mikro, Nil } from '../komponen/mockup';
import { capBuild } from '../data/versi';
import { Merek } from '../komponen/Merek';
import { Latar } from '../komponen/Latar';
import { AvatarKepala } from '../komponen/AvatarKepala';
import { Tekan } from '../komponen/Tekan';
import { useSesi } from './Akun';
import { useStatusPlus } from '../data/statusPlus';
import { jamWib } from '../data/tampil';
import { W, R, TALANG } from '../gaya/token';
import type { Setelan } from '../data/simpan';

export type KunciMenu = 'kalender' | 'belajar' | 'profil' | 'pengaturan' | 'tentang' | 'pantauan' | 'sambung';

type Props = {
  setelan: Setelan;
  bukaDokumen: (k: 'syarat' | 'privasi') => void;
  bukaMenu: (kunci: KunciMenu) => void;
  versi: string;
  /** Detik epoch kapan data terakhir masuk; null = belum ada. */
  umur?: { harga: number | null; lilin: number | null; kalender: number | null };
};

export function LayarMenu({ setelan, bukaDokumen, bukaMenu, umur }: Props) {
  /* Keterangan baris IKUT SESI — dulu "belum tersambung" diketik, dan
     sesudah orang menyambung menu ini tetap bilang belum. */
  const sesi = useSesi();
  /* Status AM+ dari jawaban /api/saya terakhir, bukan dari sesi. */
  const status = useStatusPlus();
  const tinggiKepala = useTinggiKepala();
  const sisaBilah = useSisaBilah();
  const jam = (d: number | null): string => (d === null ? '—' : jamWib(d));
  const nama = sesi?.akun.nama?.trim() ?? '';
  return (
    <Latar kuat="redup">
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 10, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 8 }}>
        <Tekan onPress={() => { bukaMenu('profil'); }} skala={0.97} accessibilityLabel="Profil" gaya={g.akun}>
          <AvatarKepala ukuran={46} onPress={() => { bukaMenu('profil'); }} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={g.akunNama} numberOfLines={1}>{sesi === null ? 'Belum tersambung' : nama !== '' ? nama : sesi.jenis === 'clerk' ? 'Akun Google' : 'Akun Telegram'}</Text>
            <Text style={g.akunKet} numberOfLines={1}>
              {status === 'plus' ? 'AnalisMarket+ aktif' : status === 'gratis' ? 'Paket gratis' : '—'} · {sesi?.jenis === 'clerk' ? 'Google' : 'Telegram'}
            </Text>
          </View>
          <Text style={g.panah}>›</Text>
        </Tekan>

        <Lbl gaya={{ marginTop: 8 }}>Baca</Lbl>
        <Menu>
          <Butir ikon="kalender" nama="Kalender berita" ket="30 hari" onPress={() => { bukaMenu('kalender'); }} pertama />
          <Butir ikon="buku" nama="Istilah" ket={`${String(ISTILAH.length)} istilah`} onPress={() => { bukaMenu('belajar'); }} />
        </Menu>

        <Lbl gaya={{ marginTop: 8 }}>Akun</Lbl>
        <Menu>
          <Butir ikon="profil" nama="Profil"
            ket={sesi === null ? 'belum tersambung' : status === 'plus' ? 'AM+' : nama !== '' ? nama : 'tersambung'}
            ketEmas={status === 'plus'} onPress={() => { bukaMenu('profil'); }} pertama />
          <Butir ikon="mata" nama="Pantauan" ket={sesi === null ? 'masuk dulu' : 'aktif'} onPress={() => { bukaMenu('pantauan'); }} />
          <Butir ikon="gir" nama="Pengaturan" ket={`${setelan.tf.toLowerCase()} · ${setelan.pasar}`} ketMono onPress={() => { bukaMenu('pengaturan'); }} />
        </Menu>

        <Lbl gaya={{ marginTop: 8 }}>Dokumen</Lbl>
        <Menu>
          <Butir ikon="dokumen" nama="Syarat & Ketentuan" onPress={() => { bukaDokumen('syarat'); }} pertama />
          <Butir ikon="perisai" nama="Kebijakan Privasi" onPress={() => { bukaDokumen('privasi'); }} />
          <Butir ikon="info" nama="Tentang AnalisMarket" ket={capBuild()} ketMono onPress={() => { bukaMenu('tentang'); }} />
        </Menu>

        {/* Kartu merek SETINGGI ISINYA (audit 20 Sep). Baris umur data cuma
            tampil kalau ada angkanya; tiga garis "—" terbaca sebagai rusak. */}
        <Blok gaya={{ marginTop: 8 }}>
          <Merek sub={`${capBuild()} · Binance & Twelve Data`} />
          {(umur?.harga ?? umur?.lilin ?? umur?.kalender ?? null) !== null && (
            <>
              <Lbl gaya={{ marginTop: 12 }}>Data terakhir masuk</Lbl>
              <View style={g.umur}>
                <View style={g.umurSel}><Lbl polos>Harga</Lbl><Nil>{jam(umur?.harga ?? null)}</Nil></View>
                <View style={g.umurSel}><Lbl polos>Lilin</Lbl><Nil>{jam(umur?.lilin ?? null)}</Nil></View>
                <View style={g.umurSel}><Lbl polos>Kalender</Lbl><Nil>{jam(umur?.kalender ?? null)}</Nil></View>
              </View>
            </>
          )}
        </Blok>

        <View style={{ flex: 1 }} />
        <Mikro>Analisa teknikal otomatis. Bukan nasihat investasi.</Mikro>
      </ScrollView>
    </Latar>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  akun: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22,
    backgroundColor: W.amberLatar, borderWidth: 1, borderColor: W.amberTepi, borderTopColor: 'rgba(240,191,107,0.6)',
  },
  akunNama: { fontSize: 16, fontWeight: '600', color: W.teksKuat },
  akunKet: { fontSize: 12, color: W.teksRedup, marginTop: 2 },
  panah: { fontSize: 20, color: W.teksSamar, marginTop: -2 },
  umur: { flexDirection: 'row', gap: 8, marginTop: 8 },
  umurSel: { flex: 1, padding: 10, borderRadius: R.sedang + 2, backgroundColor: W.isiSamar, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, gap: 2 },
}));
