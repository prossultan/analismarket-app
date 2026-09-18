/**
 * HOME — pusat, dan satu-satunya layar yang tidak ada padanannya di web.
 *
 * Web tidak punya Home karena terminalnya SATU halaman: chart, bacaan, dan
 * daftar pasar hidup berdampingan di layar yang sama. App terpecah jadi
 * beberapa layar, dan yang terpecah butuh tempat berdiri — kalau tidak, orang
 * mendarat di daftar 131 pasar tanpa tahu apa yang tadi ia tinggalkan.
 *
 * Isinya: apa yang terakhir dibuka, keadaan akun apa adanya, dan pintu ke
 * seluruh menu lain.
 */
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ambilBacaan, ambilPasar, syaratWajib, type Mesin, type Pasar } from '../data/api';
import { angka, ubah } from '../data/tampil';
import { Ikon, type NamaIkon } from '../komponen/Ikon';
import { Kartu, Memuat, Pil } from '../komponen/dasar';
import { W, H, J, R, ANGKA, SENTUH, TALANG } from '../gaya/token';
import type { Setelan } from '../data/simpan';

type Props = {
  setelan: Setelan;
  bukaChart: (p: Pasar) => void;
  bukaPasar: () => void;
  bukaMenu: (k: 'profil' | 'kalender' | 'belajar' | 'kabar' | 'plus') => void;
};

const MENU: ReadonlyArray<{ kunci: 'profil' | 'kalender' | 'belajar' | 'kabar' | 'plus'; nama: string; ikon: NamaIkon; ket: string }> = [
  { kunci: 'plus', nama: 'AnalisMarket+', ikon: 'plus', ket: 'apa isinya' },
  { kunci: 'kalender', nama: 'Kalender berita', ikon: 'kalender', ket: '14 hari ke depan' },
  { kunci: 'belajar', nama: 'Belajar', ikon: 'buku', ket: 'cara baca kartu & istilah' },
  { kunci: 'kabar', nama: 'Kabar', ikon: 'kabar', ket: 'butuh akun' },
  { kunci: 'profil', nama: 'Profil & akun', ikon: 'profil', ket: 'keadaan akun' },
];

