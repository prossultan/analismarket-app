/**
 * PEMUTAR AKADEMI — keputusan murni di balik `PemutarVideo`. Tanpa impor
 * React Native, supaya `uji-keputusan.mjs` bisa MENJALANKANNYA (termasuk
 * skrip jembatan di dalam halaman pembungkus), bukan membaca bentuknya.
 *
 * Dua jenis jawaban `/api/saya/akademi/putar` (bot `src/lib/akademi/api.ts`):
 *
 * - `iframe` — pemutar Bunny Stream bertanda tangan, sejak video Akademi
 *   dipindah pemilik ke sana (9 Okt 2026). Diterbitkan HANYA untuk klien yang
 *   mengirim `dukung=iframe`, dan diputar di dalam halaman pembungkus yang
 *   berasal analismarket.com — iframe-nya membawa Referer yang sama dengan
 *   web, dan kemajuan menonton dibaca lewat protokol player.js.
 * - `mp4` — rute satu asal `/api/saya/akademi/video/…` (sekarang meneruskan
 *   MP4 dari CDN Bunny lewat VPS). Cadangan untuk server tanpa kunci Bunny.
 */
import { ASAL } from './antrian';
import { asalUrl } from './sesiChart';

/**
 * Satu-satunya asal pihak lain yang boleh DITANAM di app. URL iframe dari
 * server diterima hanya kalau asalnya persis ini — jawaban karangan atau
 * server yang disusupi tidak boleh bisa membingkai halaman lain di layar
 * Akademi. Sama dengan `ASAL_BUNNY` di web dan di bot.
 */
export const ASAL_BUNNY = 'https://iframe.mediadelivery.net';

/**
 * `/embed/<library>/<guid>` dengan kueri yang hurufnya dibatasi. Kuerinya
 * ikut dibatasi karena URL ini ditulis ke atribut HTML halaman pembungkus:
 * tanda kutip atau `<` di kueri adalah HTML, bukan alamat.
 */
const JALUR_BUNNY = /^\/embed\/\d+\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\?[A-Za-z0-9=&._~%-]*)?$/i;

export function alamatBunny(url: string): string | null {
  if (asalUrl(url) !== ASAL_BUNNY) return null;
  return JALUR_BUNNY.test(url.slice(ASAL_BUNNY.length)) ? url : null;
}

/**
 * Navigasi yang boleh terjadi di WebView pemutar: halaman pembungkus kita
 * sendiri dan pemutar Bunny — tidak ada yang lain, di bingkai mana pun.
 *
 * Bingkainya SENGAJA tidak dibedakan: react-native-webview di Android selalu
 * melaporkan `isTopFrame: true` (13.16.1, TopShouldStartLoadWithRequestEvent),
 * jadi aturan "Bunny cuma di iframe" akan memblokir iframe-nya sendiri kalau
 * Android suatu hari menanyakannya. Bunny di bingkai atas cuma memutus
 * jembatan kemajuan, bukan membuka halaman asing.
 */
export function bolehDimuatPemutar(url: string): boolean {
  if (url === 'about:blank' || url === 'about:srcdoc') return true;
  const asal = asalUrl(url);
  return asal !== null && ((ASAL !== '' && asal === ASAL) || asal === ASAL_BUNNY);
}

