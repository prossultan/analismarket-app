/**
 * LAYAR AKUN — mockup 21 sampai 27, sekarang dengan DATA SUNGGUHAN.
 *
 * Jalurnya sudah ada di server sejak awal dan tidak butuh satu pun perubahan
 * bot: token sekali pakai dari bot ditukar jadi sesi, sesi membuka 15 rute
 * `/api/saya/*`. Yang dulu ditulis "terhalang identitas" sebenarnya cuma
 * kehilangan sisi app-nya.
 *
 * Yang TETAP jujur: tiap layar punya tiga keadaan — belum tersambung, sedang
 * memuat, dan terisi. Angka karangan tidak pernah menggantikan yang belum
 * diketahui; yang belum ada dicetak "—".
 */
import { useCallback, useEffect, useState } from 'react';
import { gayaTema } from '../gaya/tema';
import { Image, ScrollView, StyleSheet, Text, TextInput, View, AppState, Linking, useWindowDimensions } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { ambilBacaan, ambilPasar, syaratWajib, type Bacaan, type Mesin, type Pasar } from '../data/api';
import type { Jawaban } from '../data/antrian';
import { bolehDibacaOtomatis, contohKabarPush, keadaanPantauan } from '../data/keadaanPantauan';
import { MARK } from '../komponen/Merek';
import { Cincin } from '../komponen/Cincin';
import {
  ambilKabarOtomatis, ambilPantauan, ambilRingkas,
  cekBanyak, matikanPantauan, setelJamKabar, setelKabarOtomatis, tambahPantauan, MAKS_SLOT_CEK_BANYAK,
  type BarisCekBanyak, type DaftarPantauan, type HasilCekBanyak, type JawabanSaya, type KabarOtomatis, type Ringkas, mintaTautanTelegram,
  keluarAkun,
} from '../data/saya';
import { tokenPerangkat } from '../data/push';
import { bacaSesi, dengarSesi, sambungkan, sesiSekarang, type Sesi } from '../data/sesi';
import { useMuat, type Hasil, type Jenis } from '../data/muat';
import { volumeRingkas } from '../data/tampil';
/* Harga diturunkan dari satu tempat — lihat `periksa-harga.mjs`. Layar ini
   sempat mengetiknya sendiri di TIGA baris, dan ketiganya salah. */
import { PAKET_PLUS, hargaPlus, rupiah, terbukaSekarang, TOKO_PLAY } from '../data/amplus';
import { KALIMAT_JAM_SUNYI, bacaJendela, bacaPilihanJam, labelKirim, labelSunyi, samaJendela, tanpaSunyi } from '../data/jamSunyi';
import { labelStatus, statusTampil, layarAjakanPlus } from '../data/statusPlus';
import { useSisaBilah, useTinggiKepala } from '../gaya/jarak';
import { Ikon } from '../komponen/Ikon';
import { LambangPasar } from '../komponen/LambangPasar';
import { FormulirSambung, BOT } from '../komponen/FormulirSambung';
import { Latar } from '../komponen/Latar';
import { Tekan } from '../komponen/Tekan';
import {
  BarIsi, BarisPakai, Blok, Butir, Chip, Langkah, Lbl, Menu, Mikro, Nil, PitaBasi, Radio, Rangka, Saklar, Tombol,
} from '../komponen/mockup';
import { W, H, R, SENTUH, TALANG } from '../gaya/token';


function Wadah({ children }: { children: React.ReactNode }) {
  const tinggiKepala = useTinggiKepala();
  const sisaBilah = useSisaBilah();
  return (
    /* `keyboardShouldPersistTaps="handled"`: tanpa ini, di HP ketukan PERTAMA
       pada tombol saat keyboard terbuka cuma menutup keyboardnya — tombolnya
       baru menjawab di ketukan kedua. Di web tidak pernah terlihat, karena
       tidak ada keyboard yang menutupi. Pemilik melaporkannya sebagai
       "tombol tidak berfungsi", dan itu memang persis rasanya. */
    <Latar kuat="redup">
      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        contentContainerStyle={{ flexGrow: 1, paddingTop: tinggiKepala + 10, paddingBottom: sisaBilah, paddingHorizontal: TALANG, gap: 8 }}>
        {children}
      </ScrollView>
    </Latar>
  );
}

/** Kait sesi — satu sumber, dan layar ikut berubah saat sesi datang atau mati. */
export function useSesi(): Sesi | null {
  const [s, set] = useState<Sesi | null>(() => sesiSekarang());
  useEffect(() => {
    void bacaSesi().then(set);
    return dengarSesi(set);
  }, []);
  return s;
}

/** Blok "belum tersambung" yang sama di tiap layar akun. Satu bentuk, satu kalimat. */
function PerluSesi({ apa, buka }: { apa: string; buka: () => void }) {
  return (
    <Blok emas rapat gaya={{ paddingHorizontal: 10 }}>
      <View style={[g.rata, { gap: 8 }]}>
        <View style={{ flex: 1 }}>
          <Text style={g.pilihJudul}>{apa} ada di akunmu</Text>
          <Lbl polos>Sambungkan sekali, dan datanya muncul di sini.</Lbl>
        </View>
        <Chip teks="Sambungkan" emas onPress={buka} />
      </View>
    </Blok>
  );
}

/**
 * Muat satu rute `/api/saya/*` yang butuh sesi.
 *
 * Enam layar akun dulu menulis pola yang sama persis — `if (j.ok) setD(j.isi)`
 * — dan keenamnya membuang `kalimat` yang sudah susah payah dipisahkan
 * `saya.ts`. Akibatnya bukan galat: layarnya terisi "—" di setiap sel sambil
 * tetap berkata "Tersambung", dan tidak ada satu pun cara bagi pemegang HP
 * untuk tahu apakah ia memang belum punya apa-apa atau datanya tidak sampai.
 *
 * 401 BUKAN urusan di sini dan sengaja tidak ditangani ulang: `saya.ts`
 * menghapus sesinya, `umumkan(null)` membalik seluruh app ke "belum
 * tersambung", dan `PerluSesi` muncul sendiri di tiap layar ini.
 */
