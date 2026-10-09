/**
 * PRIMITIF MOCKUP — padanan React Native dari kelas CSS di
 * `opendesign/mockups/kaca/index.html`, satu-satu, dengan angka yang sama.
 *
 * Kenapa satu berkas dan bukan disebar ke tiap layar: 33 layar mockup lahir
 * dari ~15 kelas yang sama. Kalau tiap layar menggambar chip-nya sendiri,
 * dua minggu lagi ada tiga chip yang tingginya beda satu piksel — dan yang
 * beda satu piksel itu terbaca sebagai app yang dirakit dari potongan.
 *
 *   .blok        -> <Blok>        .chip       -> <Chip>
 *   .lbl         -> <Lbl>         .pil-tf     -> <PilTf>
 *   .nil         -> <Nil>         .mesin      -> <PitaMesin>
 *   .pasar-baris -> <BarisPasar>  .tarik      -> <Tarik>
 *   .menu / a    -> <Menu>/<Butir> .saklar    -> <Saklar>
 *   .langkah     -> <Langkah>     .rangka     -> <Rangka>
 *   .tombol-*    -> <Tombol>      .mikro      -> <Mikro>
 *   .kosong      -> <Kosong>      .dampak     -> <Dampak>
 */
import type { ReactNode } from 'react';
import { gayaTema } from '../gaya/tema';
import { Pressable, StyleSheet, Text, View, type ViewStyle, type TextStyle } from 'react-native';
import { W, H, J, R, ANGKA, SENTUH, TALANG } from '../gaya/token';
import Animated from 'react-native-reanimated';
import { Tekan } from './Tekan';
import { KURVA_KELUAR, MS, type GayaGerak } from '../gaya/gerak';
import { Ikon, type NamaIkon } from './Ikon';
import { LambangPasar } from './LambangPasar';

/* ── .blok ─────────────────────────────────────────────────────────────── */
export function Blok({ children, gaya, emas = false, rapat = false }: {
  children: ReactNode; gaya?: ViewStyle; emas?: boolean; rapat?: boolean;
}) {
  return (
    <View style={[g.blok, rapat && g.blokRapat, emas && g.blokEmas, gaya]}>{children}</View>
  );
}

/* ── .lbl ──────────────────────────────────────────────────────────────── */
export function Lbl({ children, polos = false, warna, gaya }: {
  children: ReactNode; polos?: boolean; warna?: string; gaya?: TextStyle;
}) {
  return (
    <Text style={[g.lbl, polos && g.lblPolos, warna !== undefined && { color: warna }, gaya]}>{children}</Text>
  );
}

/* ── .nil ──────────────────────────────────────────────────────────────── */
export function Nil({ children, warna, besar = false, gaya }: {
  children: ReactNode; warna?: string; besar?: boolean; gaya?: TextStyle;
}) {
  return (
    <Text style={[g.nil, besar && g.nilBesar, warna !== undefined && { color: warna }, gaya]}>{children}</Text>
  );
}

/* ── .harga ────────────────────────────────────────────────────────────── */
export function Harga({ children, kecil = false }: { children: ReactNode; kecil?: boolean }) {
  return <Text style={[g.harga, kecil && g.hargaKecil]}>{children}</Text>;
}

/* ── .chip ─────────────────────────────────────────────────────────────── */
export function Chip({ teks, on = false, emas = false, mono = false, halus = false, onPress, gaya, lencana }: {
  teks: string; on?: boolean; emas?: boolean; mono?: boolean;
  /** Nyala yang TIDAK amber — untuk saklar banyak-pilih (lapisan chart).
      Empat chip amber berderet bersaing dengan tombol utama di layar yang sama. */
  halus?: boolean;
  onPress?: () => void; gaya?: ViewStyle; lencana?: boolean }) {
  /* `lencana` BUKAN sekadar penanda untuk penjaga. Ia juga yang membuat
     pembaca layar berhenti menyebutnya tombol: chip status yang diumumkan
     sebagai tombol menyuruh orang menekan sesuatu yang tidak menjawab. */
  const isi = (
    <View style={[g.chip, on && (halus ? g.chipHalus : g.chipOn), emas && g.chipEmas, gaya]}
      accessibilityRole={lencana === true ? 'text' : undefined}>
      <Text style={[g.chipTeks, on && (halus ? g.chipTeksHalus : g.chipTeksOn), emas && g.chipTeksEmas, mono && ANGKA]}>{teks}</Text>
    </View>
  );
  if (onPress === undefined) return isi;
  return <Tekan onPress={onPress} hitSlop={6} accessibilityState={{ selected: on }}>{isi}</Tekan>;
}

