/**
 * Syarat & Ketentuan dan Kebijakan Privasi — DIANGKUT APA ADANYA dari
 * `analismarket-web/src/data/bacaan.ts`.
 *
 * Toko aplikasi mensyaratkan keduanya, dan lebih penting dari itu: dokumen
 * hukum yang berbeda antara web dan app berarti dua janji berbeda kepada
 * orang yang sama. Kalau isinya perlu berubah, yang berubah SUMBERNYA di web,
 * lalu diangkut lagi ke sini.
 */
/**
 * DUA KALIMAT DISESUAIKAN DARI SUMBER WEB, DAN INI DAFTARNYA.
 *
 * Web menyebut pemroses pembayarannya di dua tempat: satu kalimat tentang
 * siapa yang menangani pembayaran, dan satu nama di daftar pihak ketiga.
 * Keduanya TIDAK BENAR
 * untuk app ini: app belum memproses pembayaran apa pun dan tidak mengirim
 * data ke pemroses mana pun. Dokumen hukum yang menyebut aliran data yang
 * tidak terjadi lebih buruk daripada dokumen yang pendek.
 *
 * Saat IAP mendarat, kalimatnya berubah menjadi pemroses toko aplikasi —
 * bukan kembali ke kalimat web.
 */
export type Dokumen = { judul: string; berlaku: string; bagian: { judul: string; isi: string }[] };

const DOKUMEN: Record<string, Dokumen> = {
  syarat: {
    judul: 'Syarat & Ketentuan',
    berlaku: 'Berlaku sejak 10 September 2026',
    bagian: [
      { judul: 'Apa layanan ini.', isi: 'analismarket membaca chart pasar dan menampilkan hasil bacaannya. Layanan ini tidak memberi nasihat investasi, tidak menjanjikan hasil, dan tidak mengeksekusi transaksi apa pun.' },
      { judul: 'Keputusan ada padamu.', isi: 'Seluruh angka yang ditampilkan bersifat informasi. Kerugian dari keputusan trading kamu bukan tanggung jawab layanan.' },
      { judul: 'Langganan.', isi: 'AnalisMarket+ dibayar di muka untuk jangka waktu yang dipilih, tanpa potong otomatis. Saat masa aktif habis, setelan kamu disimpan dan berhenti berbunyi.' },
      { judul: 'Data pasar.', isi: 'Sebagian data berasal dari penyedia pihak ketiga dan punya jatah harian bersama. Layanan dapat membatasi pemakaian yang membebani jatah itu.' },
      { judul: 'Akun.', isi: 'Satu orang satu akun. Akses dapat dihentikan bila akun dipakai untuk menyalahgunakan layanan.' },
    ],
  },
  privasi: {
    judul: 'Kebijakan Privasi',
    berlaku: 'Berlaku sejak 10 September 2026',
    bagian: [
      { judul: 'Yang kami simpan.', isi: 'Dari Telegram: id numerik, nama tampilan, username. Dari Google: alamat email dan nama. Selain itu: pasar yang kamu buka, pantauan yang kamu pasang, dan status langgananmu.' },
      { judul: 'Yang tidak kami minta.', isi: 'Kami tidak pernah meminta kunci API bursa, akses akun trading, maupun data kartu. App ini belum memproses pembayaran apa pun.' },
      { judul: 'Kenapa email Google.', isi: 'Hanya untuk mengenali akun yang sama saat kamu masuk lagi. Kami tidak mengirim email pemasaran.' },
      { judul: 'Menghapus akun.', isi: 'Kamu bisa minta seluruh data dihapus lewat bot. Riwayat pembayaran disimpan selama diwajibkan hukum.' },
      { judul: 'Pihak ketiga.', isi: 'Telegram, Google, dan penyedia data pasar. Kami tidak menjual data ke siapa pun.' },
    ],
  },
};

export function ambilDokumen(kunci: 'syarat' | 'privasi'): Dokumen {
  const d = DOKUMEN[kunci];
  if (d === undefined) throw new Error(`dokumen ${kunci} tidak ada`);
  return d;
}
