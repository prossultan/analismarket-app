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

/** Skrip yang disuntik ke WebView: pasang token, atau hapus kalau tidak ada sesi. */
export function skripSesiChart(token: string | null): string {
  const isi = token === null || token === ''
    ? `localStorage.removeItem(${JSON.stringify(KUNCI_SESI_CHART)})`
    : `localStorage.setItem(${JSON.stringify(KUNCI_SESI_CHART)},${JSON.stringify(token)})`;
  return `try{${isi}}catch(e){};true;`;
}
