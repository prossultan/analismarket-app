/**
 * CERMINAN TypeScript dari sistem desain.
 *
 * YANG KANONIS berkas CSS-nya:
 *   opendesign/design-systems/analismarket/tokens/colors_and_type.css
 *
 * React Native tidak membaca CSS, jadi nilainya ada dua kali. Kalau keduanya
 * berbeda, yang salah BERKAS INI — bukan yang CSS. Aturan lengkapnya (enam
 * butir, masing-masing lahir dari sesuatu yang pernah rusak) ada di
 * `SKILL.md` sebelah berkas itu.
 */

export const W = {
  /** obsidian hangat — latar halaman */
  latar: '#0C0B09',
  latar900: '#11100D',
  /** permukaan kartu */
  kartu: '#161512',
  kartuTerang: '#1C1A17',
  garis: '#252321',
  garisSamar: 'rgba(255,255,255,0.06)',

  teks: '#CFCECB',
  teksKuat: '#E8E7E5',
  teksRedup: '#A7A4A1',
  teksSamar: '#84827E',

  naik: '#10B981',
  turun: '#F43F5E',
  tanda: '#FD9829',

  /**
   * EMAS CUMA UNTUK AnalisMarket+.
   *
   * Bukan selera. Di web emas berarti satu hal saja, dan begitu ia dipakai
   * untuk "terpilih" juga, ia berhenti berarti apa pun. Keadaan terpilih
   * memakai `teksKuat` — putih hangat, bukan emas.
   */
  plus: '#C9A961',
  plusRedup: 'rgba(201,169,97,0.14)',

  /* ── Warna yang sebelumnya diketik mentah di layar ────────────────────
     Enam nilai tersebar di lima berkas. Yang tersebar akan menyimpang. */
  /** HANYA di balik kanvas chart — bukan latar halaman. */
  chart: '#0B0B0D',
  /** Tepi dan latar blok "yang belum lolos". */
  turunTepi: 'rgba(244,63,94,0.25)',
  turunLatar: 'rgba(244,63,94,0.08)',
  /** Tirai di belakang lapisan bacaan. Tipis, supaya kendali di baliknya
      tetap terbaca — keduanya masih hidup saat lapisan terbuka. */
  tirai: 'rgba(0,0,0,0.45)',
  /** Isian chip netral dan bar biaya kosong. */
  isiSamar: 'rgba(255,255,255,0.05)',
  isiSamarKuat: 'rgba(255,255,255,0.06)',
} as const;

/**
 * TANGGA HURUF MOBILE — disalin dari `.mobil` di `mobil.css`, bukan
 * diturunkan dari tangga desktop.
 *
 * Web punya DUA tangga: desktop (20/18/14/13/12/10) dan mobile
 * (19/15/13/12/10/9). App adalah permukaan mobile, jadi yang benar tangga
 * yang kedua. Memakai yang pertama membuat app terbaca satu tingkat lebih
 * besar daripada web di HP yang sama — dan "kurang lebih sama" adalah cara
 * paling halus membuat dua permukaan terasa bukan satu produk.
 */
export const H = {
  /** satu-satunya angka terbesar */
  harga: 19,
  /** kata status */
  status: 15,
  /** nama pasar */
  pasar: 13,
  /** entry, sl, tp, ATR, RR, timeframe, nama mesin */
  nilai: 12,
  /** toolbar */
  alat: 10,
  /** label soft, dan mikro */
  label: 9,
  /* Nama lama, dipertahankan supaya layar yang belum disamakan tidak pecah. */
  nama: 13,
  kontrol: 12,
} as const;

/**
 * TINGGI KOMPONEN — diturunkan dari isinya, bukan angka bulat yang kebetulan
 * cukup di satu HP. Tinggi yang ditebak memotong huruf berekor, dan itu
 * tidak terlihat dari kode.
 */
export const SENTUH = 44;
export const TINGGI_BARIS = 52;
/** 6+6 padding + 16 lineHeight + 2 garis. */
export const TINGGI_CHIP = 30;
/** Tombol di baris kendali chart. */
export const TINGGI_KENDALI = 40;
/** Bilah navigasi bawah. */
/** Bilah tab PIL melayang (mockup home-2026/kisi): 64 tinggi, 12 dari tepi
    kiri/kanan, 10 di atas jarak aman. */
