/**
 * CHART TERTANAM — WebView di HP, <iframe> di web.
 *
 * Web dipakai untuk MEMOTRET layar (skrip/potret-layar.mts) supaya tata
 * letak bisa dibandingkan dengan mockup, bukan cuma dibaca dari kode.
 * `react-native-webview` tidak punya implementasi web, dan tanpa cabang ini
 * seluruh layar Pasar gagal dirender di sana.
 */
import { Platform } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { createElement } from 'react';

type Props = {
  url: string;
  asal: string;
  suntik: string;
  latar: string;
  onMuat: (memuat: boolean) => void;
  onPesan: (e: WebViewMessageEvent) => void;
  /**
   * Token sesi MINI (bukan Clerk) — disuntik ke `localStorage['am_sesi_mini']`
   * SEBELUM halaman dimuat, kunci yang sama yang dibaca web di `miniapp.ts`.
   * Tanpa ini chart tertanam selalu anonim, jadi m5 emas/forex milik pelanggan
   * AM+ dijawab tembok "bagian AnalisMarket+" — persis bug Mini App 13 Sep,
   * terulang di permukaan ketiga. Clerk tidak bisa lewat sini: tokennya
   * pendek umur dan halaman embed punya Clerk-nya sendiri.
   */
  sesi?: string;
};

export function ChartTertanam({ url, asal, suntik, latar, onMuat, onPesan, sesi }: Props) {
  if (Platform.OS === 'web') {
    return createElement('iframe', {
      src: url,
      style: { border: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', background: latar, display: 'block' },
      onLoad: () => { onMuat(false); },
    });
  }
  return (
    <WebView
      /* TANPA `key={url}`. Dulu tiap ganti timeframe/pasar membuang seluruh
         WebView dan membangunnya dari nol — layar hitam sesaat, chart dimuat
         ulang, dan itu terasa sebagai app yang tersendat. Mengganti `source`
         saja membuat WebView bernavigasi di tempat. */
      source={{ uri: url }}
      androidLayerType="hardware"
      cacheEnabled
      nestedScrollEnabled={false}
      style={{ flex: 1, backgroundColor: latar }}
      backgroundColor={latar}
      onLoadStart={() => { onMuat(true); }}
      onLoadEnd={() => { onMuat(false); }}
      onMessage={onPesan}
      injectedJavaScript={suntik}
      injectedJavaScriptBeforeContentLoaded={sesi === undefined || sesi === ''
        ? undefined
        : `try{localStorage.setItem('am_sesi_mini',${JSON.stringify(sesi)})}catch(e){};true;`}
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
