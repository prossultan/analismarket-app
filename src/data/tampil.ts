/**
 * Angka gaya Indonesia TANPA `Intl`.
 *
 * Hermes tidak selalu membawa data ICU penuh, dan harga yang jatuh ke format
 * Amerika (4,359.77) di sebagian HP adalah bentuk lain dari dua permukaan
 * yang berkata berbeda.
 */

/** `null` dirender em dash. TIDAK PERNAH 0 — tidak diketahui bukan nol. */
export function angka(n: number | null | undefined, desimal = 2): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  const tetap = Math.abs(n).toFixed(desimal);
  const [bulat, pecahan] = tetap.split('.');
  const dikelompok = (bulat ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const tanda = n < 0 ? '-' : '';
  return pecahan === undefined ? `${tanda}${dikelompok}` : `${tanda}${dikelompok},${pecahan}`;
}

/** Perubahan persen selalu bertanda: `+1,24` / `-0,80` / `—`. */
export function ubah(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return `${n > 0 ? '+' : ''}${angka(n, 2)}`;
}

export function volumeRingkas(usd: number): string {
  if (!Number.isFinite(usd) || usd <= 0) return '—';
  if (usd >= 1e9) return `${angka(usd / 1e9, 1)} M`;
  if (usd >= 1e6) return `${angka(usd / 1e6, 1)} jt`;
  if (usd >= 1e3) return `${angka(usd / 1e3, 0)} rb`;
  return angka(usd, 0);
}

const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

/** WIB, dan disebutkan — jam tanpa zona waktu di produk pasar adalah jebakan. */
export function jamWib(detik: number): string {
  const d = new Date(detik * 1000 + 7 * 3600 * 1000);
  const jj = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${jj}.${mm}`;
}

export function tanggalWib(detik: number): string {
  const d = new Date(detik * 1000 + 7 * 3600 * 1000);
  return `${String(d.getUTCDate())} ${BULAN[d.getUTCMonth()] ?? ''}`;
}

export function kunciHariWib(detik: number): string {
  const d = new Date(detik * 1000 + 7 * 3600 * 1000);
  return `${String(d.getUTCFullYear())}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

const LABEL_JENIS: Record<string, string> = { kripto: 'kripto', 'komoditas-forex': 'emas & forex' };
export function labelJenis(j: string): string { return LABEL_JENIS[j] ?? j; }

const KATEGORI_URUT = ['major', 'ai', 'meme', 'l1l2', 'defi', 'rwa', 'lainnya'];
const LABEL_KATEGORI: Record<string, string> = {
  major: 'Major', ai: 'AI', meme: 'Meme', l1l2: 'L1/L2', defi: 'DeFi', rwa: 'RWA', lainnya: 'Lainnya',
};
export function labelKategori(k: string): string { return LABEL_KATEGORI[k] ?? k; }

/** Urutan baku dulu, lalu kategori tak dikenal di belakang — tidak pernah dibuang. */
export function kategoriTersedia(daftar: ReadonlyArray<{ kategori: string }>): string[] {
  const ada = new Set(daftar.map((p) => p.kategori));
  const urut = KATEGORI_URUT.filter((k) => ada.has(k));
  const sisa = [...ada].filter((k) => !KATEGORI_URUT.includes(k)).sort();
  return ['semua', ...urut, ...sisa];
}

/**
 * BIAYA SEBAGAI PORSI RISIKO — `biayaPorsi` SUDAH DALAM PERSEN.
 *
 * Bukan pecahan. Di bot `bulatkan.ts` menghitungnya
 * `(biayaBps / stopBps) * 100`, dan komentarnya berbunyi "dalam persen".
 * Server pun mengatakannya sendiri di kalimat syaratnya:
 *
 *   biayaPorsi = 8.64
 *   kalimat    = "Biaya 9,0 bps vs jarak SL 104,2 bps — 9% dari risiko"
 *
 * App sempat mengalikannya 100 lagi di DUA tempat, jadi setup sehat berbiaya
 * 8,6% tercetak "Biaya 864% risiko" — angka yang mustahil, di kartu yang
 * seharusnya membantu orang memutuskan. Dan bilahnya ikut: ambangnya ditulis
 * 0,5 dan 1, jadi apa pun di atas 1% terisi penuh dan merah.
 *
 * Satu fungsi, satu satuan, dan `skrip/periksa-satuan.mjs` melarang
 * `biayaPorsi` dikalikan di tempat lain.
 */
export function biayaPersen(porsi: number): string {
  return `${String(Math.round(porsi))}%`;
}

/** Lebar bilah 0..100, dipotong di 100. Ambangnya PERSEN, bukan pecahan. */
export function biayaLebar(porsi: number): number {
  return Math.max(2, Math.min(100, porsi));
}

/** Wajar di bawah 50% risiko — ambang yang sama dengan syarat BIAYA di bot. */
export const BIAYA_WAJAR_PERSEN = 50;
