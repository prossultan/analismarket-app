/**
 * CHART TERTANAM — WebView di HP, <iframe> di web.
 *
 * Web dipakai untuk MEMOTRET layar (skrip/potret-layar.mts) supaya tata
 * letak bisa dibandingkan dengan mockup, bukan cuma dibaca dari kode.
 * `react-native-webview` tidak punya implementasi web, dan tanpa cabang ini
 * seluruh layar Pasar gagal dirender di sana.
 */
import { Platform, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { createElement, useEffect, useRef, useState } from 'react';
import { SEGARKAN_TOKEN_CHART_MS, skripSesiChart } from '../data/sesiChart';

type Props = {
  url: string;
  asal: string;
  suntik: string;
  latar: string;
  onMuat: (memuat: boolean) => void;
  onPesan: (e: WebViewMessageEvent) => void;
  /**
   * Token sesi YANG SEDANG BERLAKU, jenis apa pun — `tokenSesi` di `sesi.ts`:
   * sesi mini dari simpanan, JWT Clerk diminta ke Clerk tiap kali. Disuntik
   * ke `localStorage['am_sesi_mini']`, kunci yang dibaca halaman embed web
   * sebagai Bearer (lihat `sesiChart.ts`).
   *
   * Sampai 3 Okt yang diterima cuma token MINI (`sesi?: string`), jadi chart
   * pengguna Google selalu anonim. Tanpa fungsi ini (layar sambutan, belum
   * masuk) kuncinya DIHAPUS — sesi orang sebelumnya tidak boleh tertinggal.
   */
  ambilToken?: () => Promise<string | null>;
  /** Berubah saat orangnya berganti sesi — memaksa token dibaca ulang walau URL-nya sama. */
  kunciSesi?: string;
};

const tanpaToken = (): Promise<string | null> => Promise.resolve(null);

export function ChartTertanam({ url, asal, suntik, latar, onMuat, onPesan, ambilToken = tanpaToken, kunciSesi = '' }: Props) {
  const ref = useRef<WebView>(null);
  /* URL dan token BERPASANGAN: halaman baru tidak boleh berangkat dengan
     token milik URL sebelumnya. JWT Clerk umurnya ±60 detik, jadi token
     yang dibaca saat layar pertama dibuka sudah mati saat orangnya ganti
     timeframe dua menit kemudian. `null` = token belum dibaca. */
  const [muatan, setMuatan] = useState<{ url: string; token: string | null } | null>(null);
  useEffect(() => {
    let batal = false;
    void ambilToken().catch(() => null).then((token) => {
      if (batal) return;
      setMuatan({ url, token });
      /* Sesi berganti tapi URL sama: halaman yang sedang terbuka tidak
         dimuat ulang, jadi tokennya ditukar di tempat. */
      ref.current?.injectJavaScript(skripSesiChart(token));
    });
    return () => { batal = true; };
  }, [url, ambilToken, kunciSesi]);

  /* Halaman m15 ke atas menyegarkan bacaannya sendiri; dengan JWT yang sudah
     kedaluwarsa server menjawabnya sebagai anonim dan mesin AM+ hilang dari
     chart tanpa satu galat pun. Token disegarkan lebih rapat dari umurnya. */
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const jam = setInterval(() => {
      void ambilToken().catch(() => null).then((token) => { ref.current?.injectJavaScript(skripSesiChart(token)); });
    }, SEGARKAN_TOKEN_CHART_MS);
    return () => { clearInterval(jam); };
  }, [ambilToken, kunciSesi]);

  if (Platform.OS === 'web') {
    return createElement('iframe', {
      src: url,
      style: { border: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', background: latar, display: 'block' },
      onLoad: () => { onMuat(false); },
    });
  }
  /* Satu kedipan latar sampai token terbaca (sesi mini: seketika; Clerk:
     biasanya dari simpanannya sendiri). Berangkat tanpa token lalu memuat
     ulang justru dua permintaan bacaan, dan yang pertama dijawab anonim. */
  if (muatan === null) return <View style={{ flex: 1, backgroundColor: latar }} />;
  return (
    <WebView
      ref={ref}
      /* TANPA `key={url}`. Dulu tiap ganti timeframe/pasar membuang seluruh
         WebView dan membangunnya dari nol — layar hitam sesaat, chart dimuat
         ulang, dan itu terasa sebagai app yang tersendat. Mengganti `source`
         saja membuat WebView bernavigasi di tempat. */
      source={{ uri: muatan.url }}
      androidLayerType="hardware"
      cacheEnabled
      nestedScrollEnabled={false}
      style={{ flex: 1, backgroundColor: latar }}
      /* `backgroundColor` tidak ada di tipe WebView, tapi diteruskan ke
         tampilan native dan mewarnai latar sebelum halaman tergambar —
         dipertahankan apa adanya. Lewat sebaran karena tipe kelasnya
         menolak properti di luar daftar begitu `ref` ikut dipasang. */
      {...({ backgroundColor: latar } as object)}
      onLoadStart={() => { onMuat(true); }}
      onLoadEnd={() => { onMuat(false); }}
      onMessage={onPesan}
      injectedJavaScript={suntik}
      injectedJavaScriptBeforeContentLoaded={skripSesiChart(muatan.token)}
      scalesPageToFit={false}
      setBuiltInZoomControls={false}
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={[asal]}
    />
  );
}
