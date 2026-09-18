/**
 * Isi AnalisMarket+ — DIANGKUT APA ADANYA dari `ambilFiturGratis()` dan
 * `ambilFiturAmPlus()` di web.
 *
 * YANG SENGAJA TIDAK IKUT: harganya.
 *
 * Bukan karena lupa. Aturan toko aplikasi melarang app mengarahkan orang ke
 * pembayaran di luar, dan aturan produk kita melarang app menyebut harga web,
 * menautkannya, atau membandingkannya. Sampai IAP mendarat, halaman ini
 * menjawab "apa isinya" dan berhenti di situ — pertanyaan "berapa" tidak
 * dijawab setengah, ia tidak dijawab sama sekali.
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
