/**
 * PROFIL (mockup 09) dan KABAR (mockup 05) — dua layar yang isinya hidup di
 * `/api/saya/*`, yang 13 dari 15 fungsinya menolak tanpa identitas Telegram.
 *
 * Bentuknya BENTUK mockup — avatar, statistik, kelompok menu; saringan dan
 * daftar — tapi diisi keadaan jujurnya: belum tersambung. Angka karangan di
 * tempat angka sungguhan adalah kebohongan yang terlihat seperti data, jadi
 * yang belum ada dicetak "—", bukan nol, dan setiap jalan buntu menunjuk ke
 * satu pekerjaan yang sama: Sambungkan Telegram.
 */
import { useCallback, useState } from 'react';
import { gayaTema } from '../gaya/tema';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ambilRingkas, hapusAkun, keluarAkun, type Ringkas } from '../data/saya';
import { tokenPerangkat } from '../data/push';
import { TOKO_PLAY } from '../data/amplus';
import { useMuat, type Hasil } from '../data/muat';
import { hapusSesi } from '../data/sesi';
import { useSesi } from './Akun';
import { labelStatus, useStatusPlus } from '../data/statusPlus';
import { useSisaBilah, useTinggiKepala } from '../gaya/jarak';
import { Blok, Butir, Chip, Lbl, Menu, Mikro, Nil, PitaBasi, Tombol } from '../komponen/mockup';
import { W, R, TALANG } from '../gaya/token';
import { Latar } from '../komponen/Latar';
import { Ikon } from '../komponen/Ikon';
import type { Setelan } from '../data/simpan';

type Props = { setelan: Setelan; bukaSambung: () => void; bukaPengaturan: () => void; bukaPantauan: () => void; buka: (ke: 'PantauanBaru' | 'KabarOtomatis' | 'CekBanyak' | 'Berlangganan') => void };

