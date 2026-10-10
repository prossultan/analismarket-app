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

/**
 * PANTAUAN PER AKUN — sama untuk SEMUA akun, berlangganan atau tidak.
 *
 * Disalin dari `MAKS_WATCH` di `src/db/notif.ts` bot (dinaikkan 3 -> 10 pada
 * 4 Sep, dan AM+ tidak menambahnya). FAQ app masih berbunyi "Tiga pantauan
 * pertama gratis; AM+ membuka sisanya" sampai 3 Okt — dua kebohongan dalam
 * satu kalimat. `skrip/uji-keputusan.mjs` mencocokkan angka ini dengan bot.
 */
export const MAKS_PANTAUAN = 10;

/**
 * Yang TETAP gratis. Layar AM+ mencetak `nama` saja, jadi `nama` sendiri
 * harus benar tanpa keterangannya.
 *
 * Dua baris dikoreksi 3 Okt, diukur dari `/api/pasar` produksi (155 pasar):
 * - "Semua pasar m15 ke atas" — cuma 31 dari 155 pasar yang punya m15;
 *   56 mulai dari h1 dan 68 dari h4 (tujuh forex: h4 ke atas, selain
 *   m1/m5). Tiap pasar terbuka di timeframe yang ia punya.
 * - "Cek token DEX" — hanya ada di bot Telegram, tidak ada di app.
 */
export const FITUR_GRATIS: readonly Fitur[] = [
  { nama: 'Semua pasar, di timeframe yang tersedia', keterangan: 'termasuk emas dan forex' },
  { nama: 'm1 dan m5 kripto', keterangan: 'tanpa batas' },
  { nama: `${String(MAKS_PANTAUAN)} pantauan`, keterangan: 'sama untuk semua akun' },
  { nama: 'Kelima mesin analisa', keterangan: 'snr, smc, ema200, ichimoku, fibonacci' },
  { nama: 'Cek token DEX di bot Telegram', keterangan: 'belum ada di app' },
];

/**
 * Isi AM+. Harga, isi paket, "termasuk m5", dan "antrean prioritas" adalah
 * keputusan pemilik — tidak disentuh di sini.
 *
 * Dua baris dikoreksi 3 Okt:
 * - Cek Banyak memeriksa 12 SLOT pasangan pasar × timeframe
 *   (`MAKS_SLOT_CEK_BANYAK` di bot), bukan 12 pasar di segala timeframe.
 * - Irama kabar cuma bisa diatur dari bot; app hanya punya jam sunyi.
 */
export const FITUR_PLUS: readonly Fitur[] = [
  { nama: 'Kabar Otomatis', keterangan: 'pasar dipantau otomatis, termasuk m5' },
  { nama: 'Cek Banyak', keterangan: 'sampai 12 pasar × timeframe sekali tekan, satu tabel' },
  { nama: 'm1 & m5 emas/forex', keterangan: '20 analisa sehari' },
  { nama: 'Antrean prioritas', keterangan: 'kartumu duluan kalau bot lagi ramai' },
  { nama: 'Jam sunyi kabar otomatis', keterangan: 'diatur sendiri; irama kabar diatur di bot Telegram' },
  { nama: 'Rangkuman pagi', keterangan: 'semalam apa saja yang bunyi, satu pesan' },
];

/**
 * Judul kartu AM+ untuk yang belum berlangganan. BUKAN "Pantauan otomatis,
 * tanpa membuka app": pantauan biasa sudah mengabari HP tanpa membuka app,
 * gratis. Yang dibeli AM+ adalah cakupan — pasar dipantau tanpa dipasang.
 */
export const JUDUL_PLUS = 'Pasar dipantau otomatis, tanpa memasang satu-satu';

/**
 * Tiga manfaat di kartu AM+ Home — DITURUNKAN dari `FITUR_PLUS`, bukan
 * diketik. Kartu itu sempat menjual "Kabar ke HP saat syarat setup lolos"
 * sebagai manfaat berbayar, padahal push untuk pantauan biasa gratis; daftar
 * yang diketik di layar tidak punya satu pun tempat yang menahannya.
 */
export const MANFAAT_KARTU_PLUS: readonly string[] = FITUR_PLUS.slice(0, 3).map((f) => `${f.nama} — ${f.keterangan}`);

export type Tanya = { t: string; j: string };

/**
 * FAQ layar AM+. Bercabang pada build:
 *
 * - tautan unduhan: termasuk cara bayarnya — sekali di muka, TANPA potong
 *   otomatis (S&K app `dokumen.ts`, web, dan `plusHalaman` bot berkata sama).
 *   FAQ app sempat berbunyi "ditagih bulanan dan berhenti di akhir periode",
 *   menjanjikan langganan berulang yang tidak pernah ada.
 * - build Play: tanpa satu kalimat pun soal pembayaran (kebijakan Play).
 */