function useAkun<T>(ambil: () => Promise<JawabanSaya<T>>, sesi: Sesi | null): {
  isi: T | null; sebab: string | null; gagal: boolean; jenis: Jenis | null; ulangi: () => void;
} {
  const bungkus = useCallback(async (): Promise<Hasil<T | null>> => {
    if (sesi === null) return { ok: true, isi: null };
    return ambil();
    /* `ambil` sengaja di luar daftar: `useMuat` menyimpannya di ref, dan yang
       menentukan kapan memuat ulang adalah kuncinya. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sesi]);
  const { keadaan, ulangi } = useMuat(bungkus, sesi === null ? 'kosong' : 'ada');
  return {
    isi: keadaan.fase === 'ada' ? keadaan.isi : null,
    sebab: keadaan.fase === 'gagal' ? keadaan.kalimat
      : keadaan.fase === 'ada' ? keadaan.basi : null,
    /* `isi === null` punya DUA arti — masih memuat, atau gagal — dan layar
       yang cuma melihat null menggambar rangka selamanya untuk yang kedua.
       Terlihat 19 Sep: akun Google membuka Kabar otomatis, server menjawab
       409 perlu-telegram, pita sebabnya tampil, dan blok timeframe tetap
       berkedip seolah sedang memuat. */
    gagal: keadaan.fase === 'gagal',
    /* JENISNYA ikut, bukan cuma kalimatnya: layar berbayar perlu membedakan
       "butuh AM+" (ajakan) dari "jaringan putus" (galat). Mencocokkan teks
       kalimatnya adalah cara yang pecah begitu kalimat server diubah. */
    jenis: keadaan.fase === 'gagal' ? keadaan.jenis : null,
    ulangi,
  };
}

/**
 * KARTU BUTUH AM+ — pengganti isi layar berbayar untuk akun gratis.
 *
 * Audit 20 Sep: Kabar otomatis untuk akun gratis menampilkan "Tidak
 * terbaca", jam sunyi "—", dan "Daftarnya tidak bisa dimuat, Coba lagi".
 * Semuanya benar secara teknis (server menjawab 402), tapi bagi yang
 * belum berlangganan itu terbaca sebagai app rusak, bukan fitur berbayar.
 * Yang ditampilkan sekarang: apa yang dibuka fitur ini, harganya dari satu
 * sumber, dan satu tombol ke tab PLUS+. Tanpa "Coba lagi" — mengulang
 * permintaan tidak akan mengubah jawabannya.
 */
function KartuButuhPlus({ apa, manfaat, bukaPlus }: { apa: string; manfaat: string[]; bukaPlus: () => void }) {
  return (
    <Blok emas>
      <Text style={g.cap}>AnalisMarket+</Text>
      <Text style={[g.pilihJudul, { marginTop: 4 }]}>{apa} bagian dari AnalisMarket+</Text>
      <View style={{ marginTop: 8, gap: 5 }}>
        {manfaat.map((m) => (
          <View key={m} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <Text style={{ color: W.plusTeks, fontSize: H.nilai, lineHeight: 18 }}>✓</Text>
            <Text style={[g.ket, { flex: 1 }]}>{m}</Text>
          </View>
        ))}
      </View>
      {hargaPlus() !== null && <Text style={[g.harga, { marginTop: 10 }]}>{hargaPlus()?.harga} <Text style={g.dari}>/ {hargaPlus()?.hari} hari</Text></Text>}
      <View style={{ marginTop: 10 }}><Tombol teks="Lihat AnalisMarket+" jenis="emas" onPress={bukaPlus} /></View>
      {!TOKO_PLAY && <Mikro>Langganan dibeli lewat bot Telegram. App ini tidak memproses pembayaran.</Mikro>}
    </Blok>
  );
}

const SATU_BULAN = PAKET_PLUS[0] as { kode: string; bulan: number; hargaRp: number };

/* ══ 21 · SAMBUNGKAN TELEGRAM ═══════════════════════════════════════════ */
export function LayarSambung() {
  const sesi = useSesi();
  const { isi: r, ulangi } = useAkun(ambilRingkas, sesi);
  const [galatTaut, setGalatTaut] = useState<string | null>(null);
  const [sibukTaut, setSibukTaut] = useState(false);
  /* Keluar mencabut HP ini sebagai penerima kabar dulu — lihat `keluarAkun`. */
  const [sibukKeluar, setSibukKeluar] = useState(false);
  const [galatKeluar, setGalatKeluar] = useState<string | null>(null);
  async function keluar(): Promise<void> {
    setSibukKeluar(true); setGalatKeluar(null);
    try {
      const h = await keluarAkun(tokenPerangkat);
      if (h.perangkat === 'gagal') setGalatKeluar(`Notifikasi HP ini belum dicabut: ${h.kalimat ?? 'server tidak menjawab'}`);
    } finally { setSibukKeluar(false); }
  }

  /* Kembali dari Telegram → baca ulang: bot mungkin sudah menautkan. */
  useEffect(() => {
    const l = AppState.addEventListener('change', (st) => { if (st === 'active') ulangi(); });
    return () => { l.remove(); };
  }, [ulangi]);

  async function tautkan(): Promise<void> {
    setSibukTaut(true); setGalatTaut(null);
    try {
      const j = await mintaTautanTelegram();
      if (!j.ok) { setGalatTaut(j.kalimat); return; }
      /* Tautan t.me datang dari SERVER, bukan diketik di sini — penjaga
         tautan-keluar memeriksa literal di sumber, dan ini bukan tautan ke
         harga web. Membuka Telegram adalah satu-satunya cara bot bisa menautkan. */
      await Linking.openURL(j.isi.tautan);
    } catch {
      setGalatTaut('Telegram tidak bisa dibuka di HP ini.');
    } finally { setSibukTaut(false); }
  }

  if (sesi !== null) {
    const tersambung = r?.telegramTersambung === true || sesi.jenis === 'mini';
    /* Status dari /api/saya, bukan dari sesi: sesi Google tidak tahu apa-apa
       soal langganan, dan dulu tercetak "Gratis" untuk pelanggan. */
    const status = statusTampil(sesi, r?.langganan ?? null);
    return (
      <Wadah>
        <Blok gaya={{ alignItems: 'center', paddingVertical: 16 }}>
          <Ikon nama="profil" warna={W.naik} ukuran={28} />
          <Text style={g.judulTengah}>{sesi.jenis === 'clerk' ? 'Masuk dengan Google' : 'Tersambung lewat Telegram'}</Text>
          <Text style={g.ketTengah}>
            {sesi.akun.nama ?? (sesi.jenis === 'clerk' ? 'Akun Google' : 'Akun Telegram')}{status === null ? '' : ` · ${labelStatus(status)}`}
          </Text>
        </Blok>

        {/* TAUTKAN, bukan ganti sesi. Sebelumnya layar ini menawarkan formulir
            "tempel tautan dari bot" kepada akun Google — yang menukar token jadi
            SESI BARU, jadi Google-nya terasa dipaksa lepas. Sekarang arahnya
            dibalik: app meminta tautan, bot yang menautkan ke akun ini. */}
        <Blok emas={!tersambung}>
          <Lbl>Telegram</Lbl>
          {tersambung ? (
            <Text style={[g.centangTeks, { marginTop: 6 }]}>Tersambung. Kabar juga bisa lewat Telegram saat HP tidak terdaftar.</Text>
          ) : (
            <>
              <Text style={[g.centangTeks, { marginTop: 6 }]}>Opsional. Kabar sudah jalan lewat notifikasi HP; Telegram jadi cadangan dan pintu ke bot.</Text>
              <View style={{ marginTop: 10 }}>
                <Tombol teks={sibukTaut ? 'Menyiapkan…' : 'Buka Telegram untuk menautkan'} jenis="emas" mati={sibukTaut} onPress={() => { void tautkan(); }} />
              </View>
              {galatTaut !== null && <Mikro>{galatTaut}</Mikro>}
              <Mikro>Telegram terbuka di bot @analismarketbot, tekan Start — selesai. Kembali ke app, statusnya ikut berubah.</Mikro>
            </>
          )}
        </Blok>

        <Blok gaya={{ flex: 1 }}>
          <Lbl>Yang terbuka sekarang</Lbl>
          <View style={{ marginTop: 8, gap: 8 }}>
            {terbukaSekarang(status).map(([j, k]) => (
              <View key={j} style={g.centangBaris}>
                <Text style={[g.centang, { color: W.naik }]}>✓</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[g.centangTeks, { color: W.teksKuat, fontWeight: '600' }]}>{j}</Text>
                  <Text style={g.centangTeks}>{k}</Text>
                </View>
              </View>
            ))}
          </View>
        </Blok>
        <Tombol teks={sibukKeluar ? 'Keluar…' : sesi.jenis === 'clerk' ? 'Keluar dari akun Google' : 'Putuskan sambungan'} jenis="kedua"
          mati={sibukKeluar} onPress={() => { void keluar(); }} />
        {galatKeluar !== null && <Mikro tengah>{galatKeluar}</Mikro>}
        {sesi.jenis === 'mini' && <Mikro tengah>Sesi berlaku 12 jam, lalu perlu disambung ulang lewat bot.</Mikro>}
      </Wadah>
    );
  }

  return (
    <Wadah>
      <Blok gaya={{ alignItems: 'center', paddingVertical: 14 }}>
        <Ikon nama="kabar" warna={W.plus} ukuran={28} />
        <Text style={g.judulTengah}>Tiga langkah, sekali saja</Text>
        <Text style={g.ketTengah}>Identitasmu datang dari bot Telegram. Tidak ada formulir, tidak ada kata sandi.</Text>
      </Blok>
      <FormulirSambung />
      <View style={{ flex: 1 }} />
      <Mikro>Tautannya ditempel di sini — tidak perlu berpindah app.</Mikro>
    </Wadah>
  );
}

