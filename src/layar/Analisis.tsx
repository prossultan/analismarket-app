/**
 * ANALISIS — SATU LAYAR, dan itu seluruh perbaikannya.
 *
 * Versi app sebelumnya memecah satu pertanyaan jadi tiga tujuan: ketuk pasar
 * → layar Chart → tombol → layar Bacaan. Tiga perpindahan untuk satu hal yang
 * di web tidak pernah memindahkan siapa pun. Itu yang membuatnya terasa
 * "gak jelas": bukan gayanya, melainkan bahwa layarnya berganti-ganti
 * sementara pertanyaannya tetap sama.
 *
 * Bentuk web mobile, dan sekarang bentuk app juga:
 *
 *   kepala      simbol (buka lembar pasar) · titik hidup · harga · ubah 24j
 *   kendali     SATU baris tergulir: timeframe │ mesin │ alat
 *   chart       WebView
 *   skala       penggaris jarak ATR tiap mesin
 *   strip       status · mesin · biaya — DITEKAN membuka bacaan
 *   mikro       satu baris kepatuhan
 *
 * Lapisan bacaan duduk DI BAWAH kepala dan kendali, bukan menutupinya: pasar,
 * harga, timeframe, dan mesin tetap terlihat DAN tetap hidup, jadi mengetuk
 * mesin lain saat membaca menukar bacaannya di tempat.
 */
import { useEffect, useRef, useState } from 'react';
import { gayaTema, useTema } from '../gaya/tema';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import type { WebViewMessageEvent } from 'react-native-webview';
import { ChartTertanam } from '../komponen/ChartTertanam';
import { ASAL } from '../data/antrian';
import { ambilPasar, syaratWajib, type Mesin, type Pasar } from '../data/api';
import { angka, ubah, biayaPersen } from '../data/tampil';
import { LembarPasar } from '../komponen/LembarPasar';
import { Lembar } from '../komponen/Lembar';
import { Tekan } from '../komponen/Tekan';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Kosong, Memuat } from '../komponen/dasar';
import { useSesi } from './Akun';
import { tokenSesi } from '../data/sesi';
import { kunciSesi } from '../data/statusPlus';
import { isiLembarGagal } from '../data/gagalBacaan';
import { useBacaanPasar, usePasarTf } from '../data/layarPasar';
import { IsiBacaan } from '../komponen/IsiBacaan';
import { BandingMesin } from '../komponen/BandingMesin';
import { LambangPasar } from '../komponen/LambangPasar';
import { Kaca } from '../komponen/Kaca';
import { Ikon } from '../komponen/Ikon';
import { Blok, Chip, Harga, Lbl, Nil, PilTf, PitaMesin, Rangka, Tarik, type SelMesin } from '../komponen/mockup';
import { useSisaBilah } from '../gaya/jarak';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { W, H, J, R, ANGKA, SENTUH, TALANG } from '../gaya/token';
import type { Setelan } from '../data/simpan';

const SUNTIK = `
(function () {
  var akhir = null;
  setInterval(function () {
    try {
      var u = window.__chartUji;
      if (!u || typeof u.harga !== 'function') return;
      var h = u.harga();
      if (typeof h !== 'number' || !isFinite(h) || h <= 0 || h === akhir) return;
      akhir = h;
      window.ReactNativeWebView.postMessage(JSON.stringify({ harga: h }));
    } catch (e) { /* halaman belum siap */ }
  }, 1000);
})();
true;
`;

/** Lapisan chart yang bisa dinyalakan — nama dan urutannya sama dengan web. */
const ALAT = ['volume', 'zona', 'struktur', 'level', 'pola lilin'] as const;

type Props = { setelan: Setelan; simpan: (s: Setelan) => void; bukaPasarTanda: number; bukaPlus: () => void };

