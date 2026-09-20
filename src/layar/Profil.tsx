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
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ambilBacaan, ambilJadwal, syaratWajib, type Mesin, type Rilis } from '../data/api';
import { ambilRingkas, hapusAkun, type Ringkas } from '../data/saya';
import { useMuat, type Hasil } from '../data/muat';
import { hapusSesi } from '../data/sesi';
import { useSesi } from './Akun';
import { jamWib, tanggalWib } from '../data/tampil';
import { useSisaBilah, useTinggiKepala } from '../gaya/jarak';
import { Blok, Butir, Chip, Kosong, Lbl, Menu, Mikro, Nil, PitaBasi, Rangka, Tombol } from '../komponen/mockup';
import { W, H, R, TALANG } from '../gaya/token';
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
  const konfirmasiHapus = (): void => {
    const pesan = 'Akun, sambungan, pantauan, kabar, perangkat, dan setelan dihapus seketika dan tidak bisa dikembalikan. Catatan pembayaran disimpan tanpa identitas selama diwajibkan hukum.';
    if (Platform.OS === 'web') {
      const tanya = (globalThis as { confirm?: (m: string) => boolean }).confirm;
      if (tanya === undefined || tanya(`Hapus akun?\n\n${pesan}`)) void jalankanHapus();
      return;
    }
    Alert.alert('Hapus akun?', pesan, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus akun', style: 'destructive', onPress: () => { void jalankanHapus(); } },
    ]);
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
  const plus = r?.langganan === 'plus';
  const angka = (n: number | undefined): string => (n === undefined ? '—' : String(n));
  return (
    <ScrollView style={g.akar} contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 7 }}>
      {/* Angka akun tidak terbaca — sebabnya disebut, bukan disamarkan jadi "—". */}
      {sesi !== null && sebab !== null && <PitaBasi kalimat={sebab} />}
      {/* Masuk lewat Google tapi belum ditautkan ke bot: pantauan, kabar, dan
          kabar hidup di akun Telegram. Ini bukan galat, ini langkah berikutnya. */}
      {sesi !== null && r !== null && !r.telegramTersambung && (
        <Blok emas rapat gaya={{ paddingHorizontal: 10 }}>
          <View style={[g.baris, { gap: 8 }]}>
            <View style={{ flex: 1 }}>
              <Text style={g.nama}>Tautkan Telegram (opsional)</Text>
              <Lbl polos>Kabar tetap jalan lewat HP ini. Telegram jadi cadangan saat HP tidak terdaftar.</Lbl>
            </View>
            <Chip teks="Sambungkan" emas onPress={bukaSambung} />
          </View>
        </Blok>
      )}
      <Blok>
        <View style={g.baris}>
          <View style={[g.avatar, sesi !== null && g.avatarAda]}>
            <Text style={[g.avatarHuruf, sesi !== null && { color: '#1A1508' }]}>
              {/* BUKAN '?'. Akun Telegram boleh tidak punya nama tampilan, dan
                  itu keadaan yang sah — bukan sesuatu yang app-nya tidak tahu.
                  Tanda tanya membaca seolah ada yang rusak; lambang merek
                  membaca sebagai "kamu, di app ini". */}
              {nama === null ? 'A' : nama.trim().charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={g.nama} numberOfLines={1}>{sesi === null ? 'Belum tersambung' : nama ?? 'Akun Telegram'}</Text>
            <Lbl polos>{sesi === null ? 'Identitas datang dari bot Telegram' : sesi.jenis === 'clerk' ? 'Masuk dengan Google' : 'Tersambung lewat Telegram'}</Lbl>
            <View style={{ marginTop: 5, alignSelf: 'flex-start' }}>
              <Chip teks={plus ? 'AnalisMarket+ aktif' : 'Gratis'} emas={plus} lencana />
            </View>
          </View>
        </View>
        <View style={g.statistik}>
          <View style={g.sel}><Nil besar>{setelan.tf.toLowerCase()}</Nil><Lbl polos>Timeframe</Lbl></View>
          <View style={g.sel}>
            <Nil besar>{r === null ? '—' : `${String(r.pantauanAktif)}/${String(r.maksPantauan)}`}</Nil>
            <Lbl polos>Pantauan</Lbl>
          </View>
          {/* Akun gratis: kata, bukan garis. "— Hari AM+" terbaca sebagai angka yang gagal dimuat (audit 20 Sep). */}
          <View style={g.sel}><Nil besar>{plus ? angka(r?.sisaHariPlus) : 'Gratis'}</Nil><Lbl polos>{plus ? 'Hari AM+' : 'Paket'}</Lbl></View>
        </View>
        {/* Mockup: tombol sambung hanya saat BELUM masuk; putus sambungan
            adalah baris di bagian Akun, bukan tombol besar di kartu. */}
        {sesi === null && (
          <View style={{ marginTop: 10 }}>
            <Tombol teks="Sambungkan Telegram" onPress={bukaSambung} />
          </View>
        )}
      </Blok>

      <Lbl gaya={{ marginTop: 2 }}>Bawaan saat app dibuka</Lbl>
      <Menu>
        <Butir simbol={setelan.pasar} nama="Pasar" ket={setelan.pasar} ketMono onPress={bukaPengaturan} pertama />
        <Butir ikon="kalender" nama="Timeframe" ket={setelan.tf.toLowerCase()} ketMono onPress={bukaPengaturan} />
        <Butir ikon="analisis" nama="Mesin" ket={setelan.mesin === '' ? 'otomatis' : setelan.mesin} ketMono onPress={bukaPengaturan} />
      </Menu>

      <Lbl gaya={{ marginTop: 2 }}>Pantauan</Lbl>
      <Menu>
        <Butir ikon="kabar" nama="Pantauan aktif" ket={r === null ? '—' : `${String(r.pantauanAktif)} aktif`} onPress={bukaPantauan} pertama />
        <Butir ikon="kabar" nama="Pantauan baru" ket="formulir" onPress={() => { buka('PantauanBaru'); }} />
        <Butir ikon="kalender" nama="Kabar otomatis & jam sunyi" ket={sesi === null ? 'masuk dulu' : plus ? 'aktif' : 'butuh AM+'} onPress={() => { buka('KabarOtomatis'); }} />
      </Menu>

      <Lbl gaya={{ marginTop: 2 }}>Akun</Lbl>
      <Menu>
        <Butir ikon="plus" nama="Kelola langganan" ket={plus ? "aktif" : "lewat bot"} ketEmas onPress={() => { buka('Berlangganan'); }} pertama />
        <Butir ikon="pasar" nama="Cek banyak pasar" ket={sesi === null ? 'masuk dulu' : plus ? 'siap' : 'butuh AM+'} onPress={() => { buka('CekBanyak'); }} />
        {sesi !== null && (
          <Butir ikon="lainnya" nama={sesi.jenis === 'clerk' ? 'Keluar dari akun Google' : 'Putuskan sambungan Telegram'}
            onPress={() => { void hapusSesi(); }} />
        )}
        {sesi !== null && (
          <Butir ikon="lainnya" nama={sibukHapus ? 'Menghapus akun…' : 'Hapus akun'} ket="permanen"
            onPress={sibukHapus ? undefined : konfirmasiHapus} />
        )}
      </Menu>
      {galatHapus !== '' && <Mikro>{galatHapus}</Mikro>}

      <View style={{ flex: 1 }} />
      <Mikro>{sesi === null
        ? 'Setelan bawaan tersimpan di perangkat ini. Yang lain menunggu kamu masuk.'
        : 'Setelan bawaan tersimpan di perangkat ini; pantauan dan langganan ikut akunmu.'}</Mikro>
    </ScrollView>
  );
}

