/**
 * SESI UNTUK CHART TERTANAM — murni, tanpa impor.
 *
 * Halaman `/chart-embed` di web mengambil `/api/bacaan` dengan Bearer dari
 * `tokenSesiSekarang` (`src/data/akun.ts` web): `localStorage['am_sesi_mini']`
 * dulu, lalu sesi Clerk halaman itu sendiri. Di dalam WebView app tidak ada
 * sesi Clerk web, jadi satu-satunya pintu adalah kunci localStorage itu.
 *
 * Server menerima DUA jenis token di Bearer yang sama — sesi mini DAN JWT
 * Clerk (`pemohonDariToken` di `src/lib/health.ts` bot: bentuk token yang
 * menentukan jalurnya). Jadi token sesi Google pun sah ditaruh di kunci itu.
 *
 * Sampai 3 Okt hanya sesi MINI yang disuntik (`sesi?.jenis === 'mini'` di
 * layar Pasar). Chart pengguna Google selalu anonim: mesin AM+ tidak tampil
 * dan m5 emas pelanggan dijawab tembok "bagian AnalisMarket+", padahal
 * bacaan di luar WebView — yang membawa token Clerk lewat `headerSesi` —
 * menjawab 200. Dua permukaan di satu layar yang berbeda pendapat.
 *
 * TANPA SESI, KUNCINYA DIHAPUS — bukan dibiarkan. localStorage WebView hidup
 * melewati keluar-masuk akun: token mini 12 jam milik orang yang tadi keluar
 * akan tetap dibaca halaman itu untuk orang berikutnya di HP yang sama.
 */
export const KUNCI_SESI_CHART = 'am_sesi_mini';

/**
 * Token JWT Clerk berumur ±60 detik. Halaman yang dibiarkan terbuka (m15 ke
 * atas menyegarkan bacaannya sendiri) akan membawa token kedaluwarsa, dan
 * server memperlakukannya sebagai anonim — mesin AM+ hilang dari chart tanpa
 * satu galat pun. Disegarkan lebih rapat daripada umurnya.
 */
export const SEGARKAN_TOKEN_CHART_MS = 40_000;

/**
 * Skrip yang disuntik ke WebView: pasang token, atau hapus kalau tidak ada
 * sesi — HANYA kalau halaman yang sedang terbuka berasal persis `asal`.
 *
 * Skrip ini berjalan di halaman APA PUN yang sedang dimuat WebView, tiap 40
 * detik dan di tiap awal halaman. Sampai 3 Okt ia tidak memeriksa itu, dan
 * `originWhitelist` react-native-webview cuma mencocokkan AWALAN
 * (regex `^` + asal, tanpa `$`): `https://analismarket.com.domain-lain.net`
 * lolos dan dimuat di dalam WebView, lalu menerima JWT Clerk atau sesi mini
 * 12 jam — kunci yang membuka /api/saya/*, termasuk hapus akun.
 */
export function skripSesiChart(token: string | null, asal: string): string {
  const isi = token === null || token === ''
    ? `localStorage.removeItem(${JSON.stringify(KUNCI_SESI_CHART)})`
    : `localStorage.setItem(${JSON.stringify(KUNCI_SESI_CHART)},${JSON.stringify(token)})`;
  return `try{if(location.origin===${JSON.stringify(asal)}){${isi}}}catch(e){};true;`;
}

/**
 * Origin PERSIS sebuah URL (`skema://host[:port]`, huruf kecil), atau `null`.
 * Dibaca sendiri, bukan lewat `URL`: `URL` bawaan React Native tidak lengkap,
 * dan yang dibutuhkan cuma dua bagian. Otoritas diambil utuh — termasuk
 * `pengguna@` dan port — jadi `https://analismarket.com@domain-lain.net`
 * tidak pernah sama dengan `https://analismarket.com`.
 */
export function asalUrl(url: string): string | null {
  const m = /^([a-z][a-z0-9+.-]*):\/\/([^/?#\\]*)/i.exec(url);
  if (m === null || (m[2] ?? '') === '') return null;
  return `${(m[1] ?? '').toLowerCase()}://${(m[2] ?? '').toLowerCase()}`;
}

/**
 * Navigasi bingkai ATAS chart tertanam cuma boleh ke origin yang sama persis.
 * Bingkai dalam (iframe, cuma dilaporkan iOS) tidak dibatasi di sini: token
 * disuntik ke bingkai atas saja, dan iframe beda origin tidak bisa membaca
 * localStorage-nya. URL yang gagal `originWhitelist` tetap dibuka peramban HP
 * oleh react-native-webview sendiri, sebelum fungsi ini ditanya.
 */
export function bolehDimuatChart(url: string, asal: string, bingkaiAtas = true): boolean {
  if (!bingkaiAtas) return true;
  return asal !== '' && asalUrl(url) === asal.toLowerCase();
}