export const TINGGI_BILAH = 64;
export const TEPI_BILAH = 12;
export const ANGKAT_BILAH = 10;
/** Bar biaya. */
export const TINGGI_BAR = 6;

/**
 * TALANG TEPI LAYAR — satu angka untuk seluruh app.
 *
 * Terukur sebelum ditokenkan: angka 14 diketik mentah di 18 tempat. Talang
 * yang berbeda antar layar terbaca sebagai layar yang bergeser saat dipindah.
 */
/**
 * JARAK BAWAH yang WAJIB diberikan tiap layar bertab.
 *
 * Bilah tab MELAYANG (`position: absolute`) supaya isi lewat di bawahnya dan
 * kacanya punya bahan untuk dikaburkan. Harganya: baris terakhir tiap layar
 * berada di bawah bilah dan tidak bisa dijangkau — kecuali layarnya
 * menyisakan ruang sebesar ini di ujung gulirannya.
 *
 * Diketik sekali di sini, bukan di sepuluh layar. Yang tersebar akan
 * menyimpang, dan yang menyimpang menyembunyikan baris terakhir di satu
 * layar saja — persis jenis cacat yang tidak pernah dilaporkan sebagai bug.
 */
export const SISA_BILAH = TINGGI_BILAH + 8;

export const TALANG = 11;
/** Jarak antar chip dan antar tab. Terukur diketik mentah di 16 tempat. */
export const SELA_CHIP = 6;

/**
 * KACA — permukaan tembus pandang untuk lapisan yang MENGAMBANG.
 *
 * Aturannya satu kalimat: kaca itu chrome, bukan isi. Bilah navigasi, bilah
 * tab, dan lembar bawah tembus pandang; isi halaman duduk padat di atas
 * dasar. Kaca ditumpuk di atas kaca jadi bubur.
 *
 * Yang membuat kaca TERBACA bukan angka blur-nya melainkan apa yang ada di
 * baliknya. Karena itu `tabBarStyle` WAJIB `position: absolute` dan tiap
 * layar memberi jarak bawah sebesar `TINGGI_BILAH` — supaya isi benar-benar
 * lewat di bawah bilahnya. Tanpa itu yang disaring cuma latar kosong, dan
 * hasilnya terlihat persis seperti panel abu biasa.
 */
export const KACA = {
  /** Bilah: isi di baliknya harus tetap terbaca. */
  /* Intensitas dinaikkan (34 → 68): mockup memakai blur(26px), dan di
     expo-blur angka 34 setara ~10px — separuhnya. Di HP pemilik kaca tidak
     terlihat sama sekali; sebagian karena ini, sebagian karena warnanya
     dicat DI ATAS blur (lihat Kaca.tsx). */
  tipis: { intensitas: 68, warna: 'rgba(26,24,21,0.44)' },
  /** Lembar: ia menutupi sesuatu, jadi lebih pekat. */
  tebal: { intensitas: 84, warna: 'rgba(20,19,16,0.66)' },
  /** Garis rambut atas — kilau tepi yang membuat kaca punya ketebalan. */
  tepi: 'rgba(255,255,255,0.16)',
  rim: 'rgba(255,255,255,0.15)',
} as const;

export const J = { x1: 4, x2: 8, x3: 12, x4: 18, x5: 26 } as const;
export const R = { kecil: 4, sedang: 6, besar: 8, kartu: 12, bulat: 999 } as const;

/**
 * Angka TIDAK BOLEH bergeser saat digitnya berubah. Dipasang di tiap harga,
 * level, dan RR — bukan di gaya dasar, supaya yang bukan angka tidak ikut.
 */
export const ANGKA = { fontVariant: ['tabular-nums' as const] };

/**
 * Label: 9px/400, huruf besar, jarak 0,12em — persis `.mobil .plan .lbl`.
 * Label tidak pernah lebih tebal daripada nilainya.
 */
export const gayaLabel = {
  fontSize: H.label,
  fontWeight: '400' as const,
  color: W.teksSamar,
  letterSpacing: 1.1,
  textTransform: 'uppercase' as const,
};

export const gayaNilai = {
  fontSize: H.nilai,
  fontWeight: '500' as const,
  color: W.teksKuat,
  ...ANGKA,
};

/** Ivory — satu-satunya isian tombol utama di web. Bukan putih murni. */
export const IVORY = '#EEECEA';