/* ══ 22 · PANTAUAN ══════════════════════════════════════════════════════ */
export function LayarPantauan({ bukaSambung, bukaBaru, pasar, tf }: {
  bukaSambung: () => void; bukaBaru: () => void; pasar: string; tf: string;
}) {
  const sesi = useSesi();
  const [mesin, setMesin] = useState<Mesin[] | null>(null);
  const [ramai, setRamai] = useState<Pasar[]>([]);
  const [sibuk, setSibuk] = useState('');

  const { isi: punya, sebab, ulangi: muat } = useAkun(ambilPantauan, sesi);

  const [sebabPasar, setSebabPasar] = useState<string | null>(null);
  useEffect(() => {
    void ambilBacaan(pasar, tf).then((b) => {
      if (!b.ok) { setSebabPasar(b.kalimat); setMesin([]); return; }
      setMesin(b.isi.mesin);
    });
    void ambilPasar().then((j) => {
      if (!j.ok) { setSebabPasar(j.kalimat); return; }
      setSebabPasar(null);
      setRamai([...j.isi.pasar].filter((x) => x.simbol !== pasar)
        .sort((a, b) => b.volume24hUsd - a.volume24hUsd).slice(0, 8));
    });
  }, [pasar, tf]);

  /* KALIMAT SERVER TIDAK DIBUANG. `.then(() => muat())` dulu menelan setiap
     penolakan — 409 "sudah aktif dengan SNR", 400 "timeframe tidak tersedia",
     batas penuh — jadi chip "+ pantau" berputar sebentar lalu diam, dan
     orangnya tidak pernah tahu pantauannya tidak terpasang. */
  const [galatTulis, setGalatTulis] = useState<string | null>(null);
  const pasang = (p: string, t: string, kode: string | undefined): void => {
    const kunci = `${p}${t}${kode ?? ''}`;
    setSibuk(kunci); setGalatTulis(null);
    void tambahPantauan({ pair: p, tf: t, mesin: kode }).then((j) => {
      setSibuk('');
      if (!j.ok) setGalatTulis(j.kalimat);
      muat();
    });
  };
  const matikan = (id: number): void => {
    setGalatTulis(null);
    void matikanPantauan(id).then((j) => {
      if (!j.ok) setGalatTulis(j.kalimat);
      muat();
    });
  };

  /**
   * SARINGAN DITURUNKAN DARI DATA, BUKAN DARI ANGAN-ANGAN.
   *
   * Baris ini dulu berbunyi "Aktif · Menunggu · Selesai" — tiga chip yang
   * tidak menyaring apa pun DAN menjanjikan dua keadaan yang tidak ada di
   * data: `pantauan[]` cuma punya `aktif: boolean`. Chip yang terlihat bisa
   * ditekan tapi diam membuat orang mengira app-nya rusak; chip yang
   * menjanjikan keadaan yang tidak ada membuatnya mencari sesuatu yang tidak
   * akan pernah ketemu.
   */
  const [saring, setSaring] = useState<'aktif' | 'mati'>('aktif');
  const semua = punya?.pantauan ?? [];
  const aktif = semua.filter((x) => x.aktif);
  const mati = semua.filter((x) => !x.aktif);
  const terlihat = saring === 'aktif' ? aktif : mati;

  /* KEADAAN SEKARANG per pantauan aktif — lihat `keadaanPantauan.ts`. Satu
     bacaan per pasangan (pair, tf), lewat antrean bersimpanan; kegagalan
     dicetak di barisnya, bukan disamarkan jadi baris tanpa keadaan. */
  const [bacaanPantau, setBacaanPantau] = useState<Record<string, Jawaban<Bacaan>>>({});
  const kunciPasangan = [...new Set(aktif.filter((w) => bolehDibacaOtomatis(w.pair, w.tf)).map((w) => `${w.pair}|${w.tf.toLowerCase()}`))].join(',');
  useEffect(() => {
    if (kunciPasangan === '') return undefined;
    let hidup = true;
    for (const k of kunciPasangan.split(',')) {
      const [pair = '', t = ''] = k.split('|');
      void ambilBacaan(pair, t).then((j) => { if (hidup) setBacaanPantau((x) => ({ ...x, [k]: j })); });
    }
    return () => { hidup = false; };
  }, [kunciPasangan]);
  const barisKeadaan = (pair: string, t: string, kode: string | null): { teks: string; warna: string | null } => {
    if (!bolehDibacaOtomatis(pair, t)) return { teks: 'm1/m5 emas & forex tidak dibaca otomatis — memakai jatah harian', warna: null };
    const j = bacaanPantau[`${pair}|${t.toLowerCase()}`];
    if (j === undefined) return { teks: 'Membaca keadaan…', warna: null };
    if (!j.ok) return { teks: j.kalimat, warna: null };
    const k = keadaanPantauan(j.isi, kode);
    if (k === null) return { teks: 'Mesin ini tidak ada lagi di bacaan', warna: null };
    return {
      teks: `${k.label}${kode === null ? ` · ${k.mesin}` : ''} · ${String(k.lolos)} dari ${String(k.wajib)} syarat wajib`,
      warna: k.label === 'Setup' ? W.naik : k.label === 'Pantau' ? W.teksKuat : W.teksSamar,
    };
  };

  return (
    <Wadah>
      {(sebab ?? sebabPasar) !== null && <PitaBasi kalimat={(sebab ?? sebabPasar) ?? ''} />}
      {galatTulis !== null && <Text style={g.galat}>{galatTulis}</Text>}
      <View style={g.chips}>
        <Chip teks={`Aktif ${String(aktif.length)}`} on={saring === 'aktif'} onPress={() => { setSaring('aktif'); }} />
        <Chip teks={`Dimatikan ${String(mati.length)}`} on={saring === 'mati'} onPress={() => { setSaring('mati'); }} />
      </View>

      {sesi === null
        ? <PerluSesi apa="Pantauan" buka={bukaSambung} />
        : (
          <Blok>
            <View style={[g.baris, { gap: 14 }]}>
              <Cincin persen={punya === null || punya.maks <= 0 ? 0 : (aktif.length / punya.maks) * 100} ukuran={60} tebal={4.5}>
                <Text style={g.cincinTeks}>{punya === null ? '—' : `${String(aktif.length)}/${String(punya.maks)}`}</Text>
              </Cincin>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={g.heroJudul}>{punya === null ? 'Pantauan' : `${String(aktif.length)} pantauan aktif`}</Text>
                <Text style={g.heroKet}>Batas {punya?.maks ?? '—'} pantauan · dikabari saat syarat wajib lolos semua</Text>
              </View>
              <Chip teks="+ Baru" emas onPress={bukaBaru} />
            </View>
          </Blok>
        )}

      {sesi !== null && terlihat.length > 0 && (
        <Blok>
          <Lbl>{saring === 'aktif' ? 'Sedang dipantau' : 'Sudah dimatikan'}</Lbl>
          {terlihat.map((w, i) => {
            const k = w.aktif ? barisKeadaan(w.pair, w.tf, w.strategiKode) : null;
            return (
              <View key={w.id} style={[g.pantau, i > 0 && g.garis]}>
                <LambangPasar simbol={w.pair} ukuran={28} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={g.pilihJudul} numberOfLines={1}>
                    {w.pair} <Text style={{ color: W.teksRedup, fontWeight: '400' }}>{w.tf.toLowerCase()}</Text>
                    {w.strategiKode !== null && ` · ${w.strategiKode}`}
                  </Text>
                  {k === null ? <Lbl polos>Sudah dimatikan</Lbl> : (
                    <View style={g.keadaan}>
                      {k.warna !== null && <View style={[g.titikKeadaan, { backgroundColor: k.warna }]} />}
                      <Text style={g.keadaanTeks} numberOfLines={2}>{k.teks}</Text>
                    </View>
                  )}
                </View>
                {w.aktif && <Chip teks="matikan" onPress={() => { matikan(w.id); }} />}
              </View>
            );
          })}
        </Blok>
      )}

      {sesi !== null && punya !== null && terlihat.length === 0 && (
        <Blok rapat gaya={{ paddingHorizontal: 10 }}>
          <Lbl polos>{saring === 'aktif' ? 'Belum ada pantauan aktif.' : 'Belum ada pantauan yang dimatikan.'}</Lbl>
        </Blok>
      )}

      <Blok gaya={{ flex: 1 }}>
        <View style={g.rata}>
          <Lbl>Bisa dipantau sekarang · {pasar} {tf.toLowerCase()}</Lbl>
          <Chip teks="+ Baru" onPress={bukaBaru} />
        </View>
        {mesin === null && [0, 1, 2].map((i) => (
          <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 10 }}>
            <Rangka lebar={22} tinggi={22} gaya={{ borderRadius: 11 }} /><Rangka lebar="55%" tinggi={10} />
          </View>
        ))}
        {mesin?.map((m, i) => {
          const w = syaratWajib(m); const lolos = w.filter((c) => c.lolos).length;
          const setup = m.status.toUpperCase() === 'SETUP';
          const sudah = aktif.some((x) => x.pair === pasar && x.tf.toLowerCase() === tf.toLowerCase() && x.strategiKode === m.mesin);
          const kunci = `${pasar}${tf}${m.mesin}`;
          return (
            <View key={m.mesin} style={[g.pantau, i > 0 && g.garis]}>
              <LambangPasar simbol={pasar} ukuran={22} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={g.pilihJudul} numberOfLines={1}>
                  {pasar} <Text style={{ color: W.teksRedup, fontWeight: '400' }}>{tf.toLowerCase()}</Text> · {m.mesin}
                </Text>
                <Lbl polos>{lolos} dari {w.length} syarat wajib lolos</Lbl>
              </View>
              {sesi === null
                ? <Chip teks={`${String(lolos)}/${String(w.length)}`} mono emas={setup} onPress={bukaSambung} />
                : sudah
                  ? <Chip teks="dipantau" on lencana />
                  : <Chip teks={sibuk === kunci ? '…' : '+ pantau'} onPress={() => { pasang(pasar, tf, m.mesin); }} />}
            </View>
          );
        })}

        {ramai.length > 0 && (
          <>
            <Lbl gaya={{ marginTop: 12 }}>Pasar lain yang ramai hari ini</Lbl>
            {ramai.map((x, i) => (
              <View key={x.simbol} style={[g.pantau, i > 0 && g.garis]}>
                <LambangPasar simbol={x.simbol} ukuran={22} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={g.pilihJudul} numberOfLines={1}>
                    {x.simbol} <Text style={{ color: W.teksRedup, fontWeight: '400' }}>{tf.toLowerCase()}</Text>
                  </Text>
                  <Lbl polos>{x.label} · vol {volumeRingkas(x.volume24hUsd)}</Lbl>
                </View>
                <Chip
                  teks={sibuk === `${x.simbol}${tf}` ? '…' : '+ pantau'}
                  onPress={() => { if (sesi === null) bukaSambung(); else pasang(x.simbol, tf, undefined); }}
                />
              </View>
            ))}
          </>
        )}
      </Blok>
    </Wadah>
  );
}

