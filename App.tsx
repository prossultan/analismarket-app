import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, AppState, Platform, Pressable, SafeAreaView,
  StatusBar, StyleSheet, Text, View,
} from 'react-native';
import { WebView } from 'react-native-webview';

/**
 * LAYAR PERTAMA — CHART SAJA.
 *
 * Satu WebView memuat `/chart-embed` di web, dan satu bilah kecil di atasnya
 * memegang simbol, harga, dan timeframe. Yang penting di sini bukan apa yang
 * ada, melainkan pembagian tugasnya:
 *
 *   chart   ← WebView, digambar komponen web yang sudah dipakai ribuan kali
 *   harga   ← React Native, ditarik sendiri dari /api/bacaan
 *
 * Harga TIDAK diambil dari dalam WebView. Kalau ia diambil dari sana, angka
 * di bilah atas baru bisa muncul sesudah seluruh chart selesai diunduh dan
 * digambar — dan tiap kali timeframe diganti ia akan kosong lagi selama
 * WebView memuat ulang. Bilahnya harus tetap benar walau chart-nya belum ada.
 */

const ASAL = 'https://analismarket.com';
const PASAR = 'XAU/USD';
const DESIMAL = 2;
/** Yang ditawarkan di layar pertama. m1/m5 sengaja tidak ada: emas berkuota. */
const TIMEFRAME = ['m15', 'm30', 'h1', 'h4', 'd1'] as const;
type Tf = (typeof TIMEFRAME)[number];
const TF_AWAL: Tf = 'h1';

/**
 * 20 detik — disamakan dengan `proxy_cache_valid 200 20s` di nginx. Lebih
 * rapat dari itu cuma mengunduh salinan cache yang sama sekali lagi; lebih
 * jarang membuat harga di bilah tertinggal dari harga di dalam chart.
 */
const JEDA_HARGA_MS = 20_000;

const WARNA = {
  latar: '#0C0B09',
  chart: '#0B0B0D',
  garis: '#252321',
  teks: '#CFCECB',
  teksKuat: '#E8E7E5',
  teksRedup: '#A7A4A1',
  teksSamar: '#84827E',
};

/**
 * Angka gaya Indonesia tanpa `Intl`. Hermes tidak selalu membawa data ICU
 * penuh, dan angka harga yang jatuh ke format Amerika (4,359.77) di sebagian
 * HP adalah bentuk lain dari dua permukaan yang berkata berbeda.
 */
function angka(n: number, desimal: number): string {
  const tetap = Math.abs(n).toFixed(desimal);
  const [bulat, pecahan] = tetap.split('.');
  const dikelompok = (bulat ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const tanda = n < 0 ? '-' : '';
  return pecahan === undefined ? `${tanda}${dikelompok}` : `${tanda}${dikelompok},${pecahan}`;
}

type Jawaban = { harga?: number };

export default function App() {
  const [tf, setTf] = useState<Tf>(TF_AWAL);
  const [harga, setHarga] = useState<number | null>(null);
  const [memuat, setMemuat] = useState(true);
  const url = `${ASAL}/chart-embed?pair=${encodeURIComponent(PASAR)}&tf=${tf}`;

  /** Jawaban yang datang sesudah timeframe diganti tidak boleh menimpa yang baru. */
  const tfRef = useRef<Tf>(tf);
  tfRef.current = tf;

  const tarikHarga = useCallback(async (untuk: Tf): Promise<void> => {
    try {
      const res = await fetch(`${ASAL}/api/bacaan?pasar=${encodeURIComponent(PASAR)}&tf=${untuk}`);
      if (!res.ok) return;
      const j = (await res.json()) as Jawaban;
      if (tfRef.current !== untuk) return;
      if (typeof j.harga === 'number' && j.harga > 0) setHarga(j.harga);
    } catch {
      /* Jaringan putus bukan alasan mengosongkan angka yang sudah benar tadi. */
    }
  }, []);

  useEffect(() => {
    void tarikHarga(tf);
    const jam = setInterval(() => {
      /* Aplikasi di latar belakang tidak menarik apa-apa: yang dilihat orang
         saat kembali adalah tarikan pertama sesudah ia kembali, bukan antrean
         tarikan yang terjadi saat layarnya mati. */
      if (AppState.currentState !== 'active') return;
      void tarikHarga(tf);
    }, JEDA_HARGA_MS);
    const langganan = AppState.addEventListener('change', (k) => {
      if (k === 'active') void tarikHarga(tf);
    });
    return () => { clearInterval(jam); langganan.remove(); };
  }, [tf, tarikHarga]);

  return (
    <SafeAreaView style={gaya.akar}>
      <StatusBar barStyle="light-content" backgroundColor={WARNA.latar} />

      <View style={gaya.bilah}>
        <View style={gaya.barisAtas}>
          <Text style={gaya.simbol}>{PASAR}</Text>
          <Text style={gaya.harga}>{harga === null ? '—' : angka(harga, DESIMAL)}</Text>
        </View>

        <View style={gaya.tabs}>
          {TIMEFRAME.map((t) => (
            <Pressable
              key={t}
              onPress={() => { setTf(t); setMemuat(true); }}
              style={[gaya.tab, t === tf && gaya.tabAktif]}
              accessibilityRole="button"
              accessibilityState={{ selected: t === tf }}
            >
              <Text style={[gaya.tabTeks, t === tf && gaya.tabTeksAktif]}>{t.toUpperCase()}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={gaya.wadahChart}>
        <WebView
          source={{ uri: url }}
          style={gaya.web}
          /* Latarnya disamakan dengan chart supaya saat memuat yang terlihat
             bukan kilatan putih di antara dua layar gelap. */
          backgroundColor={WARNA.chart}
          onLoadStart={() => { setMemuat(true); }}
          onLoadEnd={() => { setMemuat(false); }}
          /* Cubit-zoom dan geser milik chart, bukan milik WebView: kalau
             WebView ikut menzum halaman, yang membesar adalah gambar chart
             berikut hurufnya, bukan skala harganya. */
          scalesPageToFit={false}
          setBuiltInZoomControls={false}
          bounces={false}
          overScrollMode="never"
          scrollEnabled={false}
          /* Soket harga chart butuh ini di Android; tanpa keduanya WebView
             menahan koneksi campur dan chart diam tanpa satu pesan galat. */
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          originWhitelist={['https://*']}
        />
        {memuat && (
          <View style={gaya.tunggu} pointerEvents="none">
            <ActivityIndicator color={WARNA.teksRedup} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const gaya = StyleSheet.create({
  akar: { flex: 1, backgroundColor: WARNA.latar, paddingTop: Platform.OS === 'android' ? 24 : 0 },
  bilah: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: WARNA.garis },
  barisAtas: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  simbol: { color: WARNA.teksRedup, fontSize: 11, fontWeight: '600', letterSpacing: 0.7 },
  harga: {
    color: WARNA.teksKuat, fontSize: 20, fontWeight: '700',
    /* Monospace supaya angka tidak bergeser tiap kali digitnya berubah. */
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  tabs: { flexDirection: 'row', gap: 6, marginTop: 10 },
  tab: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, borderWidth: 1, borderColor: WARNA.garis },
  tabAktif: { backgroundColor: '#1A1815', borderColor: '#3A3733' },
  tabTeks: { color: WARNA.teksSamar, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  tabTeksAktif: { color: WARNA.teks },
  wadahChart: { flex: 1, backgroundColor: WARNA.chart },
  web: { flex: 1, backgroundColor: WARNA.chart },
  tunggu: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
});