export function LayarAnalisis({ setelan, simpan, bukaPasarTanda, bukaPlus }: Props) {
  const sesiChart = useSesi();
  /* Menahan layar HANYA kalau orangnya sendiri yang memintanya di Pengaturan.
     `useKeepAwake` tidak bisa dipakai di sini: ia tidak punya cara dimatikan
     bersyarat, dan memanggil hook di dalam `if` melanggar aturan hook. Jadi
     efek biasa, dengan pembersih yang SELALU melepas — layar yang tertahan
     menyala sesudah orang menutup chart adalah baterai yang habis tanpa ada
     yang tahu sebabnya. */
  useEffect(() => {
    if (!setelan.layarMenyala) return undefined;
    void activateKeepAwakeAsync('chart');
    return () => { void deactivateKeepAwake('chart'); };
  }, [setelan.layarMenyala]);
  const [daftarPasar, setDaftarPasar] = useState<Pasar[]>([]);
  /* Pasar dan tf DIHITUNG dari setelan, bukan disalin ke keadaan lokal —
     lihat `layarPasar.ts`. `kataTf` = penggantian yang WAJIB disebut. */
  const { pasar, tf, kataTf, pilihTf, pilihPasar } = usePasarTf(setelan, simpan, daftarPasar);
  const [mesin, setMesin] = useState(setelan.mesin);
  const [alat, setAlat] = useState<ReadonlySet<string>>(() => new Set(['volume', 'zona', 'struktur', 'level']));
  /* DUA kegagalan, DUA keadaan. Daftar pasar yang gagal mengosongkan layar;
     bacaan yang gagal cuma mengisi lembar bawah — dan bacaan yang DITOLAK
     (402 butuh AM+, 429 jatah habis) bukan "mesin tidak menjawab". Dulu
     keduanya satu string, jadi m5 emas akun gratis tercetak "tidak
     tersambung · Coba lagi" untuk jawaban yang tidak akan pernah berubah.
     Bacaannya sendiri — termasuk membuang jawaban milik tf sebelumnya —
     diurus `useBacaanPasar` (layarPasar.ts). */
  const [gagal, setGagal] = useState('');
  const simbol = pasar?.simbol ?? null;
  const { bacaan, gagalBaca, muatUlang } = useBacaanPasar(simbol, tf);
  const [harga, setHarga] = useState<number | null>(null);
  const [memuatChart, setMemuatChart] = useState(true);
  const [lembarPasar, setLembarPasar] = useState(false);
  const [lapisBanding, setLapisBanding] = useState(false);
  const [lapisBacaan, setLapisBacaan] = useState(false);
  const dariChart = useRef(false);
  const sisaBilah = useSisaBilah();
  const { top: atas } = useSafeAreaInsets();

  /* Tab Pasar di bilah bawah membuka lembar ini, bukan pindah halaman —
     persis `MenuBawah` di web. Tandanya angka yang naik, supaya ketukan
     kedua pada tab yang sama tetap membuka. */
  useEffect(() => { if (bukaPasarTanda > 0) setLembarPasar(true); }, [bukaPasarTanda]);

  /* Naik satu: penghitung yang dinaikkan tombol "Coba lagi". Daftar pasar
     adalah akar layar ini — tanpa ia, tidak ada pasar, tidak ada bacaan, dan
     tidak ada chart. Sebelum ini kegagalannya `return` diam-diam, jadi
     `gagal` tetap kosong dan cabang di baris bawah SELALU memilih "Menyiapkan…".
     Layar galatnya sudah ditulis; ia cuma tidak pernah bisa dicapai.
     `setelan.pasar` ikut di daftar ketergantungan supaya daftar (dan harga
     di kepala) disegarkan tiap ganti pasar — pasarnya sendiri sudah dihitung
     `usePasarTf` dari daftar yang ada, tanpa menunggu jawaban ini. */
  const [ulang, setUlang] = useState(0);
  useEffect(() => {
    let batal = false;
    void ambilPasar(ulang > 0).then((j) => {
      if (batal) return;
      if (!j.ok) { setGagal(j.kalimat); return; }
      setGagal('');
      setDaftarPasar(j.isi.pasar);
    });
    return () => { batal = true; };
  }, [setelan.pasar, ulang]);

  /* Harga kepala: dikosongkan tiap ganti pasar/tf, diisi bacaan sampai
     chart mengirim harganya sendiri. Diikat ke SIMBOL, bukan objek pasar:
     daftar yang disegarkan membuat objek baru untuk pasar yang sama. */
  useEffect(() => {
    dariChart.current = false;
    setHarga(null);
  }, [simbol, tf]);
  useEffect(() => {
    if (bacaan !== null && !dariChart.current && bacaan.harga > 0) setHarga(bacaan.harga);
  }, [bacaan]);

  /* Chart IKUT TEMA: `?tema=terang` memilih palet terang di chart-embed.

     DI ATAS early return, bukan di dekat pemakaiannya. Kait yang dipanggil
     sesudah `if (pasar === null) return` dilewati di render pertama dan ikut
     di render kedua — React menjatuhkan app persis saat tab Pasar dibuka.
     Dijaga `skrip/periksa-kait.mjs`. */
  const temaChart = useTema();

  if (pasar === null) {
    return gagal === ''
      ? <Memuat teks="Menyiapkan…" />
      : <Kosong judul="Daftar pasar tidak terbaca" sebab={gagal} aksi={() => { setGagal(''); setUlang((n) => n + 1); }} />;
  }

  const aktif = bacaan === null ? mesin : (bacaan.mesin.find((m) => m.mesin === mesin) ?? bacaan.mesin[0])?.mesin ?? '';
  const m = bacaan?.mesin.find((x) => x.mesin === aktif) ?? null;
  const u = pasar.ubah24hPersen;
  const warnaUbah = u === null ? W.teksSamar : u > 0 ? W.naik : u < 0 ? W.turun : W.teksSamar;
  const url = `${ASAL}/chart-embed?pair=${encodeURIComponent(pasar.simbol)}&tf=${encodeURIComponent(tf)}`
    + (aktif === '' ? '' : `&mesin=${encodeURIComponent(aktif)}`)
    + `&alat=${encodeURIComponent([...alat].join(','))}`
    + (temaChart === 'terang' ? '&tema=terang' : '');

  const gantiAlat = (a: string): void => {
    setAlat((s) => { const n = new Set(s); if (n.has(a)) n.delete(a); else n.add(a); return n; });
    setMemuatChart(true);
  };

  const pesan = (e: WebViewMessageEvent): void => {
    try {
      const j = JSON.parse(e.nativeEvent.data) as { harga?: number };
      if (typeof j.harga === 'number' && j.harga > 0) { dariChart.current = true; setHarga(j.harga); }
    } catch { /* pesan yang tidak kami mengerti diabaikan */ }
  };

  const wajibAktif = m === null ? [] : syaratWajib(m);
  const lolosAktif = wajibAktif.filter((c) => c.lolos).length;
  const ditahan = m !== null && (m.entry === undefined || m.sl === undefined || m.tp === undefined);

  /** Pita mesin: kata status HANYA untuk setup/pantau — lihat catatan di web `labelStatusRingkas`. */
  const selMesin: SelMesin[] = (bacaan?.mesin ?? []).map((x) => {
    const w = syaratWajib(x);
    const st = x.status.toUpperCase();
    return {
      kode: x.mesin,
      kata: st === 'SETUP' ? 'setup' : st === 'PANTAU' ? 'pantau' : '',
      angka: `${String(w.filter((c) => c.lolos).length)}/${String(w.length)}`,
      titik: st === 'SETUP' ? 'hijau' : x.mesin === aktif ? 'putih' : 'polos',
    };
  });

  return (
    <View style={g.akar}>
      {/* ── KEPALA KACA: lambang · simbol ⌄ · harga · ubah ─────────────── */}
      <Kaca tepi="bawah" gaya={{ paddingTop: atas }}>
        <View style={g.kepala}>
          {/* PIL BERBINGKAI, bukan teks polos dengan ⌄ kecil: pemilik bingung ini
              bisa ditekan atau tidak. Yang bisa ditekan harus TERLIHAT bisa
              ditekan — bingkai, latar, dan kata "ganti" di sebelahnya. */}
          <Tekan onPress={() => { setLembarPasar(true); }} gaya={g.pasarTombol} hitSlop={6} accessibilityLabel="Ganti pasar">
            <LambangPasar simbol={pasar.simbol} ukuran={19} />
            <Text style={g.simbol} numberOfLines={1}>{pasar.simbol}</Text>
            <View style={g.gantiPil}><Text style={g.gantiTeks}>ganti ⌄</Text></View>
          </Tekan>
          <View style={{ flex: 1 }} />
          <Harga kecil>{angka(harga ?? pasar.harga, pasar.desimal)}</Harga>
          <Text style={[g.ubahTeks, { color: warnaUbah }]}>{ubah(u)}</Text>
        </View>
      </Kaca>

      <View style={g.isi}>
        {/* ── TIMEFRAME: pil ────────────────────────────────────────────── */}
        <PilTf
          daftar={pasar.timeframes.map((t) => t.toLowerCase())}
          aktif={tf}
          pilih={(k) => { pilihTf(k); setMemuatChart(true); }}
        />
        {kataTf !== '' && <Text style={g.kataTf} accessibilityLiveRegion="polite">{kataTf}</Text>}

        {/* ── MESIN: lima kolom rata, dengan tombol banding di ujung ────── */}
        {selMesin.length > 0 ? (
          <PitaMesin daftar={selMesin} aktif={aktif} pilih={(k) => { setMesin(k); setMemuatChart(true); }} />
        ) : (
          <View style={g.mesinRangka}>
            {[0, 1, 2, 3, 4].map((i) => <Rangka key={i} lebar={48} tinggi={8} />)}
          </View>
        )}

        {/* ── PASAR TUTUP ───────────────────────────────────────────────── */}
        {bacaan?.pasarTutupAlasan != null && bacaan.pasarTutupAlasan !== '' && (
          <Blok emas rapat>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ikon nama="kalender" warna={W.plus} ukuran={14} />
              <View style={{ flex: 1 }}>
                <Text style={g.tutupJudul}>Pasar tutup</Text>
                <Lbl polos>{bacaan.pasarTutupAlasan}</Lbl>
              </View>
            </View>
          </Blok>
        )}

        {/* ── CHART: mengambil semua sisa tinggi ────────────────────────── */}
        <View style={g.wadahChart}>
          {/* Token SESI APA PUN — mini maupun Google. Dulu cuma sesi mini, jadi
              chart pengguna Google selalu anonim sementara bacaan di luar
              WebView membawa tokennya. Lihat `sesiChart.ts`. */}
          <ChartTertanam ambilToken={tokenSesi} kunciSesi={kunciSesi(sesiChart)} url={url} asal={ASAL} suntik={SUNTIK} latar={W.chart}
            onMuat={setMemuatChart} onPesan={pesan} />
          {memuatChart && (
            <View style={g.tunggu} pointerEvents="none">
              <Lbl polos>membaca 1.300 lilin…</Lbl>
            </View>
          )}
        </View>

        {/* ── ALAT: di BAWAH chart, tepat di sebelah benda yang diubahnya ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={g.alatRow}>
          {ALAT.map((a) => <Chip key={a} teks={a} on={alat.has(a)} onPress={() => { gantiAlat(a); }} />)}
          <Chip teks="banding" onPress={() => { setLapisBanding(true); }} />
        </ScrollView>

        {/* Ruang untuk lembar yang melayang di bawah. */}
        <View style={{ height: TINGGI_LEMBAR + sisaBilah - 8 }} />
      </View>

      {/* ── LEMBAR KACA: berhenti DI ATAS bilah tab ──────────────────────── */}
      <Pressable
        onPress={() => { if (m !== null) setLapisBacaan(true); }}
        style={[g.lembar, { bottom: sisaBilah - 8 }]}
        accessibilityRole="button" accessibilityLabel="Buka bacaan lengkap"
      >
        <Kaca tebal tepi="atas" gaya={g.lembarIsi}>
          <Tarik kata="tarik untuk detail" />
          {gagalBaca !== null ? (() => {
            /* Isinya diputuskan `isiLembarGagal`: "Coba lagi" cuma untuk
               jaringan; butuh AM+ jadi ajakan ke tab PLUS+, tanpa harga dan
               tanpa cara beli di build mana pun — tab itulah yang tunduk
               pada TOKO_PLAY. */
            const isi = isiLembarGagal(gagalBaca);
            return (
              <View style={g.lembarBaris}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Lbl warna={isi.emas ? W.plusTeks : undefined}>{isi.label}</Lbl>
                  <Text style={g.lembarStatus} numberOfLines={1}>{isi.judul}</Text>
                  <Text style={g.ditahanKet} numberOfLines={2}>{isi.ket}</Text>
                </View>
                {isi.aksi === 'coba' && <Chip teks="Coba lagi" onPress={muatUlang} />}
                {isi.aksi === 'plus' && <Chip teks="Lihat AnalisMarket+" emas onPress={bukaPlus} />}
              </View>
            );
          })() : m === null ? (
            <View style={g.lembarBaris}>
              <View style={{ flex: 1, gap: 6 }}>
                <Rangka lebar="34%" tinggi={8} /><Rangka lebar="58%" tinggi={14} />
              </View>
            </View>
          ) : ditahan ? (
            <View style={g.ditahan}>
              <Lbl warna={W.plusTeks}>angka rencana ditahan</Lbl>
              <Text style={g.ditahanJudul}>{m.sebabTanpaAngka ?? m.keputusan.label}</Text>
              <Text style={g.ditahanKet} numberOfLines={2}>{m.keputusan.alasan}</Text>
            </View>
          ) : (
            <>
              <View style={g.lembarBaris}>
                <View style={{ minWidth: 0, flex: 1 }}>
                  <Lbl>{aktif} · {tf}</Lbl>
                  <Text style={g.lembarStatus} numberOfLines={1}>
                    {m.status.charAt(0) + m.status.slice(1).toLowerCase()} · {lolosAktif} dari {wajibAktif.length}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Chip teks={`ATR ${angka(m.atr, pasar.desimal)}`} mono lencana />
                  {m.biayaPorsi !== null && <Chip teks={`Biaya ${biayaPersen(m.biayaPorsi)} risiko`} mono lencana />}
                </View>
              </View>
              <View style={g.angkaBaris}>
                <View><Lbl>Entry</Lbl><Nil>{angka(m.entry, pasar.desimal)}</Nil></View>
                <View><Lbl>SL</Lbl><Nil warna={W.turun}>{angka(m.sl, pasar.desimal)}</Nil></View>
                <View><Lbl>TP</Lbl><Nil warna={W.naik}>{angka(m.tp, pasar.desimal)}</Nil></View>
                <View><Lbl>RR</Lbl><Nil>{m.rrBersih.toFixed(2).replace('.', ',')}</Nil></View>
              </View>
            </>
          )}
        </Kaca>
      </Pressable>

      {/* ── LAPISAN BACAAN LENGKAP ────────────────────────────────────────── */}
      {/* "Tarik turun untuk menutup" sekarang BENAR: lembarnya mengikuti jari,
          dan kecepatan jari diteruskan ke pegasnya. Lihat Lembar.tsx. */}
      <Lembar terbuka={lapisBacaan && m !== null} onTutup={() => { setLapisBacaan(false); }}
        gaya={g.lapis} gayaLuar={{ paddingBottom: sisaBilah - 8 }} labelTutup="Tutup bacaan"
        kepala={(
          <>
            <Tarik kata="tarik turun untuk menutup" turun />
            <View style={g.lapisKepala}>
              <Lbl>bacaan · {pasar.simbol} {tf} · {aktif}</Lbl>
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => { setLapisBacaan(false); }} style={g.tutup} hitSlop={8}>
                <Text style={g.tutupTeks}>tutup</Text>
              </Pressable>
            </View>
          </>
        )}>
        {m !== null && bacaan !== null && <IsiBacaan m={m} desimal={pasar.desimal} />}
      </Lembar>

      {/* ── BANDING MESIN ─────────────────────────────────────────────────── */}
      <Lembar terbuka={lapisBanding} onTutup={() => { setLapisBanding(false); }}
        gaya={g.lapis} gayaLuar={{ paddingBottom: sisaBilah - 8 }} labelTutup="Tutup banding mesin"
        kepala={(
          <>
            <Tarik kata="tarik turun untuk menutup" turun />
            <View style={g.lapisKepala}>
              <Lbl>banding mesin · {pasar.simbol} {tf}</Lbl>
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => { setLapisBanding(false); }} style={g.tutup} hitSlop={8}>
                <Text style={g.tutupTeks}>tutup</Text>
              </Pressable>
            </View>
          </>
        )}>
        {bacaan !== null && (
          <BandingMesin daftar={bacaan.mesin} aktif={aktif}
            pilih={(k) => { setMesin(k); setMemuatChart(true); setLapisBanding(false); }} />
        )}
      </Lembar>

      <LembarPasar
          terbuka={lembarPasar}
          daftar={daftarPasar}
          terpilih={pasar.simbol}
          pilih={(p) => { pilihPasar(p); setMemuatChart(true); }}
          tutup={() => { setLembarPasar(false); }}
        />

    </View>
  );
}