export function tanyaPlus(tokoPlay: boolean): readonly Tanya[] {
  const bayar: Tanya = {
    t: 'Apakah diperpanjang otomatis?',
    j: 'Tidak. AnalisMarket+ dibayar sekali di muka untuk masa aktifnya, tanpa potong otomatis. Sesudah habis, akun kembali ke paket gratis dan setelanmu tetap tersimpan.',
  };
  const umum: Tanya[] = [
    { t: 'Apa bedanya dengan bot Telegram?', j: 'Sama mesinnya, sama angkanya. AM+ menambah kabar otomatis dan cek banyak pasar.' },
    { t: 'Apakah ini memprediksi harga?', j: 'Tidak. Ini alat baca chart. Ia menilai kondisi sekarang, bukan meramal yang berikutnya.' },
    { t: 'Lewat mana kabarnya dikirim?', j: 'Ke HP ini lewat notifikasi. Kalau HP tidak terdaftar dan Telegram tersambung, lewat Telegram.' },
    {
      t: 'Pantauan gratis tetap ada?',
      j: `Ada. Tiap akun dapat ${String(MAKS_PANTAUAN)} pantauan, berlangganan atau tidak. AM+ menambah kabar otomatis: pasar dipantau tanpa dipasang satu-satu.`,
    },
  ];
  return tokoPlay ? umum : [bayar, ...umum];
}

/**
 * "Yang terbuka sekarang" di layar akun sesudah masuk. Bercabang pada status:
 * kabar otomatis HANYA disebut untuk pelanggan — baris lamanya "Pantauan dan
 * kabar otomatis" menjanjikannya ke semua akun. Status `null` (belum
 * diketahui) diperlakukan seperti bukan pelanggan: yang tidak diketahui
 * tidak dijanjikan.
 */
export function terbukaSekarang(status: 'plus' | 'gratis' | null): ReadonlyArray<readonly [string, string]> {
  const daftar: Array<readonly [string, string]> = [
    ['Pantauan', `${String(MAKS_PANTAUAN)} pantauan, dikabari ke HP ini saat syarat setup lolos, tanpa membuka app.`],
    /* Setelan bawaan app disimpan DI PERANGKAT (`simpan.ts`), bukan di akun —
       kalimat lamanya "sama di app dan web" tidak pernah benar. */
    ['Setelan bawaan', 'Pasar, timeframe, dan mesin bawaan tersimpan di HP ini, tidak ikut ke web atau HP lain.'],
    ['Status AM+', 'Terbaca di Home dan Profil.'],
  ];
  if (status === 'plus') daftar.splice(1, 0, ['Kabar otomatis', 'Bagian dari AnalisMarket+, terbuka di akunmu.']);
  return daftar;
}

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

/**
 * KEPUTUSAN PEMILIK 10 Okt 2026 — app versi Play (satu app untuk semua)
 * MENYEBUT cara bayar lewat web dan bot Telegram untuk sementara, sampai
 * Google Play Billing dipasang di update berikutnya.
 *
 * Pemilik sudah diberi tahu risikonya, dua kali, sebelum memutuskan: kebijakan
 * pembayaran Play melarang mengarahkan pembelian barang digital ke luar app.
 * Update bisa ditolak saat review, app bisa diturunkan, dan pelanggaran
 * berulang bisa membekukan akun developer. KALAU DITOLAK: ubah ke `false`,
 * build ulang, kirim ulang — app kembali ke wajah lama (status saja, tanpa
 * cara bayar). Harga TETAP tidak dicetak di build Play (`hargaPlus`): yang
 * disebut cuma jalannya, angkanya ada di web.
 */
export const CARA_BAYAR_DI_PLAY = true;

/** Boleh menyebut cara bayar di build ini? Build tautan unduhan selalu boleh. */
export function bolehSebutBayar(tokoPlay: boolean, izinPlay: boolean): boolean {
  return !tokoPlay || izinPlay;
}
export const SEBUT_BAYAR = bolehSebutBayar(TOKO_PLAY, CARA_BAYAR_DI_PLAY);

const WEB_BAYAR = 'https://analismarket.com';
/**
 * `tautan` cuma untuk halaman kita sendiri (periksa-teks: app tidak membuka tautan keluar),
 * jadi jalur bot berupa petunjuk tanpa tautan. `segera` = belum bisa dipakai.
 */
export type JalurBayar = { kode: 'web' | 'bot' | 'app'; judul: string; ket: string; tautan: string | null; segera: boolean };

/**
 * Jalur bayar AM+ yang ditampilkan — SATU sumber untuk layar Berlangganan,
 * AnalisMarket+, dan Akademi. `paketKode` membawa masa aktif yang dipilih ke
 * halaman bayar web (/bayar/plus?paket=3B); null = biar dipilih di web.
 * "Langsung di app" selalu ada dan selalu belum aktif: itu janji Play Billing
 * yang sedang dikerjakan, bukan tombol.
 */
export function jalurBayar(boleh: boolean, bot: string, paketKode: string | null): JalurBayar[] {
  const app: JalurBayar = { kode: 'app', judul: 'Langsung di app', ket: 'Segera hadir', tautan: null, segera: true };
  if (!boleh) return [app];
  return [
    { kode: 'web', judul: 'Lewat web', ket: 'analismarket.com · masuk dengan akun yang sama', segera: false, tautan: `${WEB_BAYAR}/bayar/plus${paketKode === null ? '' : `?paket=${encodeURIComponent(paketKode)}`}` },
    { kode: 'bot', judul: 'Lewat bot Telegram', ket: `Kirim /plus ke @${bot}`, tautan: null, segera: false },
    app,
  ];
}

/** Kunci bab Akses penuh: kalimatnya dan, kalau boleh, halaman belinya di web. */
export function beliAksesPenuh(boleh: boolean): { ket: string; tautan: string | null } {
  return boleh
    ? { ket: 'Terbuka dengan Akses penuh — sekali bayar, beli lewat web.', tautan: `${WEB_BAYAR}/bayar/akademi` }
    : { ket: 'Terbuka dengan Akses penuh — pembelian di app segera hadir.', tautan: null };
}

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