export function LayarProfil({ setelan, bukaSambung, bukaPengaturan, bukaPantauan, buka }: Props) {
  /* HAPUS AKUN — syarat toko (Play & App Store) untuk app yang punya akun.
     Dua langkah: konfirmasi sistem, lalu permintaan ke server. Sesudah
     berhasil sesi dibuang dan gerbang kembali ke layar masuk. */
  const [sibukHapus, setSibukHapus] = useState(false);
  const [galatHapus, setGalatHapus] = useState('');
  const jalankanHapus = async (): Promise<void> => {
    setSibukHapus(true); setGalatHapus('');
    const j = await hapusAkun();
    if (!j.ok) { setGalatHapus(j.kalimat); setSibukHapus(false); return; }
    await hapusSesi();
  };
  /* Konfirmasi di dialog KACA milik app, bukan Alert sistem: Alert Android
     berwarna terang di tengah layar obsidian, dan dialog yang paling serius di
     app ini justru terlihat seperti bagian dari app lain. Kalimatnya sama. */
  const [tanyaHapus, setTanyaHapus] = useState(false);
  /* KELUAR mencabut HP ini sebagai penerima kabar dulu (`keluarAkun`), selagi
     sesinya masih sah — tanpa itu kabar akun ini terus masuk ke HP yang sudah
     keluar. Paling lama 5 detik; sesudah itu keluar tetap jalan. Layar ini
     biasanya hilang begitu sesinya dibuang; kalau sesi mini yang dicabut
     sementara Google tetap masuk, ia bertahan dan sebab gagalnya dicetak. */
  const [sibukKeluar, setSibukKeluar] = useState(false);
  const [galatKeluar, setGalatKeluar] = useState('');
  const keluar = async (): Promise<void> => {
    setSibukKeluar(true); setGalatKeluar('');
    try {
      const h = await keluarAkun(tokenPerangkat);
      if (h.perangkat === 'gagal') setGalatKeluar(`Notifikasi HP ini belum dicabut: ${h.kalimat ?? 'server tidak menjawab'}`);
    } finally { setSibukKeluar(false); }
  };
  const tinggiKepala = useTinggiKepala();
  const sisaBilah = useSisaBilah();
  const sesi = useSesi();
  /* Sesi mati sudah menjawab dirinya sendiri: `saya.ts` menghapus sesinya
     saat 401 dan `umumkan(null)` membalik SELURUH app ke "belum tersambung".
     Yang dulu tidak punya suara adalah kegagalan yang LAIN — jaringan mati
     sementara sesinya masih sah. Dulu layar ini tetap menulis "Tersambung"
     dengan seluruh angkanya "—", dan tidak ada cara tahu kenapa. */
  const muatRingkas = useCallback(async (): Promise<Hasil<Ringkas | null>> => {
    if (sesi === null) return { ok: true, isi: null };
    return ambilRingkas();
  }, [sesi]);
  const { keadaan } = useMuat(muatRingkas, sesi === null ? 'kosong' : 'ada');
  const r = keadaan.fase === 'ada' ? keadaan.isi : null;
  const sebab = keadaan.fase === 'gagal' ? keadaan.kalimat : (keadaan.fase === 'ada' ? keadaan.basi : null);
  const nama = sesi?.akun.nama ?? null;
  /* "Gratis" HANYA kalau server berkata gratis. Dulu `r === null` — masih
     memuat, atau /api/saya gagal — ikut tercetak "Gratis", termasuk untuk
     pelanggan yang masuk lewat Google. Tidak diketahui dicetak "—". */
  const statusSimpan = useStatusPlus();
  const status = r?.langganan ?? statusSimpan;
  const plus = status === 'plus';
  const angka = (n: number | undefined): string => (n === undefined ? '—' : String(n));
  const namaTampil = nama !== null && nama.trim() !== '' ? nama.trim() : null;
  /* BUKAN '?'. Akun Telegram boleh tidak punya nama tampilan, dan itu keadaan
     yang sah — bukan sesuatu yang app-nya tidak tahu. Tanda tanya membaca
     seolah ada yang rusak; huruf merek membaca sebagai "kamu, di app ini". */
  const huruf = namaTampil === null ? 'A' : namaTampil.charAt(0).toUpperCase();
  return (
    <Latar>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 10, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 8 }}>
        {/* Angka akun tidak terbaca — sebabnya disebut, bukan disamarkan jadi "—". */}
        {sesi !== null && sebab !== null && <PitaBasi kalimat={sebab} />}

        <View style={g.hero}>
          <View style={[g.avatar, plus && g.avatarPlus]}>
            <Text style={[g.avatarHuruf, plus && { color: W.utamaTeks }]}>{huruf}</Text>
          </View>
          <Text style={g.nama} numberOfLines={1}>{sesi === null ? 'Belum tersambung' : namaTampil ?? (sesi.jenis === 'clerk' ? 'Akun Google' : 'Akun Telegram')}</Text>
          <Text style={g.sub} numberOfLines={1}>{sesi === null ? 'Identitas datang dari bot Telegram' : sesi.jenis === 'clerk' ? 'Masuk dengan Google' : 'Tersambung lewat Telegram'}</Text>
          <View style={{ marginTop: 10 }}>
            <Chip teks={plus ? 'AnalisMarket+ aktif' : labelStatus(status)} emas={plus} lencana />
          </View>
        </View>

        <View style={g.statistik}>
          <View style={g.sel}><Nil besar>{setelan.tf.toLowerCase()}</Nil><Lbl polos>Timeframe</Lbl></View>
          <View style={g.sel}>
            <Nil besar>{r === null ? '—' : `${String(r.pantauanAktif)}/${String(r.maksPantauan)}`}</Nil>
            <Lbl polos>Pantauan</Lbl>
          </View>
          {/* Akun gratis: kata, bukan garis. "— Hari AM+" terbaca sebagai angka yang gagal dimuat (audit 20 Sep). */}
          <View style={[g.sel, plus && g.selEmas]}>
            <Nil besar warna={plus ? W.plusTerang : undefined}>{plus ? angka(r?.sisaHariPlus) : labelStatus(status)}</Nil>
            <Lbl polos>{plus ? 'Hari AM+' : 'Paket'}</Lbl>
          </View>
        </View>

        {/* Mockup: tombol sambung hanya saat BELUM masuk; putus sambungan
            adalah baris di bagian Akun, bukan tombol besar di kartu. */}
        {sesi === null && <Tombol teks="Sambungkan Telegram" onPress={bukaSambung} />}

        {/* Masuk lewat Google tapi belum ditautkan ke bot: pantauan, kabar, dan
            kabar hidup di akun Telegram. Ini bukan galat, ini langkah berikutnya. */}
        {sesi !== null && r !== null && !r.telegramTersambung && (
          <Blok emas rapat gaya={{ paddingHorizontal: 13 }}>
            <View style={g.baris}>
              <View style={{ flex: 1 }}>
                <Text style={g.tautJudul}>Tautkan Telegram (opsional)</Text>
                <Lbl polos>Kabar tetap jalan lewat HP ini. Telegram jadi cadangan saat HP tidak terdaftar.</Lbl>
              </View>
              <Chip teks="Sambungkan" emas onPress={bukaSambung} />
            </View>
          </Blok>
        )}

        <Lbl gaya={{ marginTop: 6 }}>Bawaan saat app dibuka</Lbl>
        <Menu>
          <Butir simbol={setelan.pasar} nama="Pasar" ket={setelan.pasar} ketMono onPress={bukaPengaturan} pertama />
          <Butir ikon="jam" nama="Timeframe" ket={setelan.tf.toLowerCase()} ketMono onPress={bukaPengaturan} />
          <Butir ikon="analisis" nama="Mesin" ket={setelan.mesin === '' ? 'otomatis' : setelan.mesin} ketMono onPress={bukaPengaturan} />
        </Menu>

        <Lbl gaya={{ marginTop: 6 }}>Pantauan</Lbl>
        <Menu>
          <Butir ikon="mata" nama="Pantauan aktif" ket={r === null ? '—' : `${String(r.pantauanAktif)} aktif`} onPress={bukaPantauan} pertama />
          <Butir ikon="tambah" nama="Pantauan baru" ket="formulir" onPress={() => { buka('PantauanBaru'); }} />
          <Butir ikon="kilat" nama="Kabar otomatis & jam sunyi" ket={sesi === null ? 'masuk dulu' : plus ? 'aktif' : 'butuh AM+'} onPress={() => { buka('KabarOtomatis'); }} />
        </Menu>

        <Lbl gaya={{ marginTop: 6 }}>Akun</Lbl>
        <Menu>
          <Butir ikon="plus" nama="Kelola langganan" ket={status === null ? '—' : plus ? 'aktif' : TOKO_PLAY ? 'belum aktif' : 'lewat bot'} ketEmas onPress={() => { buka('Berlangganan'); }} pertama />
          <Butir ikon="kisi" nama="Cek banyak pasar" ket={sesi === null ? 'masuk dulu' : plus ? 'siap' : 'butuh AM+'} onPress={() => { buka('CekBanyak'); }} />
          {sesi !== null && (
            <Butir ikon="keluar" nama={sibukKeluar ? 'Keluar…' : sesi.jenis === 'clerk' ? 'Keluar dari akun Google' : 'Putuskan sambungan Telegram'}
              onPress={sibukKeluar ? undefined : () => { void keluar(); }} />
          )}
          {sesi !== null && (
            <Butir ikon="hapus" bahaya nama={sibukHapus ? 'Menghapus akun…' : 'Hapus akun'} ket="permanen"
              onPress={sibukHapus ? undefined : () => { setTanyaHapus(true); }} />
          )}
        </Menu>
        {galatHapus !== '' && <Mikro>{galatHapus}</Mikro>}
        {galatKeluar !== '' && <Mikro>{galatKeluar}</Mikro>}

        <View style={{ flex: 1 }} />
        <Mikro>{sesi === null
          ? 'Setelan bawaan tersimpan di perangkat ini. Yang lain menunggu kamu masuk.'
          : 'Setelan bawaan tersimpan di perangkat ini; pantauan dan langganan ikut akunmu.'}</Mikro>
      </ScrollView>

      <Modal visible={tanyaHapus} transparent animationType="fade" statusBarTranslucent onRequestClose={() => { setTanyaHapus(false); }}>
        <View style={g.tirai}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { setTanyaHapus(false); }} accessibilityLabel="Batal" />
          <View style={g.dialog} accessibilityViewIsModal>
            <View style={g.dialogIkon}><Ikon nama="hapus" warna={W.turun} ukuran={22} /></View>
            <Text style={g.dialogJudul}>Hapus akun?</Text>
            <Text style={g.dialogIsi}>{PESAN_HAPUS}</Text>
            {/* Yang IKUT TERHAPUS, dalam angka akun ini — kalimat umum di atas
                terbaca seperti syarat; "4 pantauan" terbaca seperti kehilangan. */}
            {r !== null && (r.pantauanAktif > 0 || plus) && (
              <View style={g.dialogChips}>
                {r.pantauanAktif > 0 && <Chip teks={`${String(r.pantauanAktif)} pantauan`} lencana />}
                {plus && <Chip teks={`AnalisMarket+ (${String(r.sisaHariPlus)} hari)`} emas lencana />}
              </View>
            )}
            <View style={g.dialogTombol}>
              <Tombol teks="Hapus akun" jenis="bahaya" onPress={() => { setTanyaHapus(false); void jalankanHapus(); }} />
              <Tombol teks="Batal" jenis="kedua" onPress={() => { setTanyaHapus(false); }} />
            </View>
          </View>
        </View>
      </Modal>
    </Latar>
  );
}