/* ══ 23 · PANTAUAN BARU ═════════════════════════════════════════════════ */
export function LayarPantauanBaru({ pasar, tf, mesin, bukaSambung, selesai }: {
  pasar: string; tf: string; mesin: string; bukaSambung: () => void; selesai: () => void;
}) {
  const sesi = useSesi();
  const [pilihan, setPilihan] = useState(0);
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState('');

  const simpan = (): void => {
    if (sesi === null) { bukaSambung(); return; }
    setSibuk(true); setGalat('');
    void tambahPantauan({ pair: pasar, tf, mesin }).then((j) => {
      setSibuk(false);
      if (j.ok) { selesai(); return; }
      setGalat(j.kalimat);
    });
  };

  /* Keadaan pasangan ini SEKARANG — bacaan yang sama dengan layar Pasar
     (antrean bersimpanan). m1/m5 emas & forex dilewati: jatah harian. */
  const bisaBaca = bolehDibacaOtomatis(pasar, tf);
  const [bacaan, setBacaan] = useState<Jawaban<Bacaan> | null>(null);
  useEffect(() => {
    if (!bisaBaca) return undefined;
    let hidup = true;
    void ambilBacaan(pasar, tf).then((j) => { if (hidup) setBacaan(j); });
    return () => { hidup = false; };
  }, [pasar, tf, bisaBaca]);
  const kd = bacaan !== null && bacaan.ok ? keadaanPantauan(bacaan.isi, mesin === '' ? null : mesin) : null;
  const sebabBaca = bacaan !== null && !bacaan.ok ? bacaan.kalimat : null;
  const contoh = contohKabarPush(pasar, tf, mesin !== '' ? mesin : kd?.mesin ?? 'mesin yang lolos');

  return (
    <Wadah>
      <Lbl>Pasar &amp; timeframe</Lbl>
      <Menu>
        <Butir simbol={pasar} nama={pasar} ket="dari layar Pasar" pertama />
        <Butir ikon="kalender" nama="Timeframe" ket={tf.toLowerCase()} ketMono />
        <Butir ikon="analisis" nama="Mesin" ket={mesin === '' ? 'otomatis' : mesin} ketMono />
      </Menu>
      <Mikro>Ganti pasar, timeframe, atau mesin di layar Pasar, lalu kembali ke sini.</Mikro>

      {bisaBaca && (
        <Blok>
          <View style={g.rata}>
            <Lbl>Keadaan sekarang</Lbl>
            {kd !== null && (
              <Text style={[g.keadaanKanan, { color: kd.label === 'Setup' ? W.naik : kd.label === 'Pantau' ? W.teksKuat : W.teksSamar }]}>
                {kd.label} · {String(kd.lolos)}/{String(kd.wajib)}
              </Text>
            )}
          </View>
          <Text style={g.ket}>
            {bacaan === null ? 'Membaca keadaan…'
              : sebabBaca !== null ? sebabBaca
                : kd === null ? 'Mesin ini tidak ada di bacaan terbaru.'
                  : `${String(kd.lolos)} dari ${String(kd.wajib)} syarat wajib ${kd.mesin} lolos di bacaan terbaru ${pasar} ${tf.toLowerCase()}.`}
          </Text>
        </Blok>
      )}

      <Lbl gaya={{ marginTop: 6 }}>Kabari saya saat</Lbl>
      <Menu>
        {[
          ['Syarat wajib lolos semua', 'Kartunya berubah jadi SETUP'],
          ['Entry tersentuh', 'Harga mencapai level entry'],
          ['TP atau SL tersentuh', 'Posisi berjalan selesai'],
        ].map(([j, k], i) => (
          <View key={j} style={[g.pilih, i > 0 && g.garis]}>
            <Radio on={pilihan === i} />
            <View style={{ flex: 1 }}>
              <Text style={g.pilihJudul} onPress={() => { setPilihan(i); }}>{j}</Text>
              <Lbl polos>{k}</Lbl>
            </View>
          </View>
        ))}
      </Menu>
      {pilihan !== 0 && (
        <Mikro>Bot saat ini mengabari saat syarat lolos. Dua pemicu lain menyusul; pantauan tetap tersimpan.</Mikro>
      )}

      <Lbl gaya={{ marginTop: 6 }}>Contoh kabar di layar kunci</Lbl>
      <View style={g.notif}>
        <Image source={MARK} style={g.notifLogo} accessibilityIgnoresInvertColors />
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={g.rata}>
            <Text style={g.notifApp}>AnalisMarket</Text>
            <Text style={g.notifWaktu}>sekarang</Text>
          </View>
          <Text style={g.notifJudul} numberOfLines={1}>{contoh.judul}</Text>
          <Text style={g.notifIsi}>{contoh.isi}</Text>
        </View>
      </View>
      <Mikro>Arah, entry, SL, dan TP tidak ikut di notifikasi — dibaca di app, segar.</Mikro>

      <View style={{ flex: 1 }} />
      {galat !== '' && <Text style={g.galat}>{galat}</Text>}
      <Tombol
        teks={sesi === null ? 'Masuk untuk menyimpan' : sibuk ? 'Menyimpan…' : 'Simpan pantauan'}
        mati={sibuk}
        onPress={sesi === null ? bukaSambung : simpan}
      />
    </Wadah>
  );
}

