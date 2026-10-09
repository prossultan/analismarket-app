/**
 * PEMUTAR VIDEO AKADEMI — WebView yang sudah terpasang untuk chart.
 *
 * Kenapa bukan `expo-video`: modul native baru berarti build baru, izin
 * baru yang harus diperiksa (`periksa-apk` — pustaka di proyek ini sudah
 * tiga kali menyelundupkan izin), dan APK yang lebih besar. Pemutar Bunny
 * Stream toh halaman web (iframe bertanda tangan), dan cadangan MP4-nya
 * cukup `<video controls playsinline>` — kendali bawaan, layar penuh, dan
 * geser waktu tanpa satu pun dependensi baru.
 *
 * Halaman pembungkusnya, jembatan player.js, dan aturan navigasinya ada di
 * `src/data/pemutar.ts` (murni, diuji). Komponen ini cuma memasangnya.
 */
import { createElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { ASAL } from '../data/antrian';
import { bolehDimuatPemutar, htmlBunny, htmlMp4, uraiPesanPemutar } from '../data/pemutar';

type Props = {
  url: string;
  jenis: 'mp4' | 'iframe';
  judul: string;
  /** Detik untuk melanjutkan; 0 = dari awal. Dibaca SEKALI, saat pemutar dipasang. */
  mulai: number;
  onWaktu: (detik: number, durasi: number) => void;
  onGalat: () => void;
};

/** Harness web: `ReactNativeWebView` disulih supaya halaman pembungkus yang SAMA melapor ke parent. */
const SULIH_WEB = '<script>window.ReactNativeWebView={postMessage:function(s){parent.postMessage({pemutar:s},"*")}};</script>';

export function PemutarVideo({ url, jenis, judul, mulai, onWaktu, onGalat }: Props) {
  /* `mulai` dibekukan saat pemutar dipasang. Kemajuan yang dicatat tiap tiga
     detik mengubah prop ini; halaman yang dibangun ulang darinya adalah
     WebView yang memuat ulang videonya tiap tiga detik. */
  const [awal] = useState(mulai);
  const waktu = useRef(onWaktu);
  const galat = useRef(onGalat);
  useEffect(() => { waktu.current = onWaktu; galat.current = onGalat; });
  const html = useMemo(() => (jenis === 'iframe' ? htmlBunny(url, awal) : htmlMp4(url, awal)), [url, jenis, awal]);
  const sumber = useMemo(() => ({ html, baseUrl: ASAL }), [html]);
  const terima = useCallback((data: string): void => {
    const p = uraiPesanPemutar(data);
    if (p === null) return;
    if (p.jenis === 'galat') galat.current();
    else waktu.current(p.t, p.d);
  }, []);

  const bingkai = useRef<HTMLIFrameElement | null>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const dengar = (e: MessageEvent): void => {
      if (e.source !== bingkai.current?.contentWindow || e.data === null || typeof e.data !== 'object') return;
      const isi = (e.data as { pemutar?: unknown }).pemutar;
      if (typeof isi === 'string') terima(isi);
    };
    window.addEventListener('message', dengar);
    return () => { window.removeEventListener('message', dengar); };
  }, [terima]);

  if (Platform.OS === 'web') {
    return createElement('iframe', {
      ref: bingkai, title: judul, srcDoc: html.replace('<body>', `<body>${SULIH_WEB}`),
      allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowFullScreen: true,
      style: { width: '100%', height: '100%', border: 0, background: '#000', display: 'block' },
    });
  }
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <WebView
        source={sumber}
        /* `originWhitelist` di react-native-webview cuma memutuskan apa yang
           DISERAHKAN ke peramban HP (Linking.openURL) — dan dari pemutar,
           tidak ada yang boleh. Semua penyaringan di `bolehDimuatPemutar`;
           daftar yang sempit justru membuka iframe Bunny di Safari, karena
           iOS menanyakan navigasi iframe juga. */
        originWhitelist={['*']}
        onShouldStartLoadWithRequest={(r) => bolehDimuatPemutar(r.url)}
        setSupportMultipleWindows={false}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        androidLayerType="hardware"
        onMessage={(e: WebViewMessageEvent) => { terima(e.nativeEvent.data); }}
        onRenderProcessGone={() => { galat.current(); }}
        onContentProcessDidTerminate={() => { galat.current(); }}
        accessibilityLabel={judul}
        style={{ flex: 1, backgroundColor: '#000' }}
      />
    </View>
  );
}
