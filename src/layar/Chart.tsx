/**
 * HALAMAN 2 — CHART.
 *
 * WebView memuat `/chart-embed` di web: komponen chart yang sama dengan yang
 * dipakai ribuan kali di sana, lapisan SVG zona dan sumbu ikut apa adanya.
 *
 * SATU HARGA, BUKAN DUA.
 *
 * Versi pertama layar ini menarik harganya sendiri dari `/api/bacaan` dan
 * hasilnya terukur: bilah 4.351,04 sementara chip di dalam chart 4.350,47 —
 * dua angka untuk satu hal di satu layar, karena bilah menunggu tiga lapis
 * keterlambatan (harga berjalan bot sampai 28 detik, cache nginx 20 detik,
 * jeda tarik app 20 detik) sementara chart menerima tick langsung.
 *
 * Sekarang WebView MENGIRIMKAN harga hidupnya lewat `postMessage`, dan bilah
 * memakainya begitu datang. Alasan asli tetap dihormati: `/api/bacaan` tetap
 * mengisi detik-detik pertama, jadi bilah tidak pernah kosong menunggu chart.
 */
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { ASAL } from '../data/antrian';
import { ambilBacaan, type Pasar } from '../data/api';
import { angka } from '../data/tampil';
import { W, H, J, R, ANGKA } from '../gaya/token';

/**
 * Disuntikkan ke dalam halaman embed. Ia membaca kait uji yang SUDAH ADA di
 * komponen chart web (`__chartUji.harga()`), jadi tidak ada satu baris pun
 * yang perlu ditambahkan di sisi web untuk ini.
 */
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

type Props = { pasar: Pasar; tf: string; gantiTf: (tf: string) => void; bukaBacaan: () => void };

export function LayarChart({ pasar, tf, gantiTf, bukaBacaan }: Props) {
  const [harga, setHarga] = useState<number | null>(null);
  /** Harga dari dalam chart menang; dari API cuma pengisi awal. */
  const dariChart = useRef(false);
  const [memuat, setMemuat] = useState(true);

  const url = `${ASAL}/chart-embed?pair=${encodeURIComponent(pasar.simbol)}&tf=${encodeURIComponent(tf)}`;

  useEffect(() => {
    dariChart.current = false;
    setHarga(null);
    let batal = false;
    void ambilBacaan(pasar.simbol, tf).then((j) => {
      if (batal || dariChart.current) return;
      if (j.ok && j.isi.harga > 0) setHarga(j.isi.harga);
    });
    return () => { batal = true; };
  }, [pasar.simbol, tf]);

  const pesan = (e: WebViewMessageEvent): void => {
    try {
      const j = JSON.parse(e.nativeEvent.data) as { harga?: number };
      if (typeof j.harga === 'number' && j.harga > 0) { dariChart.current = true; setHarga(j.harga); }
    } catch { /* pesan yang tidak kami mengerti diabaikan, bukan menjatuhkan layar */ }
  };

  return (
    <View style={g.akar}>
      <View style={g.bilah}>
        <View style={g.bilahAtas}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={g.simbol} numberOfLines={1}>{pasar.simbol}</Text>
            <Text style={g.label} numberOfLines={1}>{pasar.label}</Text>
          </View>
          <Text style={g.harga}>{angka(harga, pasar.desimal)}</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={g.tabs}>
          {/* Timeframe yang DITAWARKAN mengikuti pasar ini, bukan daftar global:
              emas dan forex tidak membaca timeframe yang sama dengan kripto. */}
          {pasar.timeframes.map((t) => {
            const k = t.toLowerCase();
            const on = k === tf;
            return (
              <Pressable key={t} onPress={() => { gantiTf(k); setMemuat(true); }} style={[g.tab, on && g.tabOn]}>
                <Text style={[g.tabTeks, on && g.tabTeksOn]}>{t.toUpperCase()}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={g.wadah}>
        <WebView
          key={url}
          source={{ uri: url }}
          style={g.web}
          backgroundColor="#0B0B0D"
          onLoadStart={() => { setMemuat(true); }}
          onLoadEnd={() => { setMemuat(false); }}
          onMessage={pesan}
          injectedJavaScript={SUNTIK}
          /* Cubit dan geser milik chart, bukan WebView: kalau WebView ikut
             menzum, yang membesar gambar berikut hurufnya — bukan skalanya. */
          scalesPageToFit={false}
          setBuiltInZoomControls={false}
          scrollEnabled={false}
          bounces={false}
          overScrollMode="never"
          javaScriptEnabled
          domStorageEnabled
          /* Dikunci ke asal kita sendiri, bukan kartu liar apa pun. WebView yang
             boleh menavigasi ke mana saja adalah permukaan serang yang tidak
             kita butuhkan — halaman ini cuma perlu satu alamat. Soket bursa
             tetap jalan: `wss://` itu subresource, bukan navigasi. */
          originWhitelist={[ASAL]}
        />
        {memuat && (
          <View style={g.tunggu} pointerEvents="none"><ActivityIndicator color={W.teksRedup} /></View>
        )}
      </View>

      <Pressable onPress={bukaBacaan} style={g.bacaTombol}>
        <Text style={g.bacaTeks}>Baca analisanya</Text>
      </Pressable>
    </View>
  );
}

const g = StyleSheet.create({
  akar: { flex: 1, backgroundColor: W.latar },
  bilah: { paddingHorizontal: J.x3, paddingTop: J.x2, paddingBottom: J.x2, borderBottomWidth: 1, borderBottomColor: W.garis },
  bilahAtas: { flexDirection: 'row', alignItems: 'flex-end', gap: J.x3 },
  simbol: { fontSize: H.nama, fontWeight: '700', color: W.teksKuat },
  label: { fontSize: H.label, color: W.teksSamar, marginTop: 1 },
  harga: { fontSize: H.harga, fontWeight: '700', color: W.teksKuat, ...ANGKA },
  tabs: { gap: 6, paddingTop: J.x2 },
  tab: { paddingVertical: 5, paddingHorizontal: J.x3, borderRadius: R.sedang, borderWidth: 1, borderColor: W.garis, backgroundColor: W.kartu },
  tabOn: { backgroundColor: W.teksKuat, borderColor: W.teksKuat },
  tabTeks: { fontSize: H.kontrol, color: W.teksRedup },
  tabTeksOn: { color: W.latar, fontWeight: '500' },
  wadah: { flex: 1, backgroundColor: '#0B0B0D' },
  web: { flex: 1, backgroundColor: '#0B0B0D' },
  tunggu: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  bacaTombol: { margin: J.x3, paddingVertical: J.x3, borderRadius: R.besar, backgroundColor: W.kartuTerang, borderWidth: 1, borderColor: W.garis, alignItems: 'center' },
  bacaTeks: { fontSize: H.kontrol, color: W.teksKuat, fontWeight: '500' },
});
