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
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { ASAL } from '../data/antrian';
import { ambilBacaan, ambilPasar, syaratWajib, type Bacaan, type Mesin, type Pasar } from '../data/api';
import { angka, ubah } from '../data/tampil';
import { LembarPasar } from '../komponen/LembarPasar';
import { SkalaJarum } from '../komponen/SkalaJarum';
import { BarBiaya, Kosong, Memuat } from '../komponen/dasar';
import { IsiBacaan } from '../komponen/IsiBacaan';
import { W, H, J, R, ANGKA, SENTUH, TALANG, TINGGI_KENDALI } from '../gaya/token';
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

type Props = { setelan: Setelan; simpan: (s: Setelan) => void; bukaPasarTanda: number };

export function LayarAnalisis({ setelan, simpan, bukaPasarTanda }: Props) {
  const [daftarPasar, setDaftarPasar] = useState<Pasar[]>([]);
  const [pasar, setPasar] = useState<Pasar | null>(null);
  const [tf, setTf] = useState(setelan.tf);
  const [mesin, setMesin] = useState(setelan.mesin);
  const [alat, setAlat] = useState<ReadonlySet<string>>(() => new Set(['volume', 'zona', 'struktur', 'level']));
  const [bacaan, setBacaan] = useState<Bacaan | null>(null);
  const [gagal, setGagal] = useState('');
  const [harga, setHarga] = useState<number | null>(null);
  const [memuatChart, setMemuatChart] = useState(true);
  const [lembarPasar, setLembarPasar] = useState(false);
  const [lapisBacaan, setLapisBacaan] = useState(false);
  const dariChart = useRef(false);

  /* Tab Pasar di bilah bawah membuka lembar ini, bukan pindah halaman —
     persis `MenuBawah` di web. Tandanya angka yang naik, supaya ketukan
     kedua pada tab yang sama tetap membuka. */
  useEffect(() => { if (bukaPasarTanda > 0) setLembarPasar(true); }, [bukaPasarTanda]);

  useEffect(() => {
    let batal = false;
    void ambilPasar().then((j) => {
      if (batal || !j.ok) return;
      setDaftarPasar(j.isi.pasar);
      const p = j.isi.pasar.find((x) => x.simbol === setelan.pasar) ?? j.isi.pasar[0] ?? null;
      setPasar(p);
      if (p !== null) {
        const punya = p.timeframes.map((t) => t.toLowerCase());
        setTf((t) => (punya.includes(t) ? t : (punya[0] ?? 'h1')));
      }
    });
    return () => { batal = true; };
  }, [setelan.pasar]);

  const muatBacaan = useCallback(async (simbol: string, t: string, segarkan = false): Promise<void> => {
    const j = await ambilBacaan(simbol, t, segarkan);
    if (!j.ok) { setGagal(j.kalimat); setBacaan(null); return; }
    setGagal('');
    setBacaan(j.isi);
    if (!dariChart.current && j.isi.harga > 0) setHarga(j.isi.harga);
  }, []);

  useEffect(() => {
    if (pasar === null) return;
    dariChart.current = false;
    setHarga(null);
    setBacaan(null);
    void muatBacaan(pasar.simbol, tf);
  }, [pasar, tf, muatBacaan]);

  if (pasar === null) {
    return gagal === '' ? <Memuat teks="Menyiapkan…" /> : <Kosong judul="Daftar pasar tidak terbaca" sebab={gagal} />;
  }

  const aktif = bacaan === null ? mesin : (bacaan.mesin.find((m) => m.mesin === mesin) ?? bacaan.mesin[0])?.mesin ?? '';
  const m = bacaan?.mesin.find((x) => x.mesin === aktif) ?? null;
  const u = pasar.ubah24hPersen;
  const warnaUbah = u === null ? W.teksSamar : u > 0 ? W.naik : u < 0 ? W.turun : W.teksSamar;
  const url = `${ASAL}/chart-embed?pair=${encodeURIComponent(pasar.simbol)}&tf=${encodeURIComponent(tf)}`
    + (aktif === '' ? '' : `&mesin=${encodeURIComponent(aktif)}`)
    + `&alat=${encodeURIComponent([...alat].join(','))}`;

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

  return (
    <View style={g.akar}>
      {/* ── KEPALA ─────────────────────────────────────────────────────── */}
      <View style={g.kepala}>
        <Pressable onPress={() => { setLembarPasar(true); }} style={g.pasarTombol} hitSlop={6}>
          <Text style={g.simbol} numberOfLines={1}>{pasar.simbol}</Text>
          <Text style={g.tanda}>▾</Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        <View style={[g.titik, { backgroundColor: bacaan === null ? W.teksSamar : W.naik }]} />
        <Text style={g.harga}>{angka(harga ?? pasar.harga, pasar.desimal)}</Text>
        <Text style={[g.ubahTeks, { color: warnaUbah }]}>{ubah(u)}</Text>
      </View>

      {/* ── BARIS 1: timeframe + alat ─────────────────────────────────── */}
      <View style={g.kendali}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={g.kendaliIsi}>
          {pasar.timeframes.map((t) => {
            const k = t.toLowerCase();
            const on = k === tf;
            return (
              <Pressable key={t} onPress={() => { setTf(k); simpan({ ...setelan, pasar: pasar.simbol, tf: k }); setMemuatChart(true); }} style={[g.kTombol, on && g.kTombolOn]}>
                <Text style={[g.kTeks, on && g.kTeksOn]}>{k}</Text>
              </Pressable>
            );
          })}

          <View style={g.pisah} />

          {ALAT.map((a) => {
            const on = alat.has(a);
            return (
              <Pressable key={a} onPress={() => { gantiAlat(a); }} style={[g.kTombol, on && g.kTombolOn]}>
                <Text style={[g.kTeks, on && g.kTeksOn]}>{a}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── BARIS 2: MESIN, pita sendiri di bawah timeframe ───────────────
          Sebelumnya mesin berdesakan di satu baris bersama timeframe dan
          alat. Di 390px itu berarti nama mesin ketiga sudah di luar layar —
          dan mesin adalah kendali UTAMA halaman ini, bukan kendali ketiga.
          Bentuknya sama dengan pita mesin di desktop. */}
      {(bacaan?.mesin ?? []).length > 0 && (
        <View style={g.pitaMesin}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(bacaan?.mesin ?? []).map((x) => {
              const on = x.mesin === aktif;
              const w = syaratWajib(x);
              const l = w.filter((c) => c.lolos).length;
              const setup = x.status.toUpperCase() === 'SETUP';
              return (
                <Pressable key={x.mesin} onPress={() => { setMesin(x.mesin); setMemuatChart(true); }} style={[g.mesinTab, on && g.mesinTabOn]}>
                  <View style={g.mesinKepala}>
                    {on && <View style={g.mesinTitik} />}
                    <Text style={[g.mesinNama, on && g.mesinNamaOn]} numberOfLines={1}>{x.mesin.toUpperCase()}</Text>
                  </View>
                  <Text style={[g.mesinStatus, setup && g.mesinStatusSetup]} numberOfLines={1}>
                    {x.status.toLowerCase()} {l}/{w.length}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* ── CHART ──────────────────────────────────────────────────────── */}
      <View style={g.wadahChart}>
        <WebView
          key={url}
          source={{ uri: url }}
          style={g.web}
          backgroundColor={W.chart}
          onLoadStart={() => { setMemuatChart(true); }}
          onLoadEnd={() => { setMemuatChart(false); }}
          onMessage={pesan}
          injectedJavaScript={SUNTIK}
          scalesPageToFit={false}
          setBuiltInZoomControls={false}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={[ASAL]}
        />
        {memuatChart && (
          <View style={g.tunggu} pointerEvents="none"><ActivityIndicator color={W.teksRedup} /></View>
        )}
      </View>

      {/* ── PENGGARIS JARAK ATR ────────────────────────────────────────── */}
      {bacaan !== null && (
        <SkalaJarum daftar={bacaan.mesin} aktif={aktif} pilih={(k) => { setMesin(k); setMemuatChart(true); }} />
      )}

      {/* ── STRIP: status · mesin · biaya. Ditekan membuka bacaan. ─────── */}
      <Pressable onPress={() => { if (m !== null) setLapisBacaan(true); }} style={g.strip}>
        <Strip mesin={m} gagal={gagal} cobaLagi={() => { void muatBacaan(pasar.simbol, tf, true); }} />
        <Text style={g.stripBuka}>▴</Text>
      </Pressable>

      <Text style={g.mikro}>Alat baca chart, bukan alat prediksi. Bukan ajakan melakukan transaksi.</Text>

      {/* ── LAPISAN BACAAN ─────────────────────────────────────────────── */}
      <Modal visible={lapisBacaan && m !== null} animationType="slide" transparent onRequestClose={() => { setLapisBacaan(false); }}>
        <View style={g.lapisLuar}>
          <Pressable style={g.lapisTirai} onPress={() => { setLapisBacaan(false); }} />
          <View style={g.lapis}>
            <View style={g.lapisKepala}>
              <Text style={g.lapisMerek}>analismarket.com</Text>
              <View style={{ flex: 1 }} />
              <Pressable onPress={() => { setLapisBacaan(false); }} style={g.tutup} hitSlop={8}>
                <Text style={g.tutupTeks}>tutup</Text>
              </Pressable>
            </View>
            {m !== null && bacaan !== null && (
              <IsiBacaan m={m} desimal={pasar.desimal} />
            )}
          </View>
        </View>
      </Modal>

      {lembarPasar && (
        <LembarPasar
          daftar={daftarPasar}
          terpilih={pasar.simbol}
          pilih={(p) => {
            setPasar(p);
            const punya = p.timeframes.map((t) => t.toLowerCase());
            const t = punya.includes(tf) ? tf : (punya[0] ?? 'h1');
            setTf(t);
            simpan({ ...setelan, pasar: p.simbol, tf: t });
            setMemuatChart(true);
          }}
          tutup={() => { setLembarPasar(false); }}
        />
      )}
    </View>
  );
}

/**
 * ISI STRIP. Urutan prioritas saat sempit: status > biaya > nama mesin.
 *
 * Status itu jawabannya, dan ia tidak pernah dipotong. Biaya yang membedakan
 * produk ini dari penampil chart gratis. Nama mesin cuma konteks, jadi ia
 * yang pertama menyusut. Aturan yang sama dengan `StripFull` di web.
 */
function Strip({ mesin, gagal, cobaLagi }: { mesin: Mesin | null; gagal: string; cobaLagi: () => void }) {
  if (gagal !== '') {
    return (
      <>
        <Text style={g.stripStatus} numberOfLines={1}>Mesin tidak menjawab</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={cobaLagi} hitSlop={8}><Text style={g.cobaLagi}>Coba lagi</Text></Pressable>
      </>
    );
  }
  if (mesin === null) return <Text style={g.stripTunggu}>Menunggu jawaban mesin…</Text>;

  const wajib = syaratWajib(mesin);
  const lolos = wajib.filter((c) => c.lolos).length;
  /* SYARAT KOSONG BERARTI BELUM DIUKUR, BUKAN NOL. Bar sepanjang nol terbaca
     sebagai "biayanya nol" — kebalikan dari yang sebenarnya. */
  const adaBiaya = mesin.biayaPorsi !== null && wajib.length > 0;

  return (
    <>
      <Text style={g.stripStatus} numberOfLines={1}>{mesin.keputusan.label}</Text>
      <Text style={g.stripMesin} numberOfLines={1}>{mesin.mesin}</Text>
      <Text style={g.stripSyarat}>{lolos}/{wajib.length}</Text>
      <View style={{ flex: 1 }} />
      {adaBiaya && (
        <>
          <Text style={g.stripPersen}>{Math.round((mesin.biayaPorsi ?? 0) * 100)}%</Text>
          <View style={g.stripBar}><BarBiaya porsi={mesin.biayaPorsi} ringkas /></View>
        </>
      )}
    </>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  kepala: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: TALANG, minHeight: SENTUH, gap: J.x2 },
  pasarTombol: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: SENTUH },
  simbol: { fontSize: H.pasar, fontWeight: '700', color: W.teksKuat },
  tanda: { fontSize: H.label, color: W.teksSamar },
  titik: { width: 6, height: 6, borderRadius: R.bulat },
  harga: { fontSize: H.harga, fontWeight: '700', color: W.teksKuat, ...ANGKA },
  ubahTeks: { fontSize: H.label, ...ANGKA },

  kendali: { borderTopWidth: 1, borderTopColor: W.garis, borderBottomWidth: 1, borderBottomColor: W.garis },
  kendaliIsi: { alignItems: 'center', paddingHorizontal: 8 },
  kTombol: { paddingHorizontal: 9, minHeight: TINGGI_KENDALI, justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  kTombolOn: { borderBottomColor: W.teksKuat },
  kTeks: { fontSize: H.nilai, lineHeight: 16, color: W.teksRedup },
  kTeksOn: { color: W.teksKuat, fontWeight: '500' },
  pisah: { width: 1, height: 16, backgroundColor: W.garis, marginHorizontal: 6 },

  /* Pita mesin — tinggi TIDAK dipatok: dua baris teks yang tingginya ditebak
     akan terpotong. Padding yang menentukan, isinya yang mengukur. */
  pitaMesin: { borderBottomWidth: 1, borderBottomColor: W.garis, backgroundColor: W.latar900 },
  mesinTab: {
    paddingHorizontal: 13, paddingVertical: 7,
    borderRightWidth: 1, borderRightColor: W.garis,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  mesinTabOn: { backgroundColor: W.kartu, borderBottomColor: W.teksKuat },
  mesinKepala: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  mesinTitik: { width: 5, height: 5, borderRadius: R.bulat, backgroundColor: W.teksKuat },
  mesinNama: { fontSize: H.nilai, lineHeight: 16, color: W.teksRedup, letterSpacing: 0.3 },
  mesinNamaOn: { color: W.teksKuat, fontWeight: '500' },
  mesinStatus: {
    fontSize: H.label, lineHeight: 13, color: W.teksSamar,
    letterSpacing: 1.1, textTransform: 'uppercase', marginTop: 2,
  },
  mesinStatusSetup: { color: W.naik },

  wadahChart: { flex: 1, backgroundColor: W.chart },
  web: { flex: 1, backgroundColor: W.chart },
  tunggu: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },

  strip: {
    flexDirection: 'row', alignItems: 'center', gap: J.x2,
    minHeight: SENTUH, paddingHorizontal: TALANG,
    borderTopWidth: 1, borderTopColor: W.garis, backgroundColor: W.latar900,
  },
  stripStatus: { fontSize: H.nilai, fontWeight: '500', color: W.teksKuat, flexShrink: 0 },
  stripMesin: { fontSize: H.label, color: W.teksSamar, letterSpacing: 1.1, textTransform: 'uppercase', flexShrink: 1 },
  stripSyarat: { fontSize: H.label, color: W.teksRedup, ...ANGKA },
  stripPersen: { fontSize: H.label, color: W.teksRedup, ...ANGKA },
  stripBar: { width: 56 },
  stripBuka: { fontSize: H.label, color: W.teksSamar, marginLeft: 2 },
  stripTunggu: { fontSize: H.nilai, color: W.teksSamar },
  cobaLagi: { fontSize: H.nilai, color: W.teksKuat, textDecorationLine: 'underline' },

  mikro: { fontSize: H.label, color: W.teksSamar, paddingHorizontal: TALANG, paddingVertical: 6, lineHeight: 13 },

  lapisLuar: { flex: 1, justifyContent: 'flex-end' },
  /* Tirai tipis, bukan gelap penuh: kepala dan kendali di belakangnya harus
     tetap TERBACA, karena keduanya masih hidup saat lapisan terbuka. */
  lapisTirai: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: W.tirai },
  lapis: { maxHeight: '88%', backgroundColor: W.latar, borderTopLeftRadius: R.kartu, borderTopRightRadius: R.kartu, borderTopWidth: 1, borderColor: W.garis },
  lapisKepala: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: TALANG, minHeight: SENTUH, borderBottomWidth: 1, borderBottomColor: W.garis },
  lapisMerek: { fontSize: H.label, color: W.teksSamar, letterSpacing: 0.5 },
  tutup: { minHeight: SENTUH, justifyContent: 'center', paddingHorizontal: J.x2 },
  tutupTeks: { fontSize: H.nilai, color: W.teksRedup },
});
