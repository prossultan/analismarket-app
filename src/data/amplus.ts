/**
 * Isi AnalisMarket+ — DIANGKUT APA ADANYA dari `ambilFiturGratis()` dan
 * `ambilFiturAmPlus()` di web.
 *
 * HARGANYA IKUT, TOMBOLNYA MATI. Keputusan pemilik: orang boleh tahu berapa,
 * tapi app tidak memproses pembayaran dan tidak mengarahkan ke luar.
 *
 * Komentar di tempat ini dulu berbunyi "harganya sengaja tidak ikut" — dan
 * berhari-hari `AmPlus.tsx` justru mengetik "Rp 99.000" beberapa baris di
 * bawahnya. Bukan cuma bertentangan dengan komentarnya: angkanya SALAH,
 * hampir dua kali lipat harga sebenarnya. Itu bentuk kegagalan yang paling
 * mahal di halaman harga, dan yang membuatnya bertahan adalah tidak adanya
 * satu tempat yang memegang angkanya.
 */
export type Fitur = { nama: string; keterangan: string };

export const FITUR_GRATIS: readonly Fitur[] = [
  { nama: 'Semua pasar m15 ke atas', keterangan: 'termasuk emas dan forex' },
  { nama: 'm1 dan m5 kripto', keterangan: 'tanpa batas' },
  { nama: '10 pantauan', keterangan: 'tetap 10' },
  { nama: 'Cek token DEX', keterangan: 'dan kelima mesin' },
];

export const FITUR_PLUS: readonly Fitur[] = [
  { nama: 'Kabar Otomatis', keterangan: 'pasar dipantau otomatis, termasuk m5' },
  { nama: 'Cek Banyak', keterangan: '12 pasar sekali tekan, satu tabel' },
  { nama: 'm1 & m5 emas/forex', keterangan: '20 analisa sehari' },
  { nama: 'Antrean prioritas', keterangan: 'kartumu duluan kalau bot lagi ramai' },
  { nama: 'Jam sunyi & irama kabar', keterangan: 'diatur sendiri' },
  { nama: 'Rangkuman pagi', keterangan: 'semalam apa saja yang bunyi, satu pesan' },
];

/** Ambang yang dipakai bar biaya, sama dengan web. */
export const AMBANG_MUTU = 0.5;
export const LANTAI_CETAK = 1;

/**
 * PAKET AnalisMarket+ — DITURUNKAN dari `PAKET_PLUS` di
 * `~/apps/analisa/src/lib/langganan.ts`, yang adalah satu-satunya tempat
 * harga ini benar-benar ditagihkan.
 *
 * Tidak bisa diambil lewat jaringan: `/api/saya/plus` ada di balik gerbang
 * sesi, jadi orang yang belum menyambungkan Telegram — persis orang yang
 * sedang bertanya "berapa" — tidak bisa membacanya. Tidak ada endpoint harga
 * publik. Jadi angkanya disalin, dan `skrip/periksa-harga.mjs` yang menjaga
 * salinannya tidak menyimpang.
 */
export type PaketPlus = { kode: string; bulan: number; hargaRp: number };

export const PAKET_PLUS: readonly PaketPlus[] = [
  { kode: '1B', bulan: 1, hargaRp: 50_000 },
  { kode: '3B', bulan: 3, hargaRp: 135_000 },
  { kode: '6B', bulan: 6, hargaRp: 250_000 },
  { kode: '12B', bulan: 12, hargaRp: 480_000 },
];

/** "Rp 50.000" — titik ribuan gaya Indonesia, tanpa desimal. */
export function rupiah(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

/**
 * APP INI DIPASANG LEWAT TOKO YANG MELARANG MENGARAHKAN PEMBELIAN KE LUAR.
 *
 * Kebijakan pembayaran Google Play: app yang membuka fitur berbayar di dalam
 * dirinya wajib memakai penagihan Play, dan DILARANG menyebut harga atau
 * mengarahkan orang ke jalur pembelian di luar app. AnalisMarket+ ditagih
 * lewat bot Telegram, jadi build untuk Play tidak boleh menyebut angkanya
 * maupun caranya. Build yang dibagikan lewat tautan unduhan sendiri tidak
 * tunduk pada aturan itu dan tetap menyebut keduanya.
 *
 * Satu saklar, dipasang profil build `produksi` di `eas.json`. Bukan dua
 * cabang yang disebar: `hargaPlus()` di bawah adalah SATU-SATUNYA tempat
 * angka harga boleh lahir, dan `skrip/periksa-toko.mjs` menuntutnya begitu.
 */
export const TOKO_PLAY = process.env.EXPO_PUBLIC_TOKO === 'play';

const SATU_PAKET = PAKET_PLUS[0] as PaketPlus;

/**
 * Harga siap cetak, atau `null` kalau app ini build untuk Play.
 *
 * `null` berarti JANGAN cetak barisnya sama sekali — bukan cetak "—", dan
 * bukan cetak kalimat pengganti yang menjelaskan ke mana harus membeli.
 * Kalimat seperti itu persis yang dilarang.
 */
export function hargaPlus(): { harga: string; hari: string } | null {
  if (TOKO_PLAY) return null;
  return { harga: rupiah(SATU_PAKET.hargaRp), hari: String(SATU_PAKET.bulan * 30) };
}