/** Alamat dari server ditulis ke atribut HTML: tanda kutip di dalamnya bukan urusan HTML. */
function atribut(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function detikAwal(mulai: number): string {
  return String(Number.isFinite(mulai) && mulai > 0 ? Math.floor(mulai) : 0);
}

const KEPALA = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}video,iframe{position:absolute;top:0;left:0;width:100%;height:100%;border:0;background:#000;display:block}video{object-fit:contain}</style></head><body>`;

/**
 * Jembatan player.js — sama dengan `PemutarBunny` di web: halaman ini
 * MENDAFTAR ke `timeupdate`, `pause`, dan `ended`, dan pesan cuma diterima
 * dari jendela iframe itu sendiri dengan asal Bunny. Posisi tersimpan
 * dipasang sekali sesudah `ready`. Ke React Native dikirim `{t, d}` — bentuk
 * yang sama dengan pemutar MP4, jadi `catatPosisi` tidak tahu bedanya.
 *
 * `error` SENGAJA tidak didengar: pemutar Bunny menampilkan galatnya sendiri,
 * dan galat sesaat yang dipulihkannya tidak boleh mencabut pemutarnya.
 */
export function skripJembatanBunny(mulai: number): string {
  return `(function(){
  var ASAL = ${JSON.stringify(ASAL_BUNNY)}; var mulai = ${detikAwal(mulai)};
  var f = document.getElementById('f'); var dilanjut = false; var akhir = -10; var t = 0; var d = 0;
  function rn(x){ try { window.ReactNativeWebView.postMessage(JSON.stringify(x)); } catch (e) {} }
  function kirim(method, value){ try { f.contentWindow.postMessage(JSON.stringify({ context: 'player.js', version: '0.0.11', method: method, value: value }), ASAL); } catch (e) {} }
  window.addEventListener('message', function(e){
    if (e.origin !== ASAL || e.source !== f.contentWindow) return;
    var m = e.data;
    if (typeof m === 'string') { try { m = JSON.parse(m); } catch (x) { return; } }
    if (m === null || typeof m !== 'object' || m.context !== 'player.js') return;
    if (m.event === 'ready') {
      kirim('addEventListener', 'timeupdate'); kirim('addEventListener', 'pause'); kirim('addEventListener', 'ended');
      if (!dilanjut && mulai > 5) { dilanjut = true; kirim('setCurrentTime', mulai); }
      return;
    }
    var v = m.value;
    if (m.event === 'timeupdate' && v !== null && typeof v === 'object' && typeof v.seconds === 'number' && typeof v.duration === 'number') {
      t = v.seconds; d = v.duration;
      if (Math.abs(Math.floor(t) - akhir) >= 3) { akhir = Math.floor(t); rn({ t: t, d: d }); }
      return;
    }
    if (m.event === 'pause' && d > 0) { rn({ t: t, d: d }); return; }
    if (m.event === 'ended' && d > 0) rn({ t: d, d: d });
  });
})();`;
}

export function htmlBunny(url: string, mulai: number): string {
  return `${KEPALA}<iframe id="f" src="${atribut(url)}" allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="origin"></iframe>
<script>${skripJembatanBunny(mulai)}
true;</script></body></html>`;
}

/** Cadangan MP4 satu asal. Kemajuan dilaporkan tiap ±3 detik, saat jeda, dan saat selesai. */
export function htmlMp4(url: string, mulai: number): string {
  return `${KEPALA}<video id="v" src="${atribut(url)}" controls playsinline autoplay preload="auto" controlsList="nodownload" disablePictureInPicture></video>
<script>
(function(){
  var v = document.getElementById('v'); var mulai = ${detikAwal(mulai)}; var akhir = -10;
  function kirim(x){ try { window.ReactNativeWebView.postMessage(JSON.stringify(x)); } catch (e) {} }
  v.addEventListener('loadedmetadata', function(){ if (mulai > 0 && mulai < v.duration - 5) v.currentTime = mulai; });
  v.addEventListener('timeupdate', function(){ var s = Math.floor(v.currentTime); if (Math.abs(s - akhir) >= 3) { akhir = s; kirim({ t: v.currentTime, d: v.duration }); } });
  v.addEventListener('pause', function(){ kirim({ t: v.currentTime, d: v.duration }); });
  v.addEventListener('ended', function(){ kirim({ t: v.duration, d: v.duration }); });
  v.addEventListener('error', function(){ kirim({ galat: true }); });
})();
true;
</script></body></html>`;
}

/** Pesan dari halaman pembungkus. Yang tidak dikenal = null, bukan galat. */
export type PesanPemutar = { jenis: 'waktu'; t: number; d: number } | { jenis: 'galat' };
export function uraiPesanPemutar(data: string): PesanPemutar | null {
  try {
    const j = JSON.parse(data) as { t?: unknown; d?: unknown; galat?: unknown } | null;
    if (j === null || typeof j !== 'object') return null;
    if (j.galat === true) return { jenis: 'galat' };
    if (typeof j.t === 'number' && typeof j.d === 'number' && Number.isFinite(j.t) && Number.isFinite(j.d) && j.d > 0) return { jenis: 'waktu', t: j.t, d: j.d };
    return null;
  } catch { return null; }
}

/**
 * Detik untuk melanjutkan. Video yang sudah SELESAI diputar ulang dari awal:
 * posisinya tersimpan di ujung, dan melanjutkan dari ujung berarti layar
 * hitam yang langsung berakhir.
 */
export function detikLanjut(posisi: number | undefined, selesai: boolean): number {
  return selesai || posisi === undefined || !Number.isFinite(posisi) || posisi < 0 ? 0 : posisi;
}