/** Tinggi lembar yang melayang — ruang yang harus disisakan isi di atasnya. */
const TINGGI_LEMBAR = 134;

const g = gayaTema((W) => StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  kepala: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: TALANG, paddingVertical: 8, minHeight: SENTUH },
  pasarTombol: {
    flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: SENTUH - 8,
    paddingLeft: 8, paddingRight: 6, borderRadius: 999,
    backgroundColor: W.tinta(0.06), borderWidth: 1, borderColor: W.garis,
  },
  gantiPil: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: W.tinta(0.10) },
  gantiTeks: { fontSize: H.label, fontWeight: '600', color: W.teksKuat },
  simbol: { fontSize: H.pasar, fontWeight: '600', color: W.teksKuat, letterSpacing: -0.2, flexShrink: 1 },
  tanda: { fontSize: 12, color: W.teksSamar, marginTop: -3 },
  kataTf: { fontSize: H.label, color: W.teksRedup, lineHeight: 15 },
  ubahTeks: { fontSize: H.label, ...ANGKA },
  isi: { flex: 1, paddingHorizontal: TALANG, paddingTop: 9, gap: 6 },
  mesinRangka: { flexDirection: 'row', gap: 6, paddingVertical: 8, paddingHorizontal: 6, borderWidth: 1, borderColor: W.garis, borderRadius: R.besar },
  tutupJudul: { fontSize: H.nilai, fontWeight: '600', color: W.teksKuat },
  wadahChart: { flex: 1, minHeight: 120, position: 'relative', borderRadius: R.besar, overflow: 'hidden', borderWidth: 1, borderColor: W.garis, backgroundColor: W.chart },
  web: { flex: 1, backgroundColor: W.chart },
  tunggu: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  /* Gaya utuh, bukan timpaan `left: undefined` — di web timpaan itu tidak
     berlaku dan dua chip menumpuk di pojok yang sama. */
  alatRow: { flexDirection: 'row', gap: 4, paddingVertical: 2 },

  lembar: { position: 'absolute', left: 0, right: 0 },
  lembarIsi: { borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingHorizontal: TALANG, paddingTop: 5, paddingBottom: 10, overflow: 'hidden' },
  lembarBaris: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lembarStatus: { fontSize: H.pasar, fontWeight: '600', color: W.teksKuat, marginTop: 1 },
  angkaBaris: { flexDirection: 'row', gap: 12, marginTop: 8 },
  ditahan: { gap: 3 },
  ditahanJudul: { fontSize: H.nilai, fontWeight: '600', color: W.teksKuat, lineHeight: 15 },
  ditahanKet: { fontSize: H.label, color: W.teksRedup, lineHeight: 13 },

  lapisLuar: { flex: 1, justifyContent: 'flex-end' },
  lapisTirai: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: W.tirai },
  /* TANPA backgroundColor: warnanya datang dari <Kaca>. */
  lapis: { maxHeight: '88%', borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden', paddingTop: 6 },
  lapisKepala: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: TALANG, minHeight: SENTUH - 6, borderBottomWidth: 1, borderBottomColor: W.garis },
  tutup: { minHeight: SENTUH, justifyContent: 'center', paddingHorizontal: J.x2 },
  tutupTeks: { fontSize: H.nilai, color: W.teksRedup },
}));