/* ══ 24 · KABAR OTOMATIS ════════════════════════════════════════════════ */
export function LayarKabarOtomatis({ bukaSambung, bukaPlus }: { bukaSambung: () => void; bukaPlus: () => void }) {
  const sesi = useSesi();
  const { isi: d, sebab, gagal, jenis, ulangi: muat } = useAkun(ambilKabarOtomatis, sesi);
  const [sibuk, setSibuk] = useState('');
  /* Penolakan server dicetak, bukan ditelan — lihat `galatTulis` di Pantauan. */
  const [galatTulis, setGalatTulis] = useState<string | null>(null);
  const tulis = (janji: Promise<JawabanSaya<unknown>>, kunci = ''): void => {
    setSibuk(kunci); setGalatTulis(null);
    void janji.then((j) => {
      setSibuk('');
      if (!j.ok) setGalatTulis(j.kalimat);
      muat();
    });
  };
  /* Jendela KIRIM dari server, dibaca gagal-tertutup — lihat `jamSunyi.ts`. */
  const jendela = d === null ? null : bacaJendela(d.jam);
  const pilihanJam = d === null ? [] : bacaPilihanJam(d.pilihanJam);

  /* Akun gratis: ajakan, bukan rangka yang gagal dimuat dan bukan layar penuh
     dengan saklar mati. Server menjawab 200 `{ plus: false }` (bukan 402) —
     `layarAjakanPlus` menerima kedua bentuk. */
  if (sesi !== null && layarAjakanPlus(jenis, d)) {
    return (
      <Wadah>
        <KartuButuhPlus apa="Kabar otomatis" bukaPlus={bukaPlus} manfaat={[
          'Pasar dipantau sendiri di timeframe dan mesin pilihanmu, tanpa dipasang satu-satu',
          'Jam sunyi: pilih jam kabar otomatis berhenti dikirim',
          'Kabar ke HP ini lewat notifikasi; Telegram jadi cadangan',
        ]} />
        <View style={{ flex: 1 }} />
      </Wadah>
    );
  }

  return (
    <Wadah>
      {sebab !== null && <PitaBasi kalimat={sebab} />}
      {galatTulis !== null && <Text style={g.galat}>{galatTulis}</Text>}
      {sesi === null && <PerluSesi apa="Kabar otomatis" buka={bukaSambung} />}

      <Blok>
        <View style={g.rata}>
          <View style={{ flex: 1 }}>
            <Text style={g.pilihJudul}>Kabar otomatis</Text>
            <Lbl polos>{d === null ? 'Pantauan berjalan tanpa membuka app' : d.plus ? 'Aktif lewat AnalisMarket+' : 'Butuh AnalisMarket+'}</Lbl>
          </View>
          {/* BUKAN SAKLAR.
              Dulu di sini ada saklar yang tidak tersambung ke apa pun, dan ia
              berbohong dua kali: ia tidak melakukan apa-apa saat ditekan, DAN
              ia menggambarkan status langganan sebagai sesuatu yang bisa
              dinyalakan dari layar ini. Server pun tidak punya "nyalakan
              semua" — yang ada cuma `{ semua: false }`. Jadi statusnya
              dicetak sebagai lencana, dan mematikan semua jadi tindakan yang
              disebut namanya. */}
          {d !== null && d.dipilih.length > 0
            ? <Chip teks="Matikan semua" onPress={() => { tulis(setelKabarOtomatis({ semua: false })); }} />
            : <Chip teks={d === null ? (gagal ? 'Tidak terbaca' : 'Memuat…') : d.plus ? 'AM+ aktif' : 'Butuh AM+'} emas={d?.plus === true} lencana />}
        </View>
      </Blok>

      {/* JENDELA KIRIM, BUKAN JAM DIAM. Baris lama "Mulai 5.00 · Selesai
          23.00" di bawah judul "Jam sunyi" membaca jendela kirim sebagai jam
          diam — yang sebenarnya sunyi justru 00.00–05.00. Dua-duanya ditulis
          terang sekarang, dengan rumus yang sama dengan bot. */}
      <Lbl>Jam sunyi</Lbl>
      <Menu>
        <Butir ikon="kirim" nama="Kabar dikirim" ket={jendela === null ? '—' : `${labelKirim(jendela)} WIB`} ketMono pertama />
        <Butir ikon="bulan" nama="Sunyi" ket={jendela === null ? '—' : tanpaSunyi(jendela) ? 'tidak ada' : `${labelSunyi(jendela)} WIB`} ketMono />
      </Menu>
      {pilihanJam.length > 0 && (
        <View style={[g.chips, { flexWrap: 'wrap' }]}>
          {pilihanJam.map((j) => (
            <Chip key={`${String(j.mulai)}-${String(j.selesai)}`} teks={labelSunyi(j)} mono
              on={jendela !== null && samaJendela(j, jendela)}
              onPress={() => { tulis(setelJamKabar(j.mulai, j.selesai)); }} />
          ))}
        </View>
      )}
      <Mikro>{KALIMAT_JAM_SUNYI}</Mikro>

      <Lbl gaya={{ marginTop: 2 }}>Timeframe yang dipantau otomatis</Lbl>
      {d === null ? (
        gagal
          ? <Blok><View style={g.rata}><Lbl polos>Daftarnya tidak bisa dimuat — sebabnya di atas.</Lbl><Chip teks="Coba lagi" onPress={muat} /></View></Blok>
          : <Blok><Rangka lebar="60%" tinggi={10} /><Rangka lebar="45%" tinggi={10} gaya={{ marginTop: 8 }} /></Blok>
      ) : (
        <Menu>
          {/* SATU BARIS PER PASANGAN (timeframe, mesin) — bukan per timeframe.
              Yang disimpan server memang pasangan, dan `setelKabarOtomatis`
              menuntut ketiganya. Satu saklar per timeframe memaksa app
              memilihkan mesinnya sendiri, dan memilihkan diam-diam persis
              yang dilarang: orang yang memasang snr bisa berakhir dikabari
              oleh mesin lain tanpa pernah diberi tahu. */}
          {d.tfTersedia.flatMap((t) => t.mesin.map((m) => ({ tf: t.tf, ...m })))
            .map((x, i) => {
              const nyala = d.dipilih.some((y) => y.tf === x.tf && y.mesin === x.kode);
              const kunci = `${x.tf}:${x.kode}`;
              return (
                <Butir key={kunci} ikon="analisis" nama={`${x.tf.toLowerCase()} · ${x.kode}`}
                  sub={x.nama} pertama={i === 0}
                  kanan={(
                    <Saklar on={nyala}
                      /* Tanpa AM+ `ganti` sengaja TIDAK diberikan: `Saklar`
                         men-disable dirinya sendiri, jadi saklarnya tidak
                         bisa ditekan alih-alih ditekan lalu ditolak server. */
                      ganti={d.plus ? () => {
                        if (sibuk !== '') return;
                        tulis(setelKabarOtomatis({ tf: x.tf, mesin: x.kode, aktif: !nyala }), kunci);
                      } : undefined} />
                  )} />
              );
            })}
        </Menu>
      )}

      <View style={{ flex: 1 }} />
      {sesi === null && <Tombol teks="Masuk untuk mengaktifkan" onPress={bukaSambung} />}
    </Wadah>
  );
}


