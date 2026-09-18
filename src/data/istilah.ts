/**
 * Istilah yang tercetak di chart dan kolom bacaan.
 *
 * DIANGKUT APA ADANYA dari `analismarket-web/src/data/istilah.ts`, dan itu
 * disengaja: yang dijelaskan adalah apa yang MESIN INI maksud, bukan definisi
 * buku teks. Kalau app menulis ulang dengan kata sendiri, app dan web akan
 * mengajarkan dua hal berbeda untuk satu kata yang sama.
 */
export type Istilah = { kode: string; nama: string; mesin: string; arti: string };

export const ISTILAH: readonly Istilah[] = [
  { kode: 'OB', nama: 'Order block', mesin: 'smc', arti: 'Lilin terakhir sebelum harga bergerak kuat ke satu arah. Kotak zonanya dipakai sebagai acuan entry kalau belum pernah disentuh lagi (“belum termitigasi”). Diprioritaskan di atas FVG.' },
  { kode: 'FVG', nama: 'Fair value gap', mesin: 'smc', arti: 'Celah harga yang ditinggalkan gerakan cepat: rentang yang tidak sempat diperdagangkan. Digambar tipis bergaris putus. Dipakai sebagai zona entry hanya kalau tidak ada order block yang layak.' },
  { kode: 'BOS', nama: 'Break of structure', mesin: 'smc', arti: 'Harga menembus puncak atau lembah terakhir SEARAH struktur yang sedang berjalan. Penanda bahwa tren masih dilanjutkan.' },
  { kode: 'CHoCH', nama: 'Change of character', mesin: 'smc', arti: 'Penembusan pertama yang BERLAWANAN dengan struktur sebelumnya. Penanda bahwa arah mungkin berbalik; level CHoCH terakhir ikut diawasi.' },
  { kode: 'SWEEP', nama: 'Sapuan likuiditas', mesin: 'smc', arti: 'Harga menusuk sedikit melewati puncak atau lembah lama lalu kembali. Bulatan kuning di chart. Yang dihitung sebagai syarat hanya sapuan di sisi berlawanan arah rencana yang masih baru.' },
  { kode: 'TENGAH', nama: 'Tengah rentang (EQ)', mesin: 'smc', arti: 'Titik tengah rentang harga yang sedang berlaku (dealing range). Di bawahnya harga dianggap murah (discount, cocok untuk beli), di atasnya mahal (premium, cocok untuk jual). Kalau rentangnya belum terbentuk, dipakai titik tengah seluruh lilin yang terlihat.' },
  { kode: 'termitigasi', nama: 'Zona termitigasi', mesin: 'smc', arti: 'Zona yang sudah pernah disentuh harga sesudah terbentuk. Masih digambar, tapi tidak lagi jadi acuan entry pertama.' },
  { kode: 'R nx / S nx', nama: 'Resistance / support n kali sentuh', mesin: 'snr', arti: 'Level mendatar dari titik balik yang berulang: angka di belakangnya jumlah sentuhan. Tiga sentuhan atau lebih dianggap teruji. “Pernah ditembus” berarti harga sempat melewatinya lalu kembali.' },
  { kode: 'Kumo', nama: 'Awan Ichimoku', mesin: 'ichimoku', arti: 'Wilayah antara Senkou A dan Senkou B. Lebar dan letaknya terhadap harga jadi penguat bias; stop diletakkan di seberang awan. Awan yang menjulur ke depan ikut dihitung tapi tidak digambar.' },
  { kode: 'Tenkan / Kijun / Chikou', nama: 'Tiga garis Ichimoku', mesin: 'ichimoku', arti: 'Tenkan-sen garis konversi (9 lilin), Kijun-sen garis dasar (26 lilin) sekaligus acuan entry utama, Chikou harga tutup yang digeser 26 lilin ke belakang — karena itu 26 lilin terakhir tidak punya Chikou.' },
  { kode: 'Swing', nama: 'Swing high / low', mesin: 'ema200, fibonacci', arti: 'Puncak atau lembah lokal: lilin yang lebih tinggi (atau lebih rendah) dari beberapa lilin di kiri dan kanannya. Level swing terdekat diawasi; SL ditaruh di luar ujung swing.' },
  { kode: 'Retracement', nama: 'Koreksi Fibonacci', mesin: 'fibonacci', arti: 'Entry ditaruh di 61,8% koreksi dari ayunan impuls terakhir (dua swing berurutan yang berlawanan). Tanpa ayunan yang terbaca, mesin ini tidak punya premis — bukan gagal, memang tidak ada yang bisa diukur.' },
  { kode: 'EMA200', nama: 'Rata-rata bergerak 200', mesin: 'ema200', arti: 'Garis oranye. Biasnya dari EMA50 terhadap EMA200 (EMA50 di atas = bullish), entry saat harga mundur menyentuh EMA200. Dihitung dengan riwayat panjang supaya nilainya cocok dengan TradingView.' },
  { kode: 'ATR', nama: 'Average true range', mesin: 'semua', arti: 'Rentang gerak rata-rata satu lilin. Jarak entry dari harga sekarang dan lebar SL dinyatakan dalam ATR; rencana yang entry-nya lebih jauh dari 2 ATR tidak dicetak.' },
  { kode: 'biaya', nama: 'Biaya dari risiko', mesin: 'semua', arti: 'Ongkos masuk-keluar (fee dan slippage) dibagi jarak stop loss. Di bawah 50% wajar; di atasnya bar jadi arsir; di atas 100% ongkos melebihi seluruh risiko dan angka rencana ditahan.' },
  { kode: 'setup / pantau', nama: 'Keadaan kartu', mesin: 'semua', arti: 'Setup: semua syarat wajib lolos, angka rencana dicetak. Pantau: ada syarat yang belum lolos, angka ditahan sampai lolos. Tidak dicetak: mesin membaca levelnya tapi rencananya ditahan karena sebab yang disebut di kolom bacaan.' },
];
