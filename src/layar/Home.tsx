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
import { useHeaderHeight } from '@react-navigation/elements';
import { useSisaBilah } from '../gaya/jarak';
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

/** Satu sel pita ringkas. Label 9/400 samar, nilainya 19/700 — tidak pernah terbalik. */
function AngkaPita({ label, nilai, warna }: { label: string; nilai: string; warna?: string }) {
  return (
    <View style={g.pitaSel}>
      <Text style={g.pitaLabel}>{label}</Text>
      <Text style={[g.pitaNilai, warna !== undefined && { color: warna }]}>{nilai}</Text>
    </View>
  );
}

export function LayarHome({ setelan, bukaChart, bukaPasar, bukaMenu }: Props) {
  const tinggiKepala = useHeaderHeight();
  const sisaBilah = useSisaBilah();
  const [pasar, setPasar] = useState<Pasar | null>(null);
  const [teratas, setTeratas] = useState<ReadonlyArray<Pasar>>([]);
  const [ringkas, setRingkas] = useState<{ setup: number; pantau: number; mesin: number } | null>(null);
  const [mesin, setMesin] = useState<Mesin | null>(null);
  const [harga, setHarga] = useState<number | null>(null);
  const [siap, setSiap] = useState(false);
  const [menyegarkan, setMenyegarkan] = useState(false);

  const muat = useCallback(async (segarkan = false): Promise<void> => {
    const j = await ambilPasar(segarkan);
    if (!j.ok) { setSiap(true); return; }
    const p = j.isi.pasar.find((x) => x.simbol === setelan.pasar) ?? j.isi.pasar[0] ?? null;
    setPasar(p);
    /* Daftar yang bergerak: urut volume 24 jam menurun, pasar terpilih
       dipatok di atas — aturan yang sama dengan web. Diambil dari muatan
       yang SAMA, jadi nol permintaan tambahan. */
    setTeratas(
      [...j.isi.pasar]
        .filter((x) => x.simbol !== p?.simbol)
        .sort((a, b2) => (b2.volume24hUsd ?? 0) - (a.volume24hUsd ?? 0))
        .slice(0, 7),
    );
    if (p === null) { setSiap(true); return; }
    const punya = p.timeframes.map((t) => t.toLowerCase());
    const tf = punya.includes(setelan.tf) ? setelan.tf : (punya[0] ?? 'h1');
    const b = await ambilBacaan(p.simbol, tf, segarkan);
    if (b.ok) {
      setHarga(b.isi.harga);
      setMesin(b.isi.mesin.find((m) => m.mesin === setelan.mesin) ?? b.isi.mesin[0] ?? null);
      /* Ringkasan lima mesin — pertanyaan pertama tiap pagi adalah "ada yang
         perlu dilihat atau tidak", dan sampai sekarang Home tidak pernah
         menjawabnya. */
      const st = b.isi.mesin.filter((m) => m.status.toUpperCase() === 'SETUP').length;
      const pt = b.isi.mesin.filter((m) => m.status.toUpperCase() === 'PANTAU').length;
      setRingkas({ setup: st, pantau: pt, mesin: b.isi.mesin.length });
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
      contentContainerStyle={{ paddingTop: tinggiKepala + J.x3, paddingBottom: sisaBilah }}
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

      {/* PITA RINGKAS — empat angka yang menjawab "ada yang perlu dilihat
          atau tidak". Sampai sekarang Home tidak pernah menjawabnya, dan
          ruang ini kosong. */}
      {ringkas !== null && (
        <View style={g.pita}>
          <AngkaPita label="Setup" nilai={String(ringkas.setup)} warna={ringkas.setup > 0 ? W.naik : undefined} />
          <AngkaPita label="Pantau" nilai={String(ringkas.pantau)} />
          <AngkaPita label="Mesin" nilai={String(ringkas.mesin)} />
          <AngkaPita label="Pasar" nilai={String(teratas.length + 1)} />
        </View>
      )}

      <Pressable onPress={bukaPasar} style={g.tombolPasar}>
        <Ikon nama="pasar" warna={W.teksKuat} ukuran={18} />
        <Text style={g.tombolPasarTeks}>Lihat semua pasar</Text>
      </Pressable>

      {/* YANG BERGERAK — urut volume 24 jam. Daftar ini yang membuat isi
          halaman benar-benar lewat di bawah bilah tab, dan itu satu-satunya
          cara kacanya punya bahan untuk dikaburkan. */}
      {teratas.length > 0 && (
        <Kartu judul="Yang bergerak">
          {teratas.map((x, i) => (
            <Pressable
              key={x.simbol}
              onPress={() => { bukaChart(x); }}
              style={[g.barisPasar, i > 0 && g.menuGaris]}
            >
              <View style={g.pasarNama}>
                <Text style={g.pasarSimbol} numberOfLines={1}>{x.simbol}</Text>
                <Text style={g.pasarLabel} numberOfLines={1}>{x.label}</Text>
              </View>
              <View style={g.pasarKanan}>
                <Text style={g.pasarHarga}>{angka(x.harga, x.desimal)}</Text>
                <Text
                  style={[
                    g.pasarUbah,
                    { color: x.ubah24hPersen === null ? W.teksSamar : x.ubah24hPersen > 0 ? W.naik : x.ubah24hPersen < 0 ? W.turun : W.teksSamar },
                  ]}
                >
                  {ubah(x.ubah24hPersen)}
                </Text>
              </View>
            </Pressable>
          ))}
        </Kartu>
      )}

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
  pita: {
    flexDirection: 'row', marginHorizontal: TALANG, marginBottom: J.x2,
    borderRadius: R.kartu, borderWidth: 1, borderColor: W.garis,
    backgroundColor: W.kartu, paddingVertical: J.x2, paddingHorizontal: J.x3,
  },
  pitaSel: { flex: 1 },
  pitaLabel: { fontSize: H.label, color: W.teksSamar, letterSpacing: 1.1, textTransform: 'uppercase' },
  pitaNilai: { fontSize: H.harga, fontWeight: '700', color: W.teksKuat, marginTop: 2, ...ANGKA },
  barisPasar: { flexDirection: 'row', alignItems: 'center', gap: J.x3, minHeight: SENTUH },
  pasarNama: { flex: 1, minWidth: 0 },
  pasarSimbol: { fontSize: H.nilai, fontWeight: '500', color: W.teksKuat },
  pasarLabel: { fontSize: H.label, color: W.teksSamar },
  pasarKanan: { alignItems: 'flex-end' },
  pasarHarga: { fontSize: H.nilai, color: W.teksKuat, ...ANGKA },
  pasarUbah: { fontSize: H.label, ...ANGKA },
  menu: { flexDirection: 'row', alignItems: 'center', gap: J.x3, minHeight: SENTUH },
  menuGaris: { borderTopWidth: 1, borderTopColor: W.garisSamar },
  menuNama: { fontSize: H.nilai, color: W.teksKuat },
  menuKet: { fontSize: H.label, color: W.teksSamar },
  kaki: { fontSize: H.label, color: W.teksSamar, paddingHorizontal: TALANG, paddingVertical: J.x4, lineHeight: 14 },
});