export function LayarHome({ setelan, bukaChart, bukaPasar, bukaMenu }: Props) {
  const [pasar, setPasar] = useState<Pasar | null>(null);
  const [mesin, setMesin] = useState<Mesin | null>(null);
  const [harga, setHarga] = useState<number | null>(null);
  const [siap, setSiap] = useState(false);
  const [menyegarkan, setMenyegarkan] = useState(false);

  const muat = useCallback(async (segarkan = false): Promise<void> => {
    const j = await ambilPasar(segarkan);
    if (!j.ok) { setSiap(true); return; }
    const p = j.isi.pasar.find((x) => x.simbol === setelan.pasar) ?? j.isi.pasar[0] ?? null;
    setPasar(p);
    if (p === null) { setSiap(true); return; }
    const punya = p.timeframes.map((t) => t.toLowerCase());
    const tf = punya.includes(setelan.tf) ? setelan.tf : (punya[0] ?? 'h1');
    const b = await ambilBacaan(p.simbol, tf, segarkan);
    if (b.ok) {
      setHarga(b.isi.harga);
      setMesin(b.isi.mesin.find((m) => m.mesin === setelan.mesin) ?? b.isi.mesin[0] ?? null);
    }
    setSiap(true);
  }, [setelan.pasar, setelan.tf, setelan.mesin]);

  useEffect(() => { void muat(); }, [muat]);

  if (!siap) return <Memuat teks="Menyiapkan…" />;

  const wajib = mesin === null ? [] : syaratWajib(mesin);
  const lolos = wajib.filter((c) => c.lolos).length;

  return (
    <ScrollView
      style={g.akar}
      contentContainerStyle={{ paddingVertical: J.x3 }}
      refreshControl={
        <RefreshControl
          refreshing={menyegarkan}
          tintColor={W.teksRedup}
          onRefresh={() => { setMenyegarkan(true); void muat(true).finally(() => { setMenyegarkan(false); }); }}
        />
      }
    >
      {pasar !== null && (
        <Pressable onPress={() => { bukaChart(pasar); }} style={g.kartuPasar}>
          <View style={g.barisAtas}>
            <Text style={g.simbol}>{pasar.simbol}</Text>
            <Text style={g.tag} numberOfLines={1}>{pasar.label}</Text>
            <View style={{ flex: 1 }} />
            <Text style={g.tfKecil}>{setelan.tf.toUpperCase()}</Text>
          </View>
          <View style={g.barisHarga}>
            <Text style={g.harga}>{angka(harga ?? pasar.harga, pasar.desimal)}</Text>
            <Text
              style={[
                g.ubahTeks,
                { color: pasar.ubah24hPersen === null ? W.teksSamar : pasar.ubah24hPersen > 0 ? W.naik : pasar.ubah24hPersen < 0 ? W.turun : W.teksSamar },
              ]}
            >
              {ubah(pasar.ubah24hPersen)}
            </Text>
          </View>
          {mesin !== null && (
            <View style={g.barisStatus}>
              <Text style={g.mesinNama}>{mesin.mesin.toUpperCase()}</Text>
              <Text style={g.keputusan} numberOfLines={1}>{mesin.keputusan.label}</Text>
              <View style={{ flex: 1 }} />
              <Pil teks={`${String(lolos)}/${String(wajib.length)}`} nada={lolos === wajib.length ? 'naik' : 'netral'} />
            </View>
          )}
          <Text style={g.ajak}>Ketuk untuk membuka chart-nya</Text>
        </Pressable>
      )}

      <Pressable onPress={bukaPasar} style={g.tombolPasar}>
        <Ikon nama="pasar" warna={W.teksKuat} ukuran={18} />
        <Text style={g.tombolPasarTeks}>Lihat semua pasar</Text>
      </Pressable>

      <Kartu judul="Menu">
        {MENU.map((m, i) => (
          <Pressable key={m.kunci} onPress={() => { bukaMenu(m.kunci); }} style={[g.menu, i > 0 && g.menuGaris]}>
            <Ikon nama={m.ikon} warna={m.kunci === 'plus' ? W.plus : W.teksRedup} ukuran={18} />
            <Text style={[g.menuNama, m.kunci === 'plus' && { color: W.plus }]}>{m.nama}</Text>
            <View style={{ flex: 1 }} />
            <Text style={g.menuKet}>{m.ket}</Text>
          </Pressable>
        ))}
      </Kartu>

      <Text style={g.kaki}>Alat baca chart, bukan alat prediksi. Bukan ajakan melakukan transaksi.</Text>
    </ScrollView>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  kartuPasar: {
    backgroundColor: W.kartu, borderRadius: R.kartu, borderWidth: 1, borderColor: W.garis,
    padding: TALANG, marginHorizontal: TALANG, marginBottom: J.x3,
  },
  barisAtas: { flexDirection: 'row', alignItems: 'baseline', gap: J.x2 },
  simbol: { fontSize: H.pasar, fontWeight: '700', color: W.teksKuat },
  tag: { fontSize: H.label, color: W.teksSamar, flexShrink: 1 },
  tfKecil: { fontSize: H.label, color: W.teksSamar, letterSpacing: 1.1 },
  barisHarga: { flexDirection: 'row', alignItems: 'baseline', gap: J.x2, marginTop: J.x2 },
  harga: { fontSize: H.harga, fontWeight: '700', color: W.teksKuat, ...ANGKA },
  ubahTeks: { fontSize: H.label, ...ANGKA },
  barisStatus: { flexDirection: 'row', alignItems: 'center', gap: J.x2, marginTop: J.x3 },
  mesinNama: { fontSize: H.label, color: W.teksSamar, letterSpacing: 1.1 },
  keputusan: { fontSize: H.nilai, color: W.teks, flexShrink: 1 },
  ajak: { fontSize: H.label, color: W.teksSamar, marginTop: J.x3 },
  tombolPasar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: J.x2,
    marginHorizontal: TALANG, marginBottom: J.x3, minHeight: SENTUH,
    borderRadius: R.besar, borderWidth: 1, borderColor: W.garis, backgroundColor: W.kartuTerang,
  },
  tombolPasarTeks: { fontSize: H.nilai, color: W.teksKuat, fontWeight: '500' },
  menu: { flexDirection: 'row', alignItems: 'center', gap: J.x3, minHeight: SENTUH },
  menuGaris: { borderTopWidth: 1, borderTopColor: W.garisSamar },
  menuNama: { fontSize: H.nilai, color: W.teksKuat },
  menuKet: { fontSize: H.label, color: W.teksSamar },
  kaki: { fontSize: H.label, color: W.teksSamar, paddingHorizontal: TALANG, paddingVertical: J.x4, lineHeight: 14 },
});
