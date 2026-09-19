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
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ambilBacaan, ambilJadwal, syaratWajib, type Mesin, type Rilis } from '../data/api';
import { jamWib, tanggalWib } from '../data/tampil';
import { useHeaderHeight } from '@react-navigation/elements';
import { useSisaBilah } from '../gaya/jarak';
import { Blok, Butir, Chip, Lbl, Menu, Mikro, Nil, Rangka, Tombol } from '../komponen/mockup';
import { W, H, R, TALANG } from '../gaya/token';
import type { Setelan } from '../data/simpan';

type Props = { setelan: Setelan; bukaSambung: () => void; bukaPengaturan: () => void; bukaPantauan: () => void; buka: (ke: 'PantauanBaru' | 'KabarOtomatis' | 'Kredit' | 'CekBanyak' | 'Berlangganan') => void };

export function LayarProfil({ setelan, bukaSambung, bukaPengaturan, bukaPantauan, buka }: Props) {
  const tinggiKepala = useHeaderHeight();
  const sisaBilah = useSisaBilah();
  return (
    <ScrollView style={g.akar} contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 7 }}>
      <Blok>
        <View style={g.baris}>
          <View style={g.avatar}><Text style={g.avatarHuruf}>?</Text></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={g.nama}>Belum tersambung</Text>
            <Lbl polos>Identitas datang dari bot Telegram</Lbl>
            <View style={{ marginTop: 5, alignSelf: 'flex-start' }}><Chip teks="Gratis" /></View>
          </View>
        </View>
        <View style={g.statistik}>
          <View style={g.sel}><Nil besar>—</Nil><Lbl polos>Analisa dibaca</Lbl></View>
          <View style={g.sel}><Nil besar>—</Nil><Lbl polos>Pantauan aktif</Lbl></View>
          <View style={g.sel}><Nil besar>—</Nil><Lbl polos>Hari beruntun</Lbl></View>
        </View>
        <View style={{ marginTop: 10 }}>
          <Tombol teks="Sambungkan Telegram" onPress={bukaSambung} />
        </View>
      </Blok>

      <Lbl gaya={{ marginTop: 2 }}>Bawaan saat app dibuka</Lbl>
      <Menu>
        <Butir simbol={setelan.pasar} nama="Pasar" ket={setelan.pasar} ketMono onPress={bukaPengaturan} pertama />
        <Butir ikon="kalender" nama="Timeframe" ket={setelan.tf.toLowerCase()} ketMono onPress={bukaPengaturan} />
        <Butir ikon="analisis" nama="Mesin" ket={setelan.mesin === '' ? 'pertama' : setelan.mesin} ketMono onPress={bukaPengaturan} />
      </Menu>

      <Lbl gaya={{ marginTop: 2 }}>Pantauan</Lbl>
      <Menu>
        <Butir ikon="kabar" nama="Pantauan aktif" ket="butuh Telegram" onPress={bukaPantauan} pertama />
        <Butir ikon="kabar" nama="Pantauan baru" ket="formulir" onPress={() => { buka('PantauanBaru'); }} />
        <Butir ikon="kalender" nama="Kabar otomatis & jam sunyi" ket="butuh Telegram" onPress={() => { buka('KabarOtomatis'); }} />
      </Menu>

      <Lbl gaya={{ marginTop: 2 }}>AnalisMarket+</Lbl>
      <Menu>
        <Butir ikon="plus" nama="Kredit & kuota" ket="butuh Telegram" onPress={() => { buka('Kredit'); }} pertama />
        <Butir ikon="pasar" nama="Cek banyak pasar" ket="butuh Telegram" onPress={() => { buka('CekBanyak'); }} />
        <Butir ikon="plus" nama="Kelola langganan" ket="lewat web" ketEmas onPress={() => { buka('Berlangganan'); }} />
      </Menu>

      <View style={{ flex: 1 }} />
      <Mikro>Setelan bawaan tersimpan di perangkat ini. Yang lain menunggu sambungan Telegram.</Mikro>
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
export function LayarKabar({ bukaSambung, setelan, bukaChart }: { bukaSambung: () => void; setelan: Setelan; bukaChart: () => void }) {
  const tinggiKepala = useHeaderHeight();
  const sisaBilah = useSisaBilah();
  const [saring, setSaring] = useState<'semua' | 'berita'>('semua');
  const [rilis, setRilis] = useState<Rilis[] | null>(null);
  const [mesin, setMesin] = useState<Mesin[] | null>(null);
  useEffect(() => {
    /* Status lima mesin untuk pasar bawaan: kabar yang TIDAK butuh akun,
       dan bentuknya persis butir kabar — "SOLUSDT h1 · snr — Pantau 5/8". */
    void ambilBacaan(setelan.pasar, setelan.tf).then((b) => { setMesin(b.ok ? b.isi.mesin : []); });
    void ambilJadwal(30).then((j) => {
      if (!j.ok) { setRilis([]); return; }
      const urut = [...j.isi.rilis].sort((a, b) => (a.dampak === b.dampak ? a.waktu - b.waktu : a.dampak === 'tinggi' ? -1 : 1));
      setRilis(urut.slice(0, 20));
    });
  }, []);
  const kini = Date.now() / 1000;
  return (
    <ScrollView style={g.akar} contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 9, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 7 }}>
      <View style={g.chips}>
        <Chip teks="Semua" on={saring === 'semua'} onPress={() => { setSaring('semua'); }} />
        <Chip teks="Setup" onPress={bukaSambung} /><Chip teks="Pantauan" onPress={bukaSambung} />
        <Chip teks="Berita" on={saring === 'berita'} onPress={() => { setSaring('berita'); }} />
      </View>

      {saring === 'semua' && (
        <Blok emas rapat gaya={{ paddingHorizontal: 10 }}>
          <View style={[g.baris, { gap: 8 }]}>
            <View style={{ flex: 1 }}>
              <Text style={g.nama}>Setup & pantauan menunggu Telegram</Text>
              <Lbl polos>Tiga pantauan pertama gratis. Sambungkan, dan kabarnya masuk ke sini.</Lbl>
            </View>
            <Chip teks="Sambungkan" emas onPress={bukaSambung} />
          </View>
        </Blok>
      )}

      {saring === 'semua' && (
        <Blok>
          <View style={[g.baris, { justifyContent: 'space-between' }]}>
            <Lbl>Bacaan terakhir · {setelan.pasar} {setelan.tf.toLowerCase()}</Lbl>
            <Chip teks="buka chart" onPress={bukaChart} />
          </View>
          {mesin === null && [0, 1, 2].map((i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, paddingVertical: 10 }}>
              <Rangka lebar={6} tinggi={6} gaya={{ borderRadius: 3, marginTop: 4 }} /><Rangka lebar="60%" tinggi={10} />
            </View>
          ))}
          {mesin?.map((m, i) => {
            const w = syaratWajib(m); const lolos = w.filter((c) => c.lolos).length;
            const setup = m.status.toUpperCase() === 'SETUP';
            return (
              <View key={m.mesin} style={[g.kabarItem, i > 0 && g.garis]}>
                <View style={[g.titik, !setup && g.titikDibaca]} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={g.kabarJudul} numberOfLines={1}>{setelan.pasar} {setelan.tf.toLowerCase()} · {m.mesin}</Text>
                  <Text style={g.kabarIsi} numberOfLines={2}>{m.keputusan.label}. {m.status.charAt(0)}{m.status.slice(1).toLowerCase()} {lolos} dari {w.length} syarat wajib.</Text>
                </View>
              </View>
            );
          })}
        </Blok>
      )}

      <Blok gaya={{ flex: 1 }}>
        <View style={[g.baris, { justifyContent: 'space-between' }]}>
          <Lbl>Berita · 30 hari ke depan</Lbl>
          <Lbl polos>WIB</Lbl>
        </View>
        {rilis === null && [0, 1, 2, 3].map((i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8, paddingVertical: 10 }}>
            <Rangka lebar={6} tinggi={6} gaya={{ borderRadius: 3, marginTop: 4 }} /><Rangka lebar="70%" tinggi={10} />
          </View>
        ))}
        {rilis !== null && rilis.length === 0 && (
          <Text style={g.kosongKet}>Tidak ada rilis dalam 30 hari ke depan.</Text>
        )}
        {rilis?.map((r, i) => (
          <View key={`${String(r.waktu)}${r.kode}`} style={[g.kabarItem, i > 0 && g.garis]}>
            <View style={[g.titik, (r.waktu < kini || r.dampak !== 'tinggi') && g.titikDibaca]} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={g.kabarJudul} numberOfLines={1}>Kalender · {r.kode} · dampak {r.dampak}</Text>
              <Text style={g.kabarIsi} numberOfLines={2}>{r.acara}. Emas dan forex sering melebar di sekitarnya.</Text>
              <Text style={g.kabarWaktu}>{tanggalWib(r.waktu)} {jamWib(r.waktu)}</Text>
            </View>
          </View>
        ))}
      </Blok>
    </ScrollView>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  baris: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: W.kartuTerang, borderWidth: 1, borderColor: W.garis },
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
});