const PESAN_HAPUS = 'Akun, sambungan, pantauan, kabar, perangkat, dan setelan dihapus seketika dan tidak bisa dikembalikan. Catatan pembayaran disimpan tanpa identitas selama diwajibkan hukum.';

const g = gayaTema((W) => StyleSheet.create({
  hero: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  avatar: {
    width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    backgroundColor: W.kartuTerang, borderWidth: 1.5, borderColor: W.tinta(0.16),
  },
  /* AM+: isian amber + cincin tipis — sama dengan avatar di kepala. */
  avatarPlus: { backgroundColor: '#E9B65C', borderColor: 'rgba(240,191,107,0.85)' },
  avatarHuruf: { fontSize: 30, fontWeight: '800', color: W.teks },
  nama: { fontSize: 21, fontWeight: '700', color: W.teksKuat, letterSpacing: -0.4, maxWidth: '90%' },
  sub: { fontSize: 13, color: W.teksRedup, marginTop: 3 },
  baris: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tautJudul: { fontSize: 14, fontWeight: '600', color: W.teksKuat, marginBottom: 2 },
  statistik: { flexDirection: 'row', gap: 8 },
  sel: {
    flex: 1, minWidth: 0, gap: 3, paddingVertical: 13, paddingHorizontal: 8, borderRadius: R.kartu - 4, alignItems: 'center',
    backgroundColor: W.kacaIsi, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, borderTopColor: W.kacaKilau,
  },
  selEmas: { backgroundColor: W.amberLatar, borderColor: W.amberTepi, borderTopColor: 'rgba(240,191,107,0.62)' },
  /* Tirai dan dialog PADAT — tanpa blur. Dialog paling serius di app tidak
     boleh bergantung pada efek yang boleh gagal diam-diam di Android. */
  tirai: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, backgroundColor: 'rgba(5,4,3,0.72)' },
  dialog: {
    borderRadius: 28, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 18, backgroundColor: W.latar900, alignItems: 'center',
    borderWidth: 1, borderColor: W.kacaTepi, borderTopColor: W.kacaKilau,
  },
  dialogIkon: {
    width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    backgroundColor: W.turunLatar, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.turunTepi,
  },
  dialogJudul: { fontSize: 20, fontWeight: '700', color: W.teksKuat, letterSpacing: -0.3, textAlign: 'center' },
  dialogIsi: { fontSize: 13.5, color: W.teksRedup, lineHeight: 20, marginTop: 8, textAlign: 'center' },
  dialogChips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 14 },
  dialogTombol: { alignSelf: 'stretch', gap: 8, marginTop: 20 },
}));