/* ── .pil-tf ───────────────────────────────────────────────────────────── */
export function PilTf({ daftar, aktif, pilih }: {
  daftar: ReadonlyArray<string>; aktif: string; pilih: (t: string) => void;
}) {
  return (
    <View style={g.pilTf}>
      {daftar.map((t) => {
        const on = t === aktif;
        return (
          <Pressable key={t} onPress={() => { pilih(t); }} style={[g.pilSel, on && g.pilSelOn]}
            accessibilityRole="button" accessibilityState={{ selected: on }}>
            <Text style={[g.pilTeks, on && g.pilTeksOn]}>{t.toLowerCase()}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ── .mesin — lima kolom dibagi rata ───────────────────────────────────── */
export type SelMesin = { kode: string; kata: string; angka: string; titik: 'polos' | 'putih' | 'hijau' };
export function PitaMesin({ daftar, aktif, pilih }: {
  daftar: ReadonlyArray<SelMesin>; aktif: string; pilih: (kode: string) => void;
}) {
  return (
    <View style={g.mesin}>
      {daftar.map((m, i) => {
        const on = m.kode === aktif;
        return (
          <Pressable
            key={m.kode}
            onPress={() => { pilih(m.kode); }}
            style={[g.mesinSel, on && g.mesinSelOn]}
            accessibilityRole="button" accessibilityState={{ selected: on }}
          >
            <Text style={[g.mesinNama, on && g.mesinNamaOn]} numberOfLines={1}>{m.kode}</Text>
            <View style={g.mesinStatus}>
              <View style={[g.titik, m.kata === 'pantau' && { backgroundColor: '#CDBFA6' }, m.titik === 'putih' && { backgroundColor: W.teksKuat }, m.titik === 'hijau' && { backgroundColor: W.naik }]} />
              <Text style={[g.mesinStatusTeks, m.titik === 'hijau' && { color: W.naik }]} numberOfLines={1}>
                {m.kata === 'setup' ? 'setup ' : ''}{m.angka}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ── .pasar-baris ──────────────────────────────────────────────────────── */
export function BarisPasar({ simbol, label, harga, ubah, ubahWarna, onPress, redup = false, pertama = false, kanan, lencana, terpilih = false }: {
  simbol: string; label: string; harga: string; ubah: string; ubahWarna?: string;
  onPress?: () => void; redup?: boolean; pertama?: boolean; kanan?: ReactNode;
  /** Pita kecil di samping simbol ("dibuka") — harga dan perubahannya tetap terlihat. */
  lencana?: string;
  terpilih?: boolean;
}) {
  const isi = (
    <View style={[g.pasarBaris, !pertama && !terpilih && g.garisAtas, terpilih && g.pasarTerpilih, redup && { opacity: 0.45 }]}>
      <LambangPasar simbol={simbol} ukuran={30} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={g.pasarJudul}>
          <Text style={g.pasarSimbol} numberOfLines={1}>{simbol}</Text>
          {lencana !== undefined && <Text style={g.pasarLencana}>{lencana}</Text>}
        </View>
        <Text style={g.pasarLabel} numberOfLines={1}>{label}</Text>
      </View>
      {kanan ?? (
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={g.pasarHarga}>{harga}</Text>
          <Text style={[g.pasarUbah, ubahWarna !== undefined && { color: ubahWarna }]}>{ubah}</Text>
        </View>
      )}
    </View>
  );
  if (onPress === undefined) return isi;
  /* Baris lebar: skala 0,96 — 0,95 pada benda selebar layar terlihat melompat. */
  return <Tekan onPress={onPress} skala={0.96}>{isi}</Tekan>;
}

/* ── .tarik — tiga isyarat, bukan satu ─────────────────────────────────── */
export function Tarik({ kata, turun = false }: { kata: string; turun?: boolean }) {
  return (
    <View style={g.tarik}>
      <View style={g.gagang} />
      <View style={g.tarikKata}>
        <Text style={[g.panah, turun && { transform: [{ rotate: '180deg' }] }]}>⌃</Text>
        <Text style={g.tarikTeks}>{kata}</Text>
      </View>
    </View>
  );
}

/* ── .menu / .menu a ───────────────────────────────────────────────────── */
export function Menu({ children }: { children: ReactNode }) {
  return <View style={g.menu}>{children}</View>;
}
export function Butir({ ikon, simbol, nama, sub, ket, ketMono = false, ketEmas = false, onPress, kanan, pertama = false, bahaya = false }: {
  ikon?: NamaIkon; simbol?: string; nama: string;
  /** Baris kedua di bawah nama — untuk keterangan yang terlalu panjang untuk sisi kanan. */
  sub?: string;
  ket?: string; ketMono?: boolean; ketEmas?: boolean;
  onPress?: () => void; kanan?: ReactNode; pertama?: boolean;
  /** Merah: tindakan yang tidak bisa dibatalkan. */
  bahaya?: boolean;
}) {
  /**
   * PANAH CUMA UNTUK BARIS YANG BENAR-BENAR MEMBUKA SESUATU.
   *
   * Sebelumnya `›` digambar TANPA SYARAT, jadi tiap baris mati menjanjikan
   * ada layar di baliknya. Di Pengaturan ada tiga sekaligus — "Tema ›",
   * "Bahasa ›", "Zona waktu ›" — yang ditekan dan diam. Ditemukan dari
   * potret layar, bukan dari kode: di kode ketiganya terlihat seperti baris
   * biasa, dan panahnya datang dari sini.
   *
   * Diperbaiki di komponennya, bukan di tiap pemanggil: "bisa ditekan" dan
   * "terlihat bisa ditekan" sekarang satu hal yang sama, dan tidak ada yang
   * bisa memisahkannya lagi dengan lupa.
   */
  const bisaDitekan = onPress !== undefined;
  return (
    <Tekan onPress={onPress} disabled={!bisaDitekan} skala={0.96}
      accessibilityRole={bisaDitekan ? 'button' : 'none'}
      gaya={[g.butir, !pertama && g.garisAtas]}>
      {simbol !== undefined
        ? <LambangPasar simbol={simbol} ukuran={26} />
        : ikon !== undefined && <View style={[g.butirIkon, bahaya && g.butirIkonBahaya]}><Ikon nama={ikon} warna={bahaya ? W.turun : W.plus} ukuran={16} /></View>}
      {/* Nama MENGISI sisa baris, bukan menyusut di depan pendorong: dengan
          saklar di kanan, "Tetap menyala saat chart terbuka" terpotong di
          potret 9 Okt padahal ruangnya ada. Dua baris lebih baik daripada elipsis. */}
      <View style={g.butirTengah}>
        <Text style={[g.butirNama, bahaya && { color: W.turun }]} numberOfLines={2}>{nama}</Text>
        {sub !== undefined && <Text style={g.butirSub} numberOfLines={2}>{sub}</Text>}
      </View>
      {kanan ?? (ket === undefined ? null : (
        <Text style={[g.butirKet, ketMono && ANGKA, ketEmas && { color: W.plusTeks, fontWeight: '600' }]} numberOfLines={1}>{ket}</Text>
      ))}
      {bisaDitekan && <Text style={g.butirPanah}>›</Text>}
    </Tekan>
  );
}

/* ── .saklar ───────────────────────────────────────────────────────────── */
/* Di luar StyleSheet: properti transisi CSS Reanimated bukan tipe RN. */
const SAKLAR_TRANSISI = {
  transform: [{ translateX: 0 }],
  transitionProperty: ['transform', 'backgroundColor'],
  transitionDuration: MS.kecil,
  transitionTimingFunction: KURVA_KELUAR,
} satisfies GayaGerak;

export function Saklar({ on, ganti }: { on: boolean; ganti?: (v: boolean) => void }) {
  return (
    <Pressable onPress={() => { ganti?.(!on); }} disabled={ganti === undefined} hitSlop={8}
      accessibilityRole="switch" accessibilityState={{ checked: on }}
      style={[g.saklar, on && g.saklarOn]}>
      {/* Bulatannya MELUNCUR 160 ms (transform, bukan margin — margin memicu
          layout tiap frame). Warnanya ikut dalam transisi yang sama supaya
          tidak ada frame di mana bulatan sudah pindah tapi masih abu. */}
      <Animated.View style={[g.saklarBulat, SAKLAR_TRANSISI, on && g.saklarBulatOn]} />
    </Pressable>
  );
}

/* ── .radio ────────────────────────────────────────────────────────────── */
export function Radio({ on }: { on: boolean }) {
  return <View style={[g.radio, on && g.radioOn]} />;
}

/* ── .langkah — HANYA untuk alur yang urutannya menentukan ─────────────── */
export function Langkah({ no, judul, ket, pertama = false }: { no: number; judul: string; ket: string; pertama?: boolean }) {
  return (
    <View style={[g.langkah, !pertama && g.garisAtas]}>
      <View style={g.langkahNo}><Text style={g.langkahNoTeks}>{no}</Text></View>
      <View style={{ flex: 1 }}>
        <Text style={g.langkahJudul}>{judul}</Text>
        <Text style={g.langkahKet}>{ket}</Text>
      </View>
    </View>
  );
}

/* ── .rangka — bentuk isi yang akan datang ─────────────────────────────── */
export function Rangka({ lebar = '100%', tinggi = 10, gaya }: { lebar?: number | `${number}%`; tinggi?: number; gaya?: ViewStyle }) {
  return <View style={[g.rangka, { width: lebar, height: tinggi }, gaya]} />;
}

/* ── .tombol-utama / .tombol-masuk / .tombol-kedua ─────────────────────── */
export function Tombol({ teks, jenis = 'utama', mati = false, onPress, ikon }: {
  teks: string;
  /** `bahaya` HANYA untuk tindakan yang tidak bisa dibatalkan (hapus akun). */
  jenis?: 'utama' | 'emas' | 'kedua' | 'bahaya'; mati?: boolean; onPress?: () => void; ikon?: ReactNode;
}) {
  return (
    <Tekan onPress={onPress} disabled={mati || onPress === undefined}
      accessibilityState={{ disabled: mati }}
      gaya={[
        g.tombol,
        jenis === 'emas' && g.tombolEmas,
        jenis === 'kedua' && g.tombolKedua,
        jenis === 'bahaya' && g.tombolBahaya,
        mati && (jenis === 'emas' ? g.tombolEmasMati : g.tombolMati),
      ]}>
      {ikon}
      <Text style={[g.tombolTeks, jenis === 'emas' && g.tombolEmasTeks, jenis === 'kedua' && g.tombolKeduaTeks, jenis === 'bahaya' && g.tombolBahayaTeks, mati && g.tombolTeksMati]}>
        {teks}
      </Text>
    </Tekan>
  );
}

/* ── .mikro ────────────────────────────────────────────────────────────── */
export function Mikro({ children, tengah = false }: { children: ReactNode; tengah?: boolean }) {
  return <Text style={[g.mikro, tengah && { textAlign: 'center' }]}>{children}</Text>;
}

/* ── .kosong ───────────────────────────────────────────────────────────── */
export function Kosong({ ikon, judul, kalimat, aksi, labelAksi, catatan }: {
  ikon?: NamaIkon; judul: string; kalimat: string; aksi?: () => void; labelAksi?: string; catatan?: string;
}) {
  return (
    <View style={g.kosong}>
      {ikon !== undefined && <View style={g.kosongIkon}><Ikon nama={ikon} warna={W.plus} ukuran={26} /></View>}
      <Text style={g.kosongJudul}>{judul}</Text>
      <Text style={g.kosongKalimat}>{kalimat}</Text>
      {aksi !== undefined && (
        <View style={{ marginTop: J.x1, alignSelf: 'center' }}>
          <Tombol teks={labelAksi ?? 'Coba lagi'} onPress={aksi} />
        </View>
      )}
      {catatan !== undefined && <Lbl polos gaya={{ marginTop: J.x1 }}>{catatan}</Lbl>}
    </View>
  );
}

/* ── .basi — isi lama masih terpampang, penyegaran terakhirnya gagal ────
   BUKAN bendera diam-diam. Angka lama yang terlihat seperti angka baru adalah
   kegagalan yang paling mahal di app ini, jadi sebabnya dicetak apa adanya —
   dan `periksa-jawaban.mjs` menuntut tiap layar yang memakai `useMuat`
   benar-benar merendernya. Titik jingga, bukan merah: ini bukan kerusakan,
   melainkan keterangan tentang UMUR yang terlihat. */
export function PitaBasi({ kalimat }: { kalimat: string }) {
  return (
    <View style={g.basi}>
      <Ikon nama="info" warna={W.plus} ukuran={16} />
      <Text style={g.basiTeks}>{kalimat}</Text>
    </View>
  );
}

/* ── .dampak — pita tegak: bentuk DAN warna ────────────────────────────── */
export function Dampak({ tinggi }: { tinggi: boolean }) {
  return <View style={[g.dampak, { backgroundColor: tinggi ? W.turun : W.plus }]} />;
}

/* ── .hari — judul kelompok tanggal ────────────────────────────────────── */
export function Hari({ children }: { children: ReactNode }) {
  return <Text style={g.hari}>{children}</Text>;
}

/* ── .istilah ──────────────────────────────────────────────────────────── */
export function Istilah({ judul, isi, pertama = false }: { judul: string; isi: string; pertama?: boolean }) {
  return (
    <View style={[g.istilah, !pertama && g.garisAtas]}>
      <Text style={g.istilahJudul}>{judul}</Text>
      <Text style={g.istilahIsi}>{isi}</Text>
    </View>
  );
}

/* ── .syarat ───────────────────────────────────────────────────────────── */
export function BarisSyarat({ lolos, judul, ket }: { lolos: boolean; judul: string; ket?: string }) {
  return (
    <View style={g.syarat}>
      <View style={[g.syaratBulat, { backgroundColor: lolos ? 'rgba(16,185,129,0.16)' : 'rgba(244,63,94,0.14)' }]}>
        <Text style={[g.syaratTanda, { color: lolos ? '#6FE3B7' : '#FF8FA2' }]}>{lolos ? '✓' : '✕'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[g.syaratJudul, !lolos && { color: W.teksKuat }]}>{judul}</Text>
        {ket !== undefined && ket !== '' && <Text style={g.syaratKet}>{ket}</Text>}
      </View>
    </View>
  );
}

/* ── .lvl — zona / level ───────────────────────────────────────────────── */
export function BarisLevel({ pita, judul, ket, chip, luar = false, pertama = false }: {
  pita?: 'naik' | 'turun'; judul: string; ket: string; chip?: string; luar?: boolean; pertama?: boolean;
}) {
  return (
    <View style={[g.lvl, !pertama && g.garisAtas, luar && { opacity: 0.55 }]}>
      <View style={[g.lvlPita, pita === 'naik' && { backgroundColor: W.naik }, pita === 'turun' && { backgroundColor: W.turun }]} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={g.lvlJudul} numberOfLines={1}>{judul}</Text>
        <Text style={g.lvlKet} numberOfLines={1}>{ket}</Text>
      </View>
      {chip !== undefined && <Chip teks={chip} />}
    </View>
  );
}

/* ── .pakai — baris pemakaian ──────────────────────────────────────────── */
export function BarisPakai({ kiri, kanan, tebal = false, pertama = false }: { kiri: string; kanan: string; tebal?: boolean; pertama?: boolean }) {
  return (
    <View style={[g.pakai, !pertama && g.garisAtas]}>
      <Text style={[g.pakaiKiri, tebal && { color: W.teksKuat, fontWeight: '600' }]}>{kiri}</Text>
      <Text style={[g.pakaiKanan, tebal && { color: W.teksKuat, fontWeight: '700', fontSize: H.nilai }]}>{kanan}</Text>
    </View>
  );
}

/* ── bar isi ───────────────────────────────────────────────────────────── */
export function BarIsi({ porsi, warna = W.plus }: { porsi: number; warna?: string }) {
  const lebar = Math.max(0, Math.min(100, porsi * 100));
  return (
    <View style={g.barLuar}>
      <View style={[g.barDalam, { width: `${String(lebar)}%` as `${number}%`, backgroundColor: warna }]} />
    </View>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  /* KACA ISI: tembus tipis + garis rambut + tepi atas yang lebih terang.
     Tanpa blur — kartu isi duduk di atas latar bercahaya (Latar.tsx), dan
     cahaya itulah yang membuatnya terbaca sebagai kaca. Nol kerja per frame. */
  blok: {
    backgroundColor: W.kacaIsi, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, borderTopColor: W.kacaKilau,
    borderRadius: R.kartu, padding: 14,
  },
  blokRapat: { padding: 11 },
  blokEmas: { borderColor: W.amberTepi, borderTopColor: 'rgba(240,191,107,0.62)', backgroundColor: W.amberLatar },
  garisAtas: { borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: W.garisSamar },

  lbl: { fontSize: H.label, color: W.teksSamar, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: '500' },
  lblPolos: { letterSpacing: 0, textTransform: 'none', fontSize: H.alat, fontWeight: '400', lineHeight: 16 },
  nil: { fontSize: H.nilai, color: W.teksKuat, fontWeight: '600', ...ANGKA },
  nilBesar: { fontSize: 16 },
  harga: { fontSize: H.harga, fontWeight: '700', color: W.teksKuat, letterSpacing: -0.4, ...ANGKA },
  hargaKecil: { fontSize: 17 },

  chip: {
    minHeight: 30, paddingHorizontal: 12, borderRadius: R.bulat, justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, backgroundColor: W.isiSamar,
  },
  chipOn: { backgroundColor: W.utama, borderColor: W.utamaTerang },
  chipHalus: { backgroundColor: W.tinta(0.12), borderColor: W.tinta(0.26) },
  chipTeksHalus: { color: W.teksKuat, fontWeight: '700' },
  chipEmas: { borderColor: W.amberTepi, backgroundColor: W.amberLatar },
  chipTeks: { fontSize: 12, fontWeight: '600', color: W.teksRedup },
  chipTeksOn: { color: W.utamaTeks, fontWeight: '700' },
  chipTeksEmas: { color: W.plusTeks },

  pilTf: { flexDirection: 'row', gap: 3, padding: 4, borderRadius: R.besar, backgroundColor: W.kacaIsi, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi },
  pilSel: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: R.sedang },
  pilSelOn: { backgroundColor: W.tinta(0.13) },
  pilTeks: { fontSize: 12.5, fontWeight: '600', color: W.teksSamar, ...ANGKA },
  pilTeksOn: { color: W.teksKuat },

  mesin: { flexDirection: 'row', gap: 5 },
  mesinSel: {
    flex: 1, paddingVertical: 7, paddingHorizontal: 7, minWidth: 0, borderRadius: R.sedang + 2,
    backgroundColor: W.isiSamar, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi,
  },
  mesinSelOn: { backgroundColor: W.amberLatar, borderColor: W.amberTepi, borderBottomWidth: 2, borderBottomColor: W.plus },
  mesinNama: { fontSize: 11, color: W.teksRedup, fontWeight: '700' },
  mesinNamaOn: { color: W.teksKuat },
  mesinStatus: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  titik: { width: 6, height: 6, borderRadius: 3, backgroundColor: W.teksSamar },
  mesinStatusTeks: { fontSize: 10.5, color: W.teksSamar, ...ANGKA },

  pasarBaris: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 10, minHeight: 54 },
  pasarTerpilih: {
    backgroundColor: W.amberLatar, borderRadius: R.besar, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.amberTepi,
    paddingHorizontal: 10, marginHorizontal: -10, marginVertical: 2,
  },
  pasarJudul: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pasarSimbol: { fontSize: H.pasar, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.1, flexShrink: 1 },
  pasarLencana: {
    fontSize: 9, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase', color: W.utamaTeks,
    backgroundColor: W.utama, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden',
  },
  pasarLabel: { fontSize: H.alat, color: W.teksSamar, marginTop: 1 },
  pasarHarga: { fontSize: 13.5, fontWeight: '600', color: W.teksKuat, ...ANGKA },
  pasarUbah: { fontSize: H.alat, fontWeight: '600', color: W.teksSamar, ...ANGKA, marginTop: 1 },

  tarik: { alignItems: 'center', gap: 3, marginBottom: 8 },
  gagang: { width: 40, height: 5, borderRadius: 3, backgroundColor: W.tinta(0.25) },
  tarikKata: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  panah: { color: W.plusTeks, fontSize: 10, fontWeight: '700', lineHeight: 12 },
  tarikTeks: { fontSize: 9.5, color: W.teksSamar, letterSpacing: 1.1, textTransform: 'uppercase' },

  menu: {
    borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, borderTopColor: W.kacaKilau,
    borderRadius: R.kartu, overflow: 'hidden', backgroundColor: W.kacaIsi,
  },
  butir: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, minHeight: 54 },
  butirIkon: {
    width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center',
    backgroundColor: W.amberLatar, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: 'rgba(229,173,81,0.20)',
  },
  butirIkonBahaya: { backgroundColor: W.turunLatar, borderColor: W.turunTepi },
  butirTengah: { flex: 1, minWidth: 0, paddingVertical: 9, gap: 2 },
  butirNama: { fontSize: 13.5, color: W.teksKuat, fontWeight: '600' },
  butirSub: { fontSize: 12, color: W.teksSamar, lineHeight: 16 },
  butirKet: { fontSize: 12.5, color: W.teksRedup, flexShrink: 1, maxWidth: '55%' },
  butirPanah: { fontSize: 20, color: W.teksSamar, marginLeft: 2, marginTop: -2 },

  saklar: { width: 44, height: 26, borderRadius: 13, backgroundColor: W.tinta(0.12), borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, justifyContent: 'center' },
  saklarOn: { backgroundColor: W.utama, borderColor: W.utamaTerang },
  saklarBulat: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#CFC6B8', marginLeft: 2 },
  saklarBulatOn: { backgroundColor: '#FFFFFF', transform: [{ translateX: 18 }] },

  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: W.tinta(0.30), marginTop: 1 },
  radioOn: { borderColor: W.plus, borderWidth: 6 },

  langkah: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 11 },
  langkahNo: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: W.utama },
  langkahNoTeks: { fontSize: 12, fontWeight: '700', color: W.utamaTeks, ...ANGKA },
  langkahJudul: { fontSize: 13.5, fontWeight: '600', color: W.teksKuat, lineHeight: 19 },
  langkahKet: { fontSize: H.alat, color: W.teksSamar, marginTop: 2, lineHeight: 16 },

  rangka: { borderRadius: 6, backgroundColor: W.tinta(0.07) },

  tombol: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48,
    paddingVertical: 12, paddingHorizontal: 18, borderRadius: R.besar, backgroundColor: W.utama,
    borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: 'rgba(255,245,220,0.55)',
  },
  tombolTeks: { fontSize: 14.5, fontWeight: '700', color: W.utamaTeks, letterSpacing: -0.1 },
  tombolEmas: { backgroundColor: W.utama },
  tombolEmasTeks: { color: W.utamaTeks },
  tombolEmasMati: { backgroundColor: 'rgba(229,173,81,0.22)', borderTopColor: 'transparent' },
  tombolKedua: { backgroundColor: W.tinta(0.07), borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.tinta(0.14), borderTopColor: W.kacaKilau },
  tombolKeduaTeks: { color: W.teksKuat, fontWeight: '600' },
  tombolBahaya: { backgroundColor: W.turun, borderTopColor: 'rgba(255,220,226,0.45)' },
  tombolBahayaTeks: { color: '#FFFFFF' },
  tombolMati: { backgroundColor: W.tinta(0.07), borderTopColor: 'transparent' },
  tombolTeksMati: { color: W.teksSamar },

  mikro: { fontSize: H.alat, color: W.teksSamar, lineHeight: 17 },

  kosong: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 26, paddingVertical: 26 },
  kosongIkon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: W.amberLatar, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.amberTepi },
  kosongJudul: { fontSize: 16, fontWeight: '600', color: W.teksKuat, textAlign: 'center' },
  kosongKalimat: { fontSize: 13, color: W.teksSamar, textAlign: 'center', lineHeight: 19, maxWidth: 280 },

  basi: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: 'rgba(229,173,81,0.12)',
    borderWidth: StyleSheet.hairlineWidth * 2, borderColor: 'rgba(229,173,81,0.36)', borderRadius: R.besar,
  },
  basiTitik: { width: 6, height: 6, borderRadius: R.bulat, backgroundColor: W.plus },
  basiTeks: { flex: 1, color: W.teks, fontSize: 12.5, lineHeight: 18 },

  dampak: { width: 4, borderRadius: 2, alignSelf: 'stretch', backgroundColor: W.teksSamar },
  hari: { fontSize: H.label, color: W.teksSamar, letterSpacing: 1.5, textTransform: 'uppercase', marginTop: J.x3, marginBottom: J.x2, marginLeft: 4 },

  istilah: { paddingVertical: 12 },
  istilahJudul: { fontSize: 14, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.1 },
  istilahIsi: { fontSize: 12.5, color: W.teksRedup, lineHeight: 19, marginTop: 4 },

  syarat: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingVertical: 8 },
  syaratBulat: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  syaratTanda: { fontSize: 11, fontWeight: '800' },
  syaratJudul: { fontSize: 13, fontWeight: '600', color: W.teks },
  syaratKet: { fontSize: H.alat, color: W.teksSamar, lineHeight: 16, marginTop: 2 },

  lvl: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  lvlPita: { width: 4, borderRadius: 2, alignSelf: 'stretch', backgroundColor: W.garis },
  lvlJudul: { fontSize: 13, fontWeight: '600', color: W.teksKuat },
  lvlKet: { fontSize: H.alat, color: W.teksSamar, ...ANGKA, marginTop: 1 },

  pakai: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingVertical: 8 },
  pakaiKiri: { fontSize: 12.5, color: W.teksRedup },
  pakaiKanan: { fontSize: 12.5, color: W.teksKuat, fontWeight: '600', ...ANGKA },

  barLuar: { height: 6, borderRadius: 3, backgroundColor: W.tinta(0.08), overflow: 'hidden' },
  barDalam: { height: '100%', borderRadius: 3 },
}));

/** Jarak tepi layar mockup (11px) — dipakai layar-layar baru. */
export const TALANG_MOCKUP = TALANG;