/**
 * KABAR — mockup 05.
 *
 * Yang butuh akun (setup, pantauan) belum bisa; yang TIDAK butuh akun —
 * berita dampak tinggi dari kalender — bisa, dan mockup 05 memang memuatnya
 * di saringan "Berita". Jadi layar ini terisi data sungguhan, bukan kosong,
 * dan satu blok di atas menyebut apa yang masih menunggu Telegram.
 */

const g = gayaTema((W) => StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  baris: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: W.kartuTerang, borderWidth: 1, borderColor: W.garis },
  avatarAda: { backgroundColor: W.plus, borderColor: 'transparent' },
  avatarHuruf: { fontSize: 15, fontWeight: '700', color: W.teksSamar },
  nama: { fontSize: H.pasar, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.2 },
  statistik: { flexDirection: 'row', gap: 6, marginTop: 9 },
  sel: { flex: 1, backgroundColor: W.kartuTerang, borderWidth: 1, borderColor: W.garis, borderRadius: R.besar, padding: 7 },
  chips: { flexDirection: 'row', gap: 4 },
  garis: { borderTopWidth: 1, borderTopColor: W.garisSamar },
  kabarItem: { flexDirection: 'row', gap: 8, paddingVertical: 8 },
  titik: { width: 6, height: 6, borderRadius: 3, backgroundColor: W.plus, marginTop: 4 },
  titikDibaca: { backgroundColor: W.garis },
  kabarJudul: { fontSize: H.nilai, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.1 },
  kabarIsi: { fontSize: H.alat, color: W.teksRedup, lineHeight: 14, marginTop: 2 },
  kabarWaktu: { fontSize: H.label, color: W.teksSamar, marginTop: 2, fontVariant: ['tabular-nums'] },
  kosongKet: { fontSize: H.alat, color: W.teksSamar, marginTop: 8 },
}));