/* ══ 26 · CEK BANYAK PASAR ══════════════════════════════════════════════ */
export function LayarCekBanyak({ bukaSambung, bukaPlus, tf }: { bukaSambung: () => void; bukaPlus: () => void; tf: string }) {
  const sesi = useSesi();
  const [pilih, setPilih] = useState<string[]>([]);
  const [daftar, setDaftar] = useState<Pasar[]>([]);
  const [mesinSemua, setMesinSemua] = useState<string[]>([]);
  const [sibuk, setSibuk] = useState(false);
  const [hasil, setHasil] = useState<HasilCekBanyak | null>(null);
  const [galatJalan, setGalatJalan] = useState('');

  const [sebabPasar, setSebabPasar] = useState<string | null>(null);
  useEffect(() => {
    void ambilPasar().then((j) => {
      if (!j.ok) { setSebabPasar(j.kalimat); return; }
      setSebabPasar(null);
      const urut = [...j.isi.pasar].sort((a, b) => b.volume24hUsd - a.volume24hUsd);
      setDaftar(urut.slice(0, 12));
      setPilih(urut.slice(0, 4).map((x) => x.simbol));
    });
    /* Daftar mesin dari bacaan pasar bawaan — server menuntut kode mesin
       eksplisit, dan "semua" berarti kelima kode itu disebut satu-satu. */
    void ambilBacaan('BTCUSDT', 'h1').then((b) => {
      if (!b.ok) { setSebabPasar(b.kalimat); return; }
      setMesinSemua(b.isi.mesin.map((m) => m.mesin));
    });
  }, []);
  const { isi: ringkasCek, sebab } = useAkun(ambilRingkas, sesi);
  const plus: boolean | null = ringkasCek === null ? null : ringkasCek.langganan === 'plus';

  const alih = (s: string): void => {
    setPilih((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  };

  /* DULU `onPress={undefined}` untuk pelanggan AM+ yang sudah masuk — tombol
     yang terlihat hidup dan diam. Sekarang ia menjalankan pemeriksaannya di
     sini dan menampilkan tabelnya, seperti mockup 28. */
  const jalankan = async (): Promise<void> => {
    if (sibuk || pilih.length === 0) return;
    setSibuk(true); setGalatJalan(''); setHasil(null);
    const j = await cekBanyak(pilih, [tf], mesinSemua);
    setSibuk(false);
    if (!j.ok) { setGalatJalan(j.kalimat); return; }
    setHasil(j.isi);
  };

  /* Satu baris per pasar: yang IDEAL dulu, lalu yang terdekat ke entry. */
  const terbaik = (h: HasilCekBanyak): BarisCekBanyak[] => {
    const per = new Map<string, BarisCekBanyak[]>();
    for (const b of h.baris) per.set(b.pair, [...(per.get(b.pair) ?? []), b]);
    return [...per.entries()].map(([, rows]) => [...rows].sort((a, b) =>
      Number(b.ideal === true) - Number(a.ideal === true)
      || (a.jarakAtr ?? 99) - (b.jarakAtr ?? 99))[0] as BarisCekBanyak);
  };
  const statusBaris = (b: BarisCekBanyak): { teks: string; warna: string } => {
    if (b.sebab === 'pasar-tutup') return { teks: 'Pasar tutup', warna: W.teksSamar };
    if (b.sebab === 'kuota-habis') return { teks: 'Jatah habis', warna: W.turun };
    if (b.sebab !== undefined) return { teks: 'Tidak terbaca', warna: W.teksSamar };
    if (b.ideal === true) return { teks: 'Setup', warna: W.naik };
    if (b.ideal === false) return { teks: 'Pantau', warna: W.teksKuat };
    return { teks: 'Tidak dicetak', warna: W.teksSamar };
  };

  const slot = pilih.length; // satu timeframe
  const lewat = slot > MAKS_SLOT_CEK_BANYAK;
  const { width: lebarLayar } = useWindowDimensions();
  const lebarPetak = (lebarLayar - TALANG * 2 - 8) / 2;

  return (
    <Wadah>
      {(sebab ?? sebabPasar) !== null && <PitaBasi kalimat={(sebab ?? sebabPasar) ?? ''} />}
      {sesi === null && <PerluSesi apa="Cek banyak pasar" buka={bukaSambung} />}
      {sesi !== null && plus === false && (
        <KartuButuhPlus apa="Cek banyak pasar" bukaPlus={bukaPlus} manfaat={[
          `Sampai ${String(MAKS_SLOT_CEK_BANYAK)} pasar diperiksa sekaligus, kelima mesin, satu timeframe`,
          'Hasilnya satu tabel: pasar mana yang setup, mana yang masih pantau',
          'Dijalankan di server, jadi HP tidak perlu menunggu satu-satu',
        ]} />
      )}

      <Blok>
        <View style={g.rata}>
          <Lbl>Pasar dipilih</Lbl><Nil warna={lewat ? W.turun : undefined}>{String(slot)}{lewat ? ` / maks ${String(MAKS_SLOT_CEK_BANYAK)}` : ''}</Nil>
        </View>
        <View style={[g.chips, { flexWrap: 'wrap', marginTop: 6 }]}>
          {daftar.map((x) => (
            <Chip key={x.simbol} teks={x.simbol.replace('USDT', '')} on={pilih.includes(x.simbol)}
              onPress={() => { alih(x.simbol); }} />
          ))}
        </View>
      </Blok>

      <View style={g.baris}>
        <View style={{ flex: 1 }}><Lbl>Timeframe</Lbl><Nil gaya={{ marginTop: 2 }}>{tf.toLowerCase()}</Nil></View>
        <View style={{ flex: 1 }}><Lbl>Mesin</Lbl><Nil gaya={{ marginTop: 2 }}>semua {String(mesinSemua.length || 5)}</Nil></View>
        <View style={{ flex: 1 }}><Lbl>Slot</Lbl><Nil gaya={{ marginTop: 2 }}>{String(slot)} / {String(MAKS_SLOT_CEK_BANYAK)}</Nil></View>
      </View>

      {/* Kartu HASIL cuma setinggi isinya sebelum dijalankan. Audit 20 Sep:
          `flex: 1` membuatnya memenuhi layar dalam keadaan kosong, dan
          kartu kosong setinggi layar terbaca sebagai layar yang gagal. */}
      {hasil === null ? (
        <Blok>
          <Lbl>Hasil</Lbl>
          <Text style={g.ket}>
            {galatJalan !== '' ? galatJalan
              : `Menjalankan ${String(slot)} pasar sekaligus, kelima mesin, satu timeframe. Hasilnya tampil di sini.`}
          </Text>
        </Blok>
      ) : (() => {
        /* Satu petak per pasar (mesin terbaiknya). Bilah ringkas di atas
           menjawab "ada yang layak?" sebelum orang membaca satu per satu. */
        const per = terbaik(hasil);
        const nSetup = per.filter((b) => b.sebab === undefined && b.ideal === true).length;
        const nPantau = per.filter((b) => b.sebab === undefined && b.ideal === false).length;
        const nLain = per.length - nSetup - nPantau;
        return (
          <>
            <Blok rapat gaya={{ paddingHorizontal: 13 }}>
              <View style={g.bilahRingkas}>
                {nSetup > 0 && <View style={{ flex: nSetup, backgroundColor: W.naik }} />}
                {nPantau > 0 && <View style={{ flex: nPantau, backgroundColor: W.tinta(0.55) }} />}
                {nLain > 0 && <View style={{ flex: nLain, backgroundColor: W.tinta(0.16) }} />}
              </View>
              <View style={[g.rata, { marginTop: 9 }]}>
                <View style={[g.baris, { gap: 12 }]}>
                  <Text style={g.ringkasAngka}><Text style={{ color: W.naik }}>●</Text> {String(nSetup)} Setup</Text>
                  <Text style={g.ringkasAngka}><Text style={{ color: W.tinta(0.55) }}>●</Text> {String(nPantau)} Pantau</Text>
                  <Text style={g.ringkasAngka}><Text style={{ color: W.tinta(0.25) }}>●</Text> {String(nLain)} Lain</Text>
                </View>
                <Text style={g.ringkasWaktu}>{String(Math.round(hasil.msTotal / 100) / 10).replace('.', ',')} dtk</Text>
              </View>
            </Blok>
            <View style={g.papan}>
              {per.map((b) => {
                const st = statusBaris(b);
                const jarak = b.sebab === undefined ? b.jarakAtr : null;
                /* Meter = KEDEKATAN ke entry: penuh di level entry, kosong di 3 ATR
                   atau lebih (lewat 3 ATR entry-nya belum terjangkau — Istilah).
                   Bilah yang makin penuh makin jauh terbaca terbalik. */
                const porsi = jarak === null ? null : 1 - Math.min(1, Math.max(0, jarak / 3));
                return (
                  <View key={b.pair} style={[g.petak, { width: lebarPetak }, st.teks === 'Setup' && g.petakSetup]}>
                    <View style={g.baris}>
                      <LambangPasar simbol={b.pair} ukuran={20} />
                      <Text style={[g.pilihJudul, { flex: 1 }]} numberOfLines={1}>{b.pair.replace(/USDT$/, '')}</Text>
                      <Text style={g.petakMesin} numberOfLines={1}>{b.mesin}</Text>
                    </View>
                    <View style={[g.baris, { gap: 6, marginTop: 8 }]}>
                      <View style={[g.titikKeadaan, { backgroundColor: st.warna }]} />
                      <Text style={[g.petakStatus, { color: st.warna }]} numberOfLines={1}>{st.teks}</Text>
                    </View>
                    <View style={g.meter}>
                      {porsi !== null && <View style={[g.meterIsi, { width: `${Math.max(4, porsi * 100)}%`, backgroundColor: st.teks === 'Setup' ? W.naik : W.tinta(0.35) }]} />}
                    </View>
                    <Text style={g.petakKet} numberOfLines={2}>
                      {jarak === null ? (b.sebab === undefined ? 'jarak entry —' : st.teks)
                        : jarak < 0.05 ? 'di level entry' : `${jarak.toFixed(1).replace('.', ',')} ATR ke entry`}
                    </Text>
                  </View>
                );
              })}
            </View>
            <Lbl polos>{String(hasil.tarikan)} tarikan data · meter penuh = di level entry, kosong = 3 ATR atau lebih</Lbl>
          </>
        );
      })()}

      {hasil === null && <View style={{ flex: 1 }} />}
      <Tombol
        teks={sesi === null ? 'Masuk dulu' : plus === false ? 'Butuh AnalisMarket+' : sibuk ? 'Memeriksa…' : hasil === null ? 'Jalankan' : 'Jalankan lagi'}
        mati={plus === false || sibuk || lewat || (sesi !== null && slot === 0)}
        onPress={sesi === null ? bukaSambung : () => { void jalankan(); }}
      />
      <Mikro tengah>{lewat ? `Maksimum ${String(MAKS_SLOT_CEK_BANYAK)} pasar per pemeriksaan.` : 'Dijalankan di server, hasilnya tampil di sini.'}</Mikro>
    </Wadah>
  );
}

/* ══ 27 · BERLANGGANAN ══════════════════════════════════════════════════ */
export function LayarBerlangganan() {
  const sesi = useSesi();
  const { isi: r, sebab } = useAkun(ambilRingkas, sesi);
  /* Masa aktif untuk RINCIAN — pratinjau harga, bukan pesanan: pembayarannya
     di bot, dan di sana masa aktifnya dipilih lagi. Angkanya dari PAKET_PLUS
     (satu sumber, dijaga periksa-harga). */
  const [iPaket, setIPaket] = useState(0);
  const paket = PAKET_PLUS[iPaket] ?? SATU_BULAN;

  const aktif = r?.langganan === 'plus';
  /* Dari cap waktu server — lihat catatan di AmPlus.tsx. */
  const sampai = r !== null && aktif && r.plusBerakhirPada !== null
    ? new Date(r.plusBerakhirPada * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <Wadah>
      {sebab !== null && <PitaBasi kalimat={sebab} />}
      {/* BUILD PLAY: halaman ini menyusut jadi LAYAR STATUS. Harga, cara
          bayar, rincian, dan tombol menuju bot semuanya bentuk mengarahkan
          pembelian ke luar app — dilarang kebijakan pembayaran Play. Yang
          tersisa: apakah langganannya aktif, dan sampai kapan. */}
      {!TOKO_PLAY && (
        <View style={g.kartuEmas}>
          <Text style={g.cap}>AnalisMarket+</Text>
          <Text style={g.harga}>{hargaPlus()?.harga} <Text style={g.dari}>/ {hargaPlus()?.hari} hari</Text></Text>
          {/* SEKALI BAYAR. "Ditagih tiap 30 hari · berhenti kapan saja"
              menjanjikan langganan berulang yang tidak pernah ada — S&K app,
              web, dan bot sama-sama berkata tanpa potong otomatis. */}
          <Lbl polos gaya={{ marginTop: 3 }}>Sekali bayar · tanpa potong otomatis</Lbl>
        </View>
      )}

      <Blok>
        <Lbl>Keadaan akunmu</Lbl>
        <View style={[g.rata, { marginTop: 5 }]}>
          <Text style={g.pilihJudul}>{r === null ? '—' : aktif ? 'AnalisMarket+ aktif' : 'Paket gratis'}</Text>
          {r !== null && aktif && <Chip teks={`${String(r.sisaHariPlus)} hari lagi`} emas mono lencana />}
        </View>
        {sampai !== null && <Lbl polos>Berlaku sampai {sampai}</Lbl>}
        {r !== null && !aktif && r.plusBerakhirPada !== null && (
          <Lbl polos>Langgananmu berakhir {new Date(r.plusBerakhirPada * 1000).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}.</Lbl>
        )}
      </Blok>

      {!TOKO_PLAY && (
        <>
          <Lbl>Masa aktif</Lbl>
          <View style={g.paketBaris}>
            {PAKET_PLUS.map((pk, i) => {
              const hemat = Math.round((1 - pk.hargaRp / (pk.bulan * SATU_BULAN.hargaRp)) * 100);
              return (
                <Tekan key={pk.kode} onPress={() => { setIPaket(i); }} skala={0.96} gayaLuar={{ flex: 1 }}
                  gaya={[g.paket, iPaket === i && g.paketOn]} accessibilityState={{ selected: iPaket === i }}
                  accessibilityLabel={`${String(pk.bulan * 30)} hari, ${rupiah(pk.hargaRp)}`}>
                  <Text style={[g.paketHari, iPaket === i && { color: W.teksKuat }]}>{pk.bulan * 30} hari</Text>
                  <Text style={g.paketHarga} numberOfLines={1} adjustsFontSizeToFit>{rupiah(pk.hargaRp)}</Text>
                  <Text style={[g.paketHemat, hemat > 0 && { color: W.naik }]}>{hemat > 0 ? `hemat ${String(hemat)}%` : 'dasar'}</Text>
                </Tekan>
              );
            })}
          </View>

          <Lbl>Cara bayar</Lbl>
          <Menu>
            <View style={g.pilih}><Radio on /><View style={{ flex: 1 }}>
              <Text style={g.pilihJudul}>Lewat bot Telegram</Text><Lbl polos>Satu-satunya jalur yang aktif</Lbl></View></View>
            <View style={[g.pilih, g.garis, { opacity: 0.45 }]}><Radio on={false} /><View style={{ flex: 1 }}>
              <Text style={g.pilihJudul}>Pembelian dalam app</Text><Lbl polos>Belum tersedia</Lbl></View></View>
          </Menu>
        </>
      )}

      {TOKO_PLAY ? (
        <>
          <View style={{ flex: 1 }} />
          <Mikro tengah>Status langganan mengikuti akunmu, di app maupun di web.</Mikro>
        </>
      ) : (
        <>
        <Blok gaya={{ flex: 1 }}>
          <Lbl>Rincian</Lbl>
          <View style={{ marginTop: 4 }}>
            <BarisPakai kiri={`AnalisMarket+ · ${String(paket.bulan * 30)} hari`} kanan={rupiah(paket.hargaRp)} pertama />
            <BarisPakai kiri="PPN" kanan="Termasuk" />
            <BarisPakai kiri="Total" kanan={rupiah(paket.hargaRp)} tebal />
          </View>
          <Mikro>Dibayar sekali di muka untuk {String(paket.bulan * 30)} hari. Tidak ada potong otomatis: sesudah tanggal berakhir, akun kembali ke paket gratis dan setelanmu tetap tersimpan. Masa aktifnya dipilih lagi di bot saat membayar.</Mikro>
        </Blok>
  
        {/* Emas terisi — dan ini memang halaman AM+. Mati: pembayaran di bot. */}
        <Tombol teks="Berlangganan lewat bot Telegram" jenis="emas" mati />
        <Mikro tengah>Kirim /plus ke @{BOT}. App ini tidak memproses pembayaran.</Mikro>
        </>
      )}
    </Wadah>
  );
}

const g = gayaTema((W) => StyleSheet.create({
  baris: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rata: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  chips: { flexDirection: 'row', gap: 6 },
  garis: { borderTopWidth: StyleSheet.hairlineWidth * 2, borderTopColor: W.garisSamar },
  judulTengah: { marginTop: 10, fontSize: 17, fontWeight: '700', color: W.teksKuat, textAlign: 'center', letterSpacing: -0.3 },
  ketTengah: { marginTop: 6, fontSize: 13, color: W.teksRedup, lineHeight: 19, textAlign: 'center', maxWidth: 290 },
  centangBaris: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  centang: { color: W.plusTeks, fontSize: 12, marginTop: 2, fontWeight: '700' },
  centangTeks: { flex: 1, fontSize: 12.5, color: W.teksRedup, lineHeight: 18 },
  pilih: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingHorizontal: 13, paddingVertical: 12 },
  pilihJudul: { fontSize: 13.5, fontWeight: '600', color: W.teksKuat },
  pantau: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 11 },
  cincinTeks: { fontSize: 14, fontWeight: '700', color: W.teksKuat, fontVariant: ['tabular-nums'] },
  heroJudul: { fontSize: 16, fontWeight: '700', color: W.teksKuat, letterSpacing: -0.2 },
  heroKet: { fontSize: 12.5, color: W.teksRedup, lineHeight: 18, marginTop: 3 },
  keadaan: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  titikKeadaan: { width: 7, height: 7, borderRadius: 4 },
  keadaanTeks: { flex: 1, fontSize: 12, color: W.teksRedup, lineHeight: 16, fontVariant: ['tabular-nums'] },
  keadaanKanan: { fontSize: 12.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
  paketBaris: { flexDirection: 'row', gap: 6 },
  paket: {
    alignItems: 'center', gap: 3, paddingVertical: 11, paddingHorizontal: 4, borderRadius: R.besar,
    backgroundColor: W.kacaIsi, borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, borderTopColor: W.kacaKilau,
  },
  paketOn: { backgroundColor: W.amberLatar, borderColor: W.amberTepi, borderTopColor: 'rgba(240,191,107,0.62)', borderWidth: 1 },
  paketHari: { fontSize: 13, fontWeight: '700', color: W.teksRedup, fontVariant: ['tabular-nums'] },
  paketHarga: { fontSize: 11, color: W.teksSamar, fontVariant: ['tabular-nums'] },
  paketHemat: { fontSize: 10.5, fontWeight: '700', color: W.teksSamar },
  bilahRingkas: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', gap: 2, backgroundColor: W.tinta(0.06) },
  ringkasAngka: { fontSize: 12.5, fontWeight: '600', color: W.teksKuat, fontVariant: ['tabular-nums'] },
  ringkasWaktu: { fontSize: 12, color: W.teksSamar, fontVariant: ['tabular-nums'] },
  papan: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  petak: {
    padding: 12, borderRadius: R.kartu - 4, backgroundColor: W.kacaIsi,
    borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, borderTopColor: W.kacaKilau,
  },
  petakSetup: { backgroundColor: 'rgba(16,185,129,0.07)', borderColor: 'rgba(16,185,129,0.30)', borderTopColor: 'rgba(16,185,129,0.45)' },
  petakMesin: {
    fontSize: 10.5, fontWeight: '700', color: W.teksRedup, fontVariant: ['tabular-nums'], paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6, backgroundColor: W.isiSamarKuat, overflow: 'hidden', maxWidth: 74,
  },
  petakStatus: { fontSize: 13, fontWeight: '700' },
  meter: { height: 4, borderRadius: 2, backgroundColor: W.tinta(0.08), marginTop: 10, overflow: 'hidden' },
  meterIsi: { height: 4, borderRadius: 2 },
  petakKet: { fontSize: 11.5, color: W.teksSamar, marginTop: 6, lineHeight: 15, fontVariant: ['tabular-nums'] },
  /* Meniru notifikasi sistem — PADAT, karena layar kunci tidak punya kaca. */
  notif: {
    flexDirection: 'row', gap: 11, padding: 13, borderRadius: 22, backgroundColor: W.kartuTerang,
    borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi,
  },
  notifLogo: { width: 34, height: 34, borderRadius: 9 },
  notifApp: { fontSize: 12, fontWeight: '600', color: W.teksRedup },
  notifWaktu: { fontSize: 11.5, color: W.teksSamar },
  notifJudul: { fontSize: 13.5, fontWeight: '700', color: W.teksKuat, marginTop: 2 },
  notifIsi: { fontSize: 12.5, color: W.teksRedup, lineHeight: 18, marginTop: 1 },
  ket: { marginTop: 6, fontSize: 13, color: W.teksRedup, lineHeight: 19 },
  besar: { fontSize: H.harga, fontWeight: '700', color: W.teksKuat, fontVariant: ['tabular-nums'] },
  dari: { fontSize: 13, color: W.teksRedup, fontWeight: '400' },
  kartuEmas: {
    borderRadius: R.kartu, padding: 16, borderWidth: 1, borderColor: W.amberTepi, borderTopColor: 'rgba(240,191,107,0.62)',
    backgroundColor: W.amberLatar,
  },
  cap: { fontSize: H.label, letterSpacing: 1.5, textTransform: 'uppercase', color: W.plusTeks, fontWeight: '600' },
  harga: { fontSize: 26, fontWeight: '700', color: W.plusTerang, marginTop: 6, letterSpacing: -0.6, fontVariant: ['tabular-nums'] },
  handle: { marginTop: 6, marginBottom: 8, fontSize: 22, fontWeight: '700', color: W.teksKuat, letterSpacing: -0.4 },
  tempelKotak: {
    marginTop: 6, minHeight: SENTUH, paddingHorizontal: 12, borderRadius: R.besar,
    borderWidth: StyleSheet.hairlineWidth * 2, borderColor: W.kacaTepi, backgroundColor: W.isiSamar, justifyContent: 'center',
  },
  tempelIsi: { color: W.teksKuat, fontSize: 14, paddingVertical: 11 },
  galat: { marginTop: 8, fontSize: 12.5, color: W.turun, lineHeight: 18 },
}));
