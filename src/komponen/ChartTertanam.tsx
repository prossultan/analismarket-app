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
};

export function ChartTertanam({ url, asal, suntik, latar, onMuat, onPesan }: Props) {
  if (Platform.OS === 'web') {
    return createElement('iframe', {
      src: url,
      style: { border: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', background: latar, display: 'block' },
      onLoad: () => { onMuat(false); },
    });
  }
  return (
    <WebView
      key={url}
      source={{ uri: url }}
      style={{ flex: 1, backgroundColor: latar }}
      backgroundColor={latar}
      onLoadStart={() => { onMuat(true); }}
      onLoadEnd={() => { onMuat(false); }}
      onMessage={onPesan}
      injectedJavaScript={suntik}
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
