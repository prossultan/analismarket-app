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
export function Chip({ teks, on = false, emas = false, mono = false, onPress, gaya, lencana }: {
  teks: string; on?: boolean; emas?: boolean; mono?: boolean; onPress?: () => void; gaya?: ViewStyle; lencana?: boolean }) {
  /* `lencana` BUKAN sekadar penanda untuk penjaga. Ia juga yang membuat
     pembaca layar berhenti menyebutnya tombol: chip status yang diumumkan
     sebagai tombol menyuruh orang menekan sesuatu yang tidak menjawab. */
  const isi = (
    <View style={[g.chip, on && g.chipOn, emas && g.chipEmas, gaya]}
      accessibilityRole={lencana === true ? 'text' : undefined}>
      <Text style={[g.chipTeks, on && g.chipTeksOn, emas && g.chipTeksEmas, mono && ANGKA]}>{teks}</Text>
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
            style={[g.mesinSel, i > 0 && g.mesinSelGaris, on && g.mesinSelOn]}
            accessibilityRole="button" accessibilityState={{ selected: on }}
          >
            <Text style={[g.mesinNama, on && g.mesinNamaOn]} numberOfLines={1}>{m.kode}</Text>
            <View style={g.mesinStatus}>
              <View style={[g.titik, m.titik === 'putih' && { backgroundColor: W.teksKuat }, m.titik === 'hijau' && { backgroundColor: W.naik }]} />
              <Text style={g.mesinStatusTeks} numberOfLines={1}>
                {m.kata !== '' ? `${m.kata} ` : ''}{m.angka}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ── .pasar-baris ──────────────────────────────────────────────────────── */
export function BarisPasar({ simbol, label, harga, ubah, ubahWarna, onPress, redup = false, pertama = false, kanan }: {
  simbol: string; label: string; harga: string; ubah: string; ubahWarna?: string;
  onPress?: () => void; redup?: boolean; pertama?: boolean; kanan?: ReactNode;
}) {
  const isi = (
    <View style={[g.pasarBaris, !pertama && g.garisAtas, redup && { opacity: 0.45 }]}>
      <LambangPasar simbol={simbol} ukuran={22} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={g.pasarSimbol} numberOfLines={1}>{simbol}</Text>
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
export function Butir({ ikon, simbol, nama, ket, ketMono = false, ketEmas = false, onPress, kanan, pertama = false }: {
  ikon?: NamaIkon; simbol?: string; nama: string; ket?: string; ketMono?: boolean; ketEmas?: boolean;
  onPress?: () => void; kanan?: ReactNode; pertama?: boolean;
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
        ? <LambangPasar simbol={simbol} ukuran={18} />
        : ikon !== undefined && <Ikon nama={ikon} warna={W.teksSamar} ukuran={15} />}
      <Text style={g.butirNama} numberOfLines={1}>{nama}</Text>
      <View style={{ flex: 1 }} />
      {kanan ?? (ket === undefined && !bisaDitekan ? null : (
        <Text style={[g.butirKet, ketMono && ANGKA, ketEmas && { color: W.plusTeks }]} numberOfLines={1}>
          {`${ket ?? ''}${bisaDitekan ? (ket === undefined ? '›' : ' ›') : ''}`}
        </Text>
      ))}
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
  teks: string; jenis?: 'utama' | 'emas' | 'kedua'; mati?: boolean; onPress?: () => void; ikon?: ReactNode;
}) {
  return (
    <Tekan onPress={onPress} disabled={mati || onPress === undefined}
      accessibilityState={{ disabled: mati }}
      gaya={[
        g.tombol,
        jenis === 'emas' && g.tombolEmas,
        jenis === 'kedua' && g.tombolKedua,
        mati && (jenis === 'emas' ? g.tombolEmasMati : g.tombolMati),
      ]}>
      {ikon}
      <Text style={[g.tombolTeks, jenis === 'emas' && g.tombolEmasTeks, jenis === 'kedua' && g.tombolKeduaTeks, mati && g.tombolTeksMati]}>
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
      {ikon !== undefined && <Ikon nama={ikon} warna={W.plus} ukuran={30} />}
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
      <View style={g.basiTitik} />
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
      <Text style={[g.syaratTanda, { color: lolos ? W.naik : W.turun }]}>{lolos ? '✓' : '✕'}</Text>
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
  blok: { backgroundColor: W.kartu, borderWidth: 1, borderColor: W.garis, borderRadius: R.kartu, padding: 10 },
  blokRapat: { padding: 8 },
  blokEmas: { borderColor: 'rgba(201,169,97,0.32)', backgroundColor: 'rgba(201,169,97,0.07)' },
  garisAtas: { borderTopWidth: 1, borderTopColor: W.garisSamar },

  lbl: { fontSize: H.label, color: W.teksSamar, letterSpacing: 1.0, textTransform: 'uppercase' },
  lblPolos: { letterSpacing: 0, textTransform: 'none' },
  nil: { fontSize: H.nilai, color: W.teksKuat, fontWeight: '500', ...ANGKA },
  nilBesar: { fontSize: 14 },
  harga: { fontSize: H.harga, fontWeight: '700', color: W.teksKuat, letterSpacing: -0.3, ...ANGKA },
  hargaKecil: { fontSize: 14 },

  chip: {
    minHeight: 22, paddingHorizontal: 8, borderRadius: R.bulat, justifyContent: 'center',
    borderWidth: 1, borderColor: W.garis, backgroundColor: W.kartuTerang,
  },
  chipOn: { backgroundColor: W.teksKuat, borderColor: 'transparent' },
  chipEmas: { borderColor: 'rgba(201,169,97,0.38)', backgroundColor: W.plusRedup },
  chipTeks: { fontSize: H.label, color: W.teksRedup },
  chipTeksOn: { color: W.latar, fontWeight: '600' },
  chipTeksEmas: { color: W.plusTeks },

  pilTf: { flexDirection: 'row', gap: 2, padding: 2, borderRadius: R.bulat, backgroundColor: W.tinta(0.05) },
  pilSel: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: R.bulat },
  pilSelOn: { backgroundColor: W.tinta(0.12) },
  pilTeks: { fontSize: H.label, color: W.teksSamar, ...ANGKA },
  pilTeksOn: { color: W.teksKuat },

  mesin: { flexDirection: 'row', borderWidth: 1, borderColor: W.garis, borderRadius: R.sedang + 3, overflow: 'hidden', backgroundColor: W.latar900 },
  mesinSel: { flex: 1, paddingVertical: 6, paddingHorizontal: 4, minWidth: 0 },
  mesinSelGaris: { borderLeftWidth: 1, borderLeftColor: W.garisSamar },
  mesinSelOn: { backgroundColor: W.kartuTerang, borderBottomWidth: 2, borderBottomColor: W.teksKuat },
  mesinNama: { fontSize: H.label, color: W.teksRedup, fontWeight: '500' },
  mesinNamaOn: { color: W.teksKuat },
  mesinStatus: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  titik: { width: 4, height: 4, borderRadius: 2, backgroundColor: W.teksSamar },
  mesinStatusTeks: { fontSize: 8, color: W.teksSamar, ...ANGKA },

  pasarBaris: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 7, minHeight: SENTUH },
  pasarSimbol: { fontSize: H.nilai, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.1 },
  pasarLabel: { fontSize: H.label, color: W.teksSamar },
  pasarHarga: { fontSize: H.nilai, color: W.teksKuat, ...ANGKA },
  pasarUbah: { fontSize: H.label, color: W.teksSamar, ...ANGKA },

  tarik: { alignItems: 'center', gap: 2, marginBottom: 7 },
  gagang: { width: 32, height: 4, borderRadius: 2, backgroundColor: W.tinta(0.28) },
  tarikKata: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  panah: { color: W.plusTeks, fontSize: 10, fontWeight: '700', lineHeight: 12 },
  tarikTeks: { fontSize: 8, color: W.teksSamar, letterSpacing: 0.8, textTransform: 'uppercase' },

  menu: { borderWidth: 1, borderColor: W.garis, borderRadius: R.kartu, overflow: 'hidden', backgroundColor: W.kartu },
  butir: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 11, minHeight: SENTUH },
  butirNama: { fontSize: H.nilai, color: W.teksKuat, fontWeight: '500', flexShrink: 1 },
  butirKet: { fontSize: H.label, color: W.teksSamar },

  saklar: { width: 28, height: 16, borderRadius: R.bulat, backgroundColor: W.tinta(0.10), borderWidth: 1, borderColor: W.garis, justifyContent: 'center' },
  saklarOn: { backgroundColor: W.plusRedup, borderColor: 'rgba(201,169,97,0.38)' },
  saklarBulat: { width: 12, height: 12, borderRadius: 6, backgroundColor: W.teksRedup, marginLeft: 1 },
  saklarBulatOn: { backgroundColor: W.plus, transform: [{ translateX: 12 }] },

  radio: { width: 13, height: 13, borderRadius: 7, borderWidth: 1.4, borderColor: W.garis, marginTop: 1 },
  radioOn: { borderColor: W.plus, borderWidth: 4 },

  langkah: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', paddingVertical: 7 },
  langkahNo: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(201,169,97,0.38)', backgroundColor: W.plusRedup },
  langkahNoTeks: { fontSize: 9, fontWeight: '700', color: W.plusTeks, ...ANGKA },
  langkahJudul: { fontSize: H.nilai, fontWeight: '600', color: W.teksKuat },
  langkahKet: { fontSize: H.label, color: W.teksSamar, marginTop: 1, lineHeight: 13 },

  rangka: { borderRadius: 4, backgroundColor: W.tinta(0.07) },

  tombol: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, paddingHorizontal: 18, borderRadius: R.besar + 3, backgroundColor: W.teksKuat },
  tombolTeks: { fontSize: H.nilai, fontWeight: '700', color: '#14130F', letterSpacing: -0.1 },
  tombolEmas: { backgroundColor: W.plus },
  tombolEmasTeks: { color: '#1A1508' },
  tombolEmasMati: { backgroundColor: 'rgba(201,169,97,0.22)' },
  tombolKedua: { backgroundColor: W.tinta(0.07), borderWidth: 1, borderColor: W.tinta(0.16) },
  tombolKeduaTeks: { color: W.teksKuat, fontWeight: '500' },
  tombolMati: { backgroundColor: W.tinta(0.10) },
  tombolTeksMati: { color: 'rgba(232,231,229,0.45)' },

  mikro: { fontSize: 9, color: W.teksSamar, lineHeight: 13 },

  kosong: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 26, paddingVertical: 26 },
  kosongJudul: { fontSize: H.pasar, fontWeight: '600', color: W.teksKuat, textAlign: 'center' },
  kosongKalimat: { fontSize: H.alat, color: W.teksSamar, textAlign: 'center', lineHeight: 15, maxWidth: 240 },

  basi: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 9,
    backgroundColor: 'rgba(253,152,41,0.10)',
    borderWidth: 1, borderColor: 'rgba(253,152,41,0.22)', borderRadius: R.besar,
  },
  basiTitik: { width: 5, height: 5, borderRadius: R.bulat, backgroundColor: W.tanda },
  basiTeks: { flex: 1, color: W.teksRedup, fontSize: H.alat, lineHeight: H.alat * 1.45 },

  dampak: { width: 3, borderRadius: 2, alignSelf: 'stretch', backgroundColor: W.teksSamar },
  hari: { fontSize: H.label, color: W.teksSamar, letterSpacing: 1.0, textTransform: 'uppercase', marginTop: J.x2, marginBottom: J.x1 },

  istilah: { paddingVertical: 7 },
  istilahJudul: { fontSize: H.nilai, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.1 },
  istilahIsi: { fontSize: H.alat, color: W.teksRedup, lineHeight: 14, marginTop: 2 },

  syarat: { flexDirection: 'row', gap: 7, alignItems: 'flex-start', paddingVertical: 5 },
  syaratTanda: { fontSize: 9, marginTop: 2 },
  syaratJudul: { fontSize: H.alat, fontWeight: '600', color: W.teksRedup },
  syaratKet: { fontSize: H.label, color: W.teksSamar, lineHeight: 13, marginTop: 1 },

  lvl: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  lvlPita: { width: 3, borderRadius: 2, alignSelf: 'stretch', backgroundColor: W.garis },
  lvlJudul: { fontSize: H.alat, fontWeight: '600', color: W.teksKuat },
  lvlKet: { fontSize: H.label, color: W.teksSamar, ...ANGKA },

  pakai: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, paddingVertical: 5 },
  pakaiKiri: { fontSize: H.alat, color: W.teksRedup },
  pakaiKanan: { fontSize: H.alat, color: W.teksRedup, ...ANGKA },

  barLuar: { height: 5, borderRadius: 3, backgroundColor: W.tinta(0.07), overflow: 'hidden' },
  barDalam: { height: '100%' },
}));

/** Jarak tepi layar mockup (11px) — dipakai layar-layar baru. */
export const TALANG_MOCKUP = TALANG;
