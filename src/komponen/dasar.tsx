/**
 * Komponen kecil yang dipakai berulang. Satu tempat, supaya kartu di halaman
 * Bacaan dan kartu di halaman Banding tidak perlahan-lahan jadi dua bentuk.
 */
import type { ReactNode } from 'react';
import { gayaTema } from '../gaya/tema';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BIAYA_WAJAR_PERSEN, biayaLebar, biayaPersen } from '../data/tampil';
import { W, H, J, R, ANGKA, gayaLabel } from '../gaya/token';

export function Kartu({ judul, kanan, children }: { judul?: string; kanan?: ReactNode; children: ReactNode }) {
  return (
    <View style={g.kartu}>
      {(judul !== undefined || kanan !== undefined) && (
        <View style={g.kepala}>
          {judul !== undefined && <Text style={g.kepalaTeks}>{judul}</Text>}
          <View style={{ flex: 1 }} />
          {kanan}
        </View>
      )}
      {children}
    </View>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={gayaLabel}>{children}</Text>;
}

/** Nilai: 13px/500, selalu tabular supaya tidak bergeser saat digitnya berubah. */
export function Nilai({ children, warna }: { children: ReactNode; warna?: string }) {
  return <Text style={[g.nilai, warna === undefined ? null : { color: warna }]}>{children}</Text>;
}

export type NadaPil = 'netral' | 'naik' | 'turun' | 'plus';
export function Pil({ teks, nada = 'netral' }: { teks: string; nada?: NadaPil }) {
  const warna = nada === 'naik' ? W.naik : nada === 'turun' ? W.turun : nada === 'plus' ? W.plus : W.teksRedup;
  const latar = nada === 'plus' ? W.plusRedup : W.isiSamar;
  return (
    <View style={[g.pil, { backgroundColor: latar }]}>
      <Text style={[g.pilTeks, { color: warna }]}>{teks}</Text>
    </View>
  );
}

/**
 * Baris label-di-kiri nilai-di-kanan. Bentuk ini muncul belasan kali; ditulis
 * sekali supaya jaraknya tidak menyimpang antar halaman.
 */
export function Baris({ kiri, kanan, warnaKanan }: { kiri: string; kanan: string; warnaKanan?: string }) {
  return (
    <View style={g.baris}>
      <Text style={g.barisKiri}>{kiri}</Text>
      <Text style={[g.barisKanan, warnaKanan === undefined ? null : { color: warnaKanan }]}>{kanan}</Text>
    </View>
  );
}

export function Pisah() { return <View style={g.pisah} />; }

/**
 * Keadaan kosong SELALU menyebut sebabnya.
 *
 * Layar kosong tanpa kalimat membuat orang menebak apakah ia salah menekan
 * atau botnya mati — dan dua-duanya membuat ia menekan ulang, yang membakar
 * jatah laju yang justru sedang menipis.
 */
export function Kosong({ judul, sebab, aksi, labelAksi }: { judul: string; sebab?: string; aksi?: () => void; labelAksi?: string }) {
  return (
    <View style={g.kosong}>
      <Text style={g.kosongJudul}>{judul}</Text>
      {sebab !== undefined && <Text style={g.kosongSebab}>{sebab}</Text>}
      {aksi !== undefined && (
        <Pressable onPress={aksi} style={g.tombol}>
          <Text style={g.tombolTeks}>{labelAksi ?? 'Coba lagi'}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function Memuat({ teks }: { teks: string }) {
  return (
    <View style={g.kosong}>
      <ActivityIndicator color={W.teksRedup} />
      <Text style={[g.kosongSebab, { marginTop: J.x3 }]}>{teks}</Text>
    </View>
  );
}

/**
 * BAR BIAYA — porsi biaya terhadap risiko.
 *
 * Di bawah 50% wajar, di atasnya mencolok, di atas 100% angka rencana ditahan
 * mesin. Warnanya mengikuti ambang itu, bukan gradasi bebas: tiga keadaan
 * yang punya arti, bukan sembilan yang tidak.
 */
export function BarBiaya({ porsi, ringkas = false }: { porsi: number | null; ringkas?: boolean }) {
  if (porsi === null) {
    return ringkas ? null : <Text style={g.kosongSebab}>Biaya belum tersedia; jangan menganggap transaksi tanpa biaya.</Text>;
  }
  const lebar = biayaLebar(porsi);
  const warna = porsi >= BIAYA_WAJAR_PERSEN * 2 ? W.turun : porsi >= BIAYA_WAJAR_PERSEN ? W.tanda : W.naik;
  return (
    <View>
      <View style={g.barLuar}>
        <View style={[g.barDalam, { width: `${String(lebar)}%` as `${number}%`, backgroundColor: warna }]} />
      </View>
      {!ringkas && (
        <Text style={[g.kosongSebab, { marginTop: J.x2, textAlign: 'left' }]}>
          Biaya {biayaPersen(porsi)} dari risiko · wajar di bawah {String(BIAYA_WAJAR_PERSEN)}%
        </Text>
      )}
    </View>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  kartu: {
    backgroundColor: W.kacaIsi, borderRadius: R.kartu, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, borderTopColor: W.kacaKilau,
    padding: 14, marginHorizontal: J.x3, marginBottom: J.x3,
  },
  kepala: { flexDirection: 'row', alignItems: 'center', marginBottom: J.x3, gap: J.x2 },
  kepalaTeks: { fontSize: H.label, color: W.teksSamar, fontWeight: '500', letterSpacing: 1.5, textTransform: 'uppercase' },
  nilai: { fontSize: H.nilai, fontWeight: '600', color: W.teksKuat, ...ANGKA },
  pil: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: R.bulat },
  pilTeks: { fontSize: 11.5, fontWeight: '600', ...ANGKA },
  baris: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, gap: J.x3 },
  barisKiri: { fontSize: 12.5, color: W.teksRedup, flexShrink: 1 },
  barisKanan: { fontSize: 12.5, color: W.teksKuat, fontWeight: '600', ...ANGKA },
  pisah: { height: StyleSheet.hairlineWidth * 2, backgroundColor: W.garisSamar, marginVertical: J.x3 },
  kosong: { padding: J.x5, alignItems: 'center' },
  kosongJudul: { fontSize: 15, color: W.teksKuat, fontWeight: '600', textAlign: 'center' },
  kosongSebab: { fontSize: 12.5, color: W.teksRedup, textAlign: 'center', marginTop: J.x2, lineHeight: 19 },
  tombol: {
    marginTop: J.x4, paddingVertical: 11, paddingHorizontal: 20,
    borderRadius: R.besar, backgroundColor: W.utama,
  },
  tombolTeks: { fontSize: 14, fontWeight: '700', color: W.utamaTeks },
  barLuar: { height: 6, borderRadius: R.bulat, backgroundColor: W.isiSamarKuat, overflow: 'hidden' },
  barDalam: { height: 6, borderRadius: R.bulat },
}));
